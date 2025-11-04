/**
 * AI Categorization Service
 * Uses OpenAI GPT-4o mini to categorize ingredients into predefined categories
 */

import OpenAI from "openai";
import type { IngredientCategory } from "@/types";
import { INGREDIENT_CATEGORIES } from "@/types";

/**
 * Result of AI categorization attempt
 */
export interface CategorizationResult {
  success: boolean;
  categories: Map<string, IngredientCategory>;
  error?: string;
}

/**
 * Maximum number of ingredients allowed per AI request
 */
const MAX_INGREDIENTS_PER_REQUEST = 100;

/**
 * Timeout for OpenAI API call in milliseconds
 */
const OPENAI_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Number of retry attempts
 */
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Helper function to sleep for a given duration
 * @param ms - Milliseconds to sleep
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Validate that a category string is a valid IngredientCategory
 */
const isValidCategory = (category: string): category is IngredientCategory => {
  return INGREDIENT_CATEGORIES.includes(category as IngredientCategory);
};

/**
 * Create OpenAI client instance
 */
const getOpenAIClient = (): OpenAI => {
  const apiKey = import.meta.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  return new OpenAI({
    apiKey,
    timeout: OPENAI_TIMEOUT_MS,
  });
};

/**
 * Call OpenAI API to categorize ingredients
 * @param ingredients - Array of ingredient names (normalized)
 * @returns Map of ingredient name to category
 */
const callOpenAI = async (ingredients: string[]): Promise<Map<string, IngredientCategory>> => {
  const openai = getOpenAIClient();

  // Build numbered list of ingredients for the prompt
  const ingredientsList = ingredients.map((ing, index) => `${index + 1}. ${ing}`).join("\n");

  // System prompt with category instructions
  const systemPrompt = `Kategoryzuj składniki do kategorii: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne.
Zwróć JSON w formacie: {"1": "kategoria", "2": "kategoria", ...} gdzie numer to pozycja składnika z listy.
Kategorie muszą być dokładnie: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne (wielkość liter ma znaczenie).`;

  const userPrompt = `Kategoryzuj następujące składniki:\n${ingredientsList}`;

  // Call OpenAI API
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    max_tokens: 500,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    response_format: { type: "json_object" },
  });

  // Parse response
  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  let parsedResponse: Record<string, string>;
  try {
    parsedResponse = JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse OpenAI response as JSON: ${error}`);
  }

  // Map response to ingredients
  const categoriesMap = new Map<string, IngredientCategory>();

  ingredients.forEach((ingredient, index) => {
    const key = String(index + 1); // OpenAI uses 1-indexed keys
    const category = parsedResponse[key];

    // Validate category
    if (category && isValidCategory(category)) {
      categoriesMap.set(ingredient, category);
    } else {
      // Invalid category - fallback to "Inne"
      console.warn(
        `[AI Categorization] Invalid category "${category}" for ingredient "${ingredient}". Using fallback "Inne".`
      );
      categoriesMap.set(ingredient, "Inne");
    }
  });

  return categoriesMap;
};

/**
 * Categorize ingredients with retry logic and fallback
 *
 * @param ingredients - Array of ingredient names (should be normalized: lowercase, trimmed)
 * @returns CategorizationResult with success status and category mappings
 *
 * @example
 * ```typescript
 * const result = await categorizeIngredientsWithRetry(['jajka', 'mleko', 'chleb']);
 * if (result.success) {
 *   console.log('Categories:', result.categories);
 * } else {
 *   console.error('Categorization failed:', result.error);
 *   // All items will have category "Inne"
 * }
 * ```
 */
export async function categorizeIngredientsWithRetry(
  ingredients: string[]
): Promise<CategorizationResult> {
  // Validate input
  if (ingredients.length === 0) {
    return {
      success: true,
      categories: new Map(),
    };
  }

  if (ingredients.length > MAX_INGREDIENTS_PER_REQUEST) {
    const error = `Too many ingredients. Maximum ${MAX_INGREDIENTS_PER_REQUEST} allowed, got ${ingredients.length}`;
    console.error(`[AI Categorization] ${error}`);

    // Fallback: all items → "Inne"
    const fallbackCategories = new Map<string, IngredientCategory>();
    ingredients.forEach((ing) => {
      fallbackCategories.set(ing, "Inne");
    });

    return {
      success: false,
      categories: fallbackCategories,
      error,
    };
  }

  // Retry loop with exponential backoff
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      console.log(`[AI Categorization] Attempt ${attempt}/${MAX_RETRY_ATTEMPTS} for ${ingredients.length} ingredients`);

      const categories = await callOpenAI(ingredients);

      console.log(`[AI Categorization] Success on attempt ${attempt}`);
      return {
        success: true,
        categories,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[AI Categorization] Attempt ${attempt} failed:`, lastError.message);

      // If not the last attempt, wait before retrying
      if (attempt < MAX_RETRY_ATTEMPTS) {
        const backoffMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s
        console.log(`[AI Categorization] Retrying in ${backoffMs}ms...`);
        await sleep(backoffMs);
      }
    }
  }

  // All retries failed - fallback to "Inne" for all items
  console.error(
    `[AI Categorization] All ${MAX_RETRY_ATTEMPTS} attempts failed. Using fallback category "Inne" for all items.`
  );

  const fallbackCategories = new Map<string, IngredientCategory>();
  ingredients.forEach((ing) => {
    fallbackCategories.set(ing, "Inne");
  });

  return {
    success: false,
    categories: fallbackCategories,
    error: lastError?.message || "Unknown error after all retries",
  };
}
