import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type {
  CreateRecipeDto,
  UpdateRecipeDto,
  RecipeResponseDto,
  RecipeListItemDto,
  PaginatedResponse,
  PaginationMetadata,
} from "@/types";
import type { RecipeListQueryInput } from "@/lib/validation/recipe.schema";

type SupabaseClientType = SupabaseClient<Database>;

/**
 * Creates a new recipe with ingredients
 *
 * This function performs the following steps:
 * 1. Insert recipe into the recipes table
 * 2. Bulk insert ingredients into the ingredients table
 * 3. If ingredients insert fails, cleanup by deleting the orphaned recipe
 * 4. Fetch complete recipe with ingredients
 * 5. Sort ingredients by sort_order and return
 *
 * @param supabase - Authenticated Supabase client
 * @param userId - User ID from auth session
 * @param recipeData - Validated recipe data
 * @returns Complete recipe with ingredients
 * @throws Error if database operation fails
 */
export async function createRecipe(
  supabase: SupabaseClientType,
  userId: string,
  recipeData: CreateRecipeDto
): Promise<RecipeResponseDto> {
  // Step 1: Insert recipe
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      user_id: userId,
      name: recipeData.name,
      instructions: recipeData.instructions,
    })
    .select()
    .single();

  if (recipeError || !recipe) {
    console.error("Failed to create recipe:", recipeError);
    throw new Error("Failed to create recipe");
  }

  // Step 2: Prepare ingredients for bulk insert
  const ingredientsToInsert = recipeData.ingredients.map((ingredient) => ({
    recipe_id: recipe.id,
    name: ingredient.name,
    quantity: ingredient.quantity,
    unit: ingredient.unit,
    sort_order: ingredient.sort_order,
  }));

  // Step 3: Bulk insert ingredients
  const { error: ingredientsError } = await supabase.from("ingredients").insert(ingredientsToInsert);

  if (ingredientsError) {
    console.error("Failed to create ingredients:", ingredientsError);

    // Cleanup: Delete the orphaned recipe
    await supabase.from("recipes").delete().eq("id", recipe.id);

    throw new Error("Failed to create ingredients");
  }

  // Step 4: Fetch complete recipe with ingredients
  const { data: completeRecipe, error: fetchError } = await supabase
    .from("recipes")
    .select(
      `
      *,
      ingredients (*)
    `
    )
    .eq("id", recipe.id)
    .single();

  if (fetchError || !completeRecipe) {
    console.error("Failed to fetch created recipe:", fetchError);
    throw new Error("Failed to fetch created recipe");
  }

  // Step 5: Sort ingredients by sort_order
  const sortedIngredients = [...completeRecipe.ingredients].sort((a, b) => a.sort_order - b.sort_order);

  return {
    ...completeRecipe,
    ingredients: sortedIngredients,
    meal_plan_assignments: 0, // Newly created recipe has no assignments
  };
}

/**
 * Get paginated list of user's recipes with search and sorting
 *
 * @param supabase - Authenticated Supabase client
 * @param userId - User ID from auth session
 * @param params - Query parameters (search, sort, page, limit)
 * @returns Paginated response with recipes and metadata
 * @throws Error if database query fails
 */
export async function getRecipesList(
  supabase: SupabaseClientType,
  userId: string,
  params: RecipeListQueryInput
): Promise<PaginatedResponse<RecipeListItemDto>> {
  const { search, sort, page, limit } = params;

  // Build base query
  let query = supabase
    .from("recipes")
    .select(
      `
      id,
      name,
      created_at,
      updated_at,
      ingredients(count)
    `,
      { count: "exact" }
    )
    .eq("user_id", userId);

  // Apply search filter (case-insensitive)
  if (search && search.trim()) {
    query = query.ilike("name", `%${search.trim()}%`);
  }

  // Apply sorting
  const sortConfig = getSortConfig(sort);
  query = query.order(sortConfig.column, { ascending: sortConfig.ascending });

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  // Execute query
  const { data, error, count } = await query;

  if (error) {
    console.error("Database error in getRecipesList:", error);
    throw new Error(`Failed to fetch recipes: ${error.message}`);
  }

  // Transform data to DTOs
  const recipes: RecipeListItemDto[] = (data || []).map(
    (recipe: {
      id: string;
      name: string;
      created_at: string;
      updated_at: string;
      ingredients: { count: number }[];
    }) => ({
      id: recipe.id,
      name: recipe.name,
      ingredients_count: recipe.ingredients?.[0]?.count ?? 0,
      created_at: recipe.created_at,
      updated_at: recipe.updated_at,
    })
  );

  // Calculate pagination metadata
  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);

  const pagination: PaginationMetadata = {
    page,
    limit,
    total,
    total_pages: totalPages,
  };

  return {
    data: recipes,
    pagination,
  };
}

