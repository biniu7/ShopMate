import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type {
  CreateRecipeDto,
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
  const recipes: RecipeListItemDto[] = (data || []).map((recipe: any) => ({
    id: recipe.id,
    name: recipe.name,
    ingredients_count: recipe.ingredients?.[0]?.count ?? 0,
    created_at: recipe.created_at,
    updated_at: recipe.updated_at,
  }));

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
