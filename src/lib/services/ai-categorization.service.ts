/**
 * AI Categorization Service
 * Uses OpenRouter API (GPT-4o mini) to categorize ingredients into predefined categories
 */

import { OpenRouterService } from "./openrouter";
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
 * Validate that a category string is a valid IngredientCategory
 */
const isValidCategory = (category: string): category is IngredientCategory => {
  return INGREDIENT_CATEGORIES.includes(category as IngredientCategory);
};

/**
 * Call OpenRouter API to categorize ingredients
 * @param ingredients - Array of ingredient names (normalized)
 * @returns Map of ingredient name to category
 */
const callOpenRouter = async (ingredients: string[]): Promise<Map<string, IngredientCategory>> => {
  const service = new OpenRouterService();

  // Prepare ingredients with temporary IDs (using index as ID)
  const ingredientsWithIds = ingredients.map((name, index) => ({
    id: String(index),
    name,
  }));

  // Call OpenRouterService
  const result = await service.categorizeIngredients(ingredientsWithIds);

  // Check if categorization failed
  if (!result.success) {
    throw new Error(result.error?.message || "Categorization failed");
  }

  // Map result back to ingredient names
  const categoriesMap = new Map<string, IngredientCategory>();

  ingredients.forEach((ingredient, index) => {
    const indexKey = String(index);
    const category = result.categories[indexKey];

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
 *   // console.log('Categories:', result.categories);
 * } else {
 *   console.error('Categorization failed:', result.error);
 *   // All items will have category "Inne"
 * }
 * ```
 */
export async function categorizeIngredientsWithRetry(ingredients: string[]): Promise<CategorizationResult> {
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

  // Call OpenRouter service (it has built-in retry mechanism)
  try {
    // console.log(`[AI Categorization] Categorizing ${ingredients.length} ingredients via OpenRouter`);

    const categories = await callOpenRouter(ingredients);

    // console.log(`[AI Categorization] Successfully categorized ${categories.size} ingredients`);
    return {
      success: true,
      categories,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[AI Categorization] Failed to categorize ingredients:`, errorMessage);

    // Fallback: all items → "Inne"
    const fallbackCategories = new Map<string, IngredientCategory>();
    ingredients.forEach((ing) => {
      fallbackCategories.set(ing, "Inne");
    });

    return {
      success: false,
      categories: fallbackCategories,
      error: errorMessage,
    };
  }
}