/**
 * Get a single recipe by ID with all ingredients and meal plan assignments count
 *
 * This function:
 * 1. Fetches the recipe (with user_id verification for authorization)
 * 2. Fetches all ingredients sorted by sort_order
 * 3. Counts meal plan assignments for the recipe
 * 4. Returns complete RecipeResponseDto or null if not found
 *
 * @param supabase - Authenticated Supabase client
 * @param recipeId - UUID of the recipe to fetch
 * @param userId - User ID from auth session (for authorization)
 * @returns RecipeResponseDto with ingredients and meal_plan_assignments, or null if not found
 * @throws Error if database operation fails (except for "not found")
 */
export async function getRecipeById(
  supabase: SupabaseClientType,
  recipeId: string,
  userId: string
): Promise<RecipeResponseDto | null> {
  // Step 1: Fetch recipe with user_id verification
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", recipeId)
    .eq("user_id", userId)
    .single();

  // If recipe not found or doesn't belong to user, return null
  if (recipeError || !recipe) {
    return null;
  }

  // Step 2: Fetch ingredients sorted by sort_order
  const { data: ingredients, error: ingredientsError } = await supabase
    .from("ingredients")
    .select("*")
    .eq("recipe_id", recipeId)
    .order("sort_order", { ascending: true });

  if (ingredientsError) {
    console.error("Failed to fetch ingredients:", ingredientsError);
    throw new Error(`Failed to fetch ingredients: ${ingredientsError.message}`);
  }

  // Step 3: Count meal plan assignments
  const { count, error: countError } = await supabase
    .from("meal_plan")
    .select("*", { count: "exact", head: true })
    .eq("recipe_id", recipeId);

  if (countError) {
    console.error("Failed to count meal plan assignments:", countError);
    // Don't throw - this is an optional field, continue with count = 0
  }

  // Step 4: Compose RecipeResponseDto
  return {
    ...recipe,
    ingredients: ingredients || [],
    meal_plan_assignments: count ?? 0,
  };
}

/**
 * Updates an existing recipe with full replacement of ingredients
 *
 * This function performs the following steps:
 * 1. Verify recipe exists and belongs to user
 * 2. Update recipe (name, instructions)
 * 3. Delete all old ingredients
 * 4. Bulk insert new ingredients
 * 5. Fetch complete recipe with ingredients and meal plan count
 *
 * @param supabase - Authenticated Supabase client
 * @param recipeId - UUID of the recipe to update
 * @param userId - User ID from auth session (for ownership verification)
 * @param updateData - Validated recipe data
 * @returns Updated RecipeResponseDto or null if recipe not found
 * @throws Error if database operation fails
 */
