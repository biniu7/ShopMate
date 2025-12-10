/**
 * Shopping List Preview Service
 * Handles generation of shopping list preview from recipes or meal plan
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type {
  ShoppingListPreviewRequestDto,
  ShoppingListPreviewResponseDto,
  ShoppingListItemPreviewDto,
  ShoppingListPreviewMetadataDto,
  CalendarSelectionDto,
  IngredientCategory,
  MealType,
} from "@/types";
import { INGREDIENT_CATEGORIES } from "@/types";
import { categorizeIngredientsWithRetry } from "./ai-categorization.service";

/**
 * Raw ingredient from database (before aggregation)
 */
interface RawIngredient {
  name: string;
  quantity: number | null;
  unit: string | null;
  recipe_id: string;
}

/**
 * Aggregated ingredient (after grouping by name + unit)
 */
interface AggregatedIngredient {
  originalName: string; // Case preserved for display
  normalizedName: string; // Lowercase for comparison
  quantity: number | null;
  unit: string | null;
}

/**
 * Normalize ingredient name for comparison
 * @param name - Ingredient name
 * @returns Normalized name (trimmed, lowercase)
 */
function normalizeIngredientName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Fetch recipe IDs from meal plan based on calendar selections
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param weekStartDate - Week start date (YYYY-MM-DD, Monday)
 * @param selections - Array of day + meal type selections
 * @returns Array of unique recipe IDs
 */
export async function fetchRecipeIdsFromCalendar(
  supabase: SupabaseClient,
  userId: string,
  weekStartDate: string,
  selections: CalendarSelectionDto[]
): Promise<string[]> {
  // Build array of (day_of_week, meal_type) tuples for filtering
  const filters: { day: number; meal: MealType }[] = [];

  for (const selection of selections) {
    for (const mealType of selection.meal_types) {
      filters.push({
        day: selection.day_of_week,
        meal: mealType,
      });
    }
  }

  if (filters.length === 0) {
    return [];
  }

  // Fetch meal plan entries matching the filters
  // Note: Supabase doesn't support tuple IN queries directly, so we use OR conditions
  let query = supabase.from("meal_plan").select("recipe_id").eq("user_id", userId).eq("week_start_date", weekStartDate);

  // Build OR conditions for (day_of_week, meal_type) combinations
  const orConditions = filters.map((f) => `and(day_of_week.eq.${f.day},meal_type.eq.${f.meal})`).join(",");

  query = query.or(orConditions);

  const { data, error } = await query;

  if (error) {
    console.error("[Shopping List Preview] Error fetching recipe IDs from meal plan:", error);
    throw new Error(`Failed to fetch recipe IDs: ${error.message}`);
  }

  // Extract unique recipe IDs
  const recipeIds = [...new Set(data?.map((row) => row.recipe_id) || [])];

  // console.log(
  //   `[Shopping List Preview] Found ${recipeIds.length} unique recipes from ${filters.length} meal selections`
  // );

  return recipeIds;
}

/**
 * Fetch ingredients by recipe IDs with RLS protection
 *
 * @param supabase - Supabase client
 * @param userId - User ID (for RLS verification)
 * @param recipeIds - Array of recipe UUIDs
 * @returns Array of raw ingredients
 */
export async function fetchIngredientsByRecipeIds(
  supabase: SupabaseClient,
  userId: string,
  recipeIds: string[]
): Promise<RawIngredient[]> {
  if (recipeIds.length === 0) {
    return [];
  }

  // Fetch ingredients with recipe ownership check (RLS handles this automatically)
  // JOIN with recipes to ensure user owns the recipes
  const { data, error } = await supabase
    .from("ingredients")
    .select(
      `
      name,
      quantity,
      unit,
      recipe_id,
      recipes!inner(user_id)
    `
    )
    .in("recipe_id", recipeIds)
    .eq("recipes.user_id", userId)
    .order("recipe_id")
    .order("sort_order");

  if (error) {
    console.error("[Shopping List Preview] Error fetching ingredients:", error);
    throw new Error(`Failed to fetch ingredients: ${error.message}`);
  }

  const ingredients: RawIngredient[] =
    data?.map((row) => ({
      name: row.name,
      quantity: row.quantity,
      unit: row.unit,
      recipe_id: row.recipe_id,
    })) || [];

  // console.log(`[Shopping List Preview] Fetched ${ingredients.length} ingredients from ${recipeIds.length} recipes`);

  return ingredients;
}

/**
 * Aggregate ingredients by normalized name + unit
 * Sums quantities where possible, sets to null if mixed types
 *
 * @param rawIngredients - Array of raw ingredients from database
 * @returns Array of aggregated ingredients
 */