export async function updateRecipe(
  supabase: SupabaseClientType,
  recipeId: string,
  userId: string,
  updateData: UpdateRecipeDto
): Promise<RecipeResponseDto | null> {
  // Step 1: Verify recipe exists and belongs to user
  const { data: existing, error: existingError } = await supabase
    .from("recipes")
    .select("id")
    .eq("id", recipeId)
    .eq("user_id", userId)
    .single();

  if (existingError || !existing) {
    return null; // Recipe not found or doesn't belong to user
  }

  // Step 2: Update recipe (name, instructions)
  const { error: updateError } = await supabase
    .from("recipes")
    .update({
      name: updateData.name,
      instructions: updateData.instructions,
    })
    .eq("id", recipeId);

  if (updateError) {
    console.error("Failed to update recipe:", updateError);
    throw new Error("Failed to update recipe");
  }

  // Step 3: Delete all old ingredients
  const { error: deleteError } = await supabase.from("ingredients").delete().eq("recipe_id", recipeId);

  if (deleteError) {
    console.error("Failed to delete ingredients:", deleteError);
    throw new Error("Failed to update ingredients");
  }

  // Step 4: Prepare and bulk insert new ingredients
  const ingredientsToInsert = updateData.ingredients.map((ingredient) => ({
    recipe_id: recipeId,
    name: ingredient.name,
    quantity: ingredient.quantity,
    unit: ingredient.unit,
    sort_order: ingredient.sort_order,
  }));

  const { error: insertError } = await supabase.from("ingredients").insert(ingredientsToInsert);

  if (insertError) {
    console.error("Failed to insert ingredients:", insertError);
    throw new Error("Failed to update ingredients");
  }

  // Step 5: Fetch complete recipe with ingredients
  const { data: completeRecipe, error: fetchError } = await supabase
    .from("recipes")
    .select(
      `
      *,
      ingredients (*)
    `
    )
    .eq("id", recipeId)
    .single();

  if (fetchError || !completeRecipe) {
    console.error("Failed to fetch updated recipe:", fetchError);
    throw new Error("Failed to fetch updated recipe");
  }

  // Sort ingredients by sort_order
  const sortedIngredients = [...completeRecipe.ingredients].sort((a, b) => a.sort_order - b.sort_order);

  // Step 6: Count meal plan assignments
  const { count, error: countError } = await supabase
    .from("meal_plan")
    .select("*", { count: "exact", head: true })
    .eq("recipe_id", recipeId);

  if (countError) {
    console.error("Failed to count meal plan assignments:", countError);
    // Don't throw - this is an optional field, continue with count = 0
  }

  return {
    ...completeRecipe,
    ingredients: sortedIngredients,
    meal_plan_assignments: count ?? 0,
  };
}

/**
 * Deletes a recipe with CASCADE deletion of ingredients and meal plan assignments
 *
 * This function performs the following steps:
 * 1. Count meal plan assignments BEFORE deletion (needed for response)
 * 2. Delete recipe (CASCADE automatically deletes ingredients and meal_plan_assignments)
 * 3. Return the count of deleted meal plan assignments
 *
 * @param supabase - Authenticated Supabase client
 * @param recipeId - UUID of the recipe to delete
 * @param userId - User ID from auth session (for ownership verification)
 * @returns Object with deleted_meal_plan_assignments count, or null if recipe not found
 * @throws Error if database operation fails
 */
export async function deleteRecipe(
  supabase: SupabaseClientType,
  recipeId: string,
  userId: string
): Promise<{ deleted_meal_plan_assignments: number } | null> {
  // Step 1: Count meal plan assignments BEFORE deletion
  const { count, error: countError } = await supabase
    .from("meal_plan")
    .select("*", { count: "exact", head: true })
    .eq("recipe_id", recipeId)
    .eq("user_id", userId);

  if (countError) {
    console.error("Failed to count meal plan assignments:", countError);
    throw new Error("Failed to count meal plan assignments");
  }

  const deletedMealPlanAssignments = count ?? 0;

  // Step 2: Delete recipe (CASCADE will automatically delete ingredients and meal_plan)
  const { data: deletedRecipe, error: deleteError } = await supabase
    .from("recipes")
    .delete()
    .eq("id", recipeId)
    .eq("user_id", userId)
    .select()
    .single();

  // If recipe not found or doesn't belong to user, return null
  if (deleteError || !deletedRecipe) {
    return null;
  }

  // Step 3: Return count of deleted meal plan assignments
  return {
    deleted_meal_plan_assignments: deletedMealPlanAssignments,
  };
}

/**
 * Helper: Map sort parameter to Supabase order config
 */
function getSortConfig(sort: RecipeListQueryInput["sort"]): {
  column: string;
  ascending: boolean;
} {
  const sortMap = {
    name_asc: { column: "name", ascending: true },
    name_desc: { column: "name", ascending: false },
    created_asc: { column: "created_at", ascending: true },
    created_desc: { column: "created_at", ascending: false },
  };

  return sortMap[sort];
}