export function aggregateIngredients(rawIngredients: RawIngredient[]): AggregatedIngredient[] {
  // Group by normalized name + unit
  const aggregationMap = new Map<
    string,
    {
      originalName: string;
      normalizedName: string;
      unit: string | null;
      quantities: (number | null)[];
    }
  >();

  for (const ingredient of rawIngredients) {
    const normalizedName = normalizeIngredientName(ingredient.name);
    const unit = ingredient.unit;

    // Create unique key for grouping: normalizedName + unit
    // Note: null unit is treated as a separate group
    const key = `${normalizedName}|||${unit || "NULL"}`;

    if (!aggregationMap.has(key)) {
      aggregationMap.set(key, {
        originalName: ingredient.name, // Use first occurrence for display
        normalizedName,
        unit,
        quantities: [],
      });
    }

    // Safe to assert existence after has() check, but use safe access for ESLint
    const entry = aggregationMap.get(key);
    if (entry) {
      entry.quantities.push(ingredient.quantity);
    }
  }

  // Aggregate quantities
  const aggregated: AggregatedIngredient[] = [];

  for (const group of aggregationMap.values()) {
    const { originalName, normalizedName, unit, quantities } = group;

    // Calculate aggregated quantity
    let aggregatedQuantity: number | null = null;

    // Check if all quantities are numbers or all are null
    const hasNull = quantities.some((q) => q === null);
    const hasNumber = quantities.some((q) => q !== null);

    if (hasNumber && !hasNull) {
      // All quantities are numbers - sum them
      // Type assertion safe because hasNumber && !hasNull guarantees all are numbers
      aggregatedQuantity = quantities.reduce<number>((sum, q) => sum + (q as number), 0);
    } else if (hasNumber && hasNull) {
      // Mixed null and numbers - cannot aggregate, set to null
      aggregatedQuantity = null;
    } else {
      // All null - keep null
      aggregatedQuantity = null;
    }

    aggregated.push({
      originalName,
      normalizedName,
      quantity: aggregatedQuantity,
      unit,
    });
  }

  // console.log(
  //   `[Shopping List Preview] Aggregated ${rawIngredients.length} ingredients into ${aggregated.length} unique items`
  // );

  return aggregated;
}

/**
 * Sort ingredients by category order, then alphabetically within category
 * Assigns sort_order within each category
 *
 * @param items - Items with assigned categories
 * @returns Sorted items with sort_order assigned
 */
export function sortIngredientsByCategory(
  items: {
    ingredient_name: string;
    quantity: number | null;
    unit: string | null;
    category: IngredientCategory;
  }[]
): ShoppingListItemPreviewDto[] {
  // Define category order (as per INGREDIENT_CATEGORIES)
  const categoryOrder = INGREDIENT_CATEGORIES;

  // Sort by category order, then alphabetically within category
  const sorted = [...items].sort((a, b) => {
    const categoryIndexA = categoryOrder.indexOf(a.category);
    const categoryIndexB = categoryOrder.indexOf(b.category);

    if (categoryIndexA !== categoryIndexB) {
      return categoryIndexA - categoryIndexB;
    }

    // Same category - sort alphabetically
    return a.ingredient_name.localeCompare(b.ingredient_name, "pl");
  });

  // Assign sort_order within each category
  const result: ShoppingListItemPreviewDto[] = [];
  let currentCategory: IngredientCategory | null = null;
  let sortOrderInCategory = 0;

  for (const item of sorted) {
    if (item.category !== currentCategory) {
      currentCategory = item.category;
      sortOrderInCategory = 0;
    }

    result.push({
      ingredient_name: item.ingredient_name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      sort_order: sortOrderInCategory,
    });

    sortOrderInCategory++;
  }

  return result;
}

/**
 * Generate shopping list preview from request
 *
 * Main orchestration function that:
 * 1. Fetches ingredients based on source (calendar or recipes)
 * 2. Aggregates ingredients
 * 3. Categorizes with AI
 * 4. Sorts and returns preview
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param request - Validated request DTO
 * @returns Shopping list preview response
 * @throws Error if no recipes found or database errors
 */
export async function generateShoppingListPreview(
  supabase: SupabaseClient,
  userId: string,
  request: ShoppingListPreviewRequestDto
): Promise<ShoppingListPreviewResponseDto> {
  // console.log(`[Shopping List Preview] Generating preview for source: ${request.source}`);

  // Step 1: Fetch recipe IDs based on source
  let recipeIds: string[];
  let skippedEmptyMeals = 0;

  if (request.source === "calendar") {
    const totalSelections = request.selections.reduce((sum, s) => sum + s.meal_types.length, 0);

    recipeIds = await fetchRecipeIdsFromCalendar(supabase, userId, request.week_start_date, request.selections);

    skippedEmptyMeals = totalSelections - recipeIds.length;
  } else {
    // source === "recipes"
    recipeIds = request.recipe_ids;
  }

  // Step 2: Check if we have any recipes
  if (recipeIds.length === 0) {
    throw new Error("No recipes found");
  }

  // Step 3: Fetch ingredients
  const rawIngredients = await fetchIngredientsByRecipeIds(supabase, userId, recipeIds);

  if (rawIngredients.length === 0) {
    throw new Error("No recipes found");
  }

  // Step 4: Aggregate ingredients
  const aggregated = aggregateIngredients(rawIngredients);

  // Step 5: AI Categorization
  const ingredientNames = aggregated.map((ing) => ing.normalizedName);
  const categorizationResult = await categorizeIngredientsWithRetry(ingredientNames);

  // Step 6: Merge categories with aggregated data
  const itemsWithCategories = aggregated.map((ing) => ({
    ingredient_name: ing.originalName,
    quantity: ing.quantity,
    unit: ing.unit,
    category: categorizationResult.categories.get(ing.normalizedName) || "Inne",
  }));

  // Step 7: Sort by category
  const sortedItems = sortIngredientsByCategory(itemsWithCategories);

  // Step 8: Build metadata
  const metadata: ShoppingListPreviewMetadataDto = {
    source: request.source,
    week_start_date: request.source === "calendar" ? request.week_start_date : undefined,
    total_recipes: recipeIds.length,
    total_items: sortedItems.length,
    ai_categorization_status: categorizationResult.success ? "success" : "failed",
    ai_error: categorizationResult.error,
    skipped_empty_meals: request.source === "calendar" ? skippedEmptyMeals : undefined,
  };

  // console.log(
  //   `[Shopping List Preview] Preview generated successfully. ${sortedItems.length} items, AI status: ${metadata.ai_categorization_status}`
  // );

  return {
    items: sortedItems,
    metadata,
  };
}
