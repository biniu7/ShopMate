/**
 * API functions for recipes
 * Handles CRUD operations for recipes
 */
import type { PaginatedResponse, RecipeListItemDto, RecipeResponseDto, RecipeSortOption } from "@/types";
import type { RecipeSchemaType } from "@/lib/validation/recipe.schema";

/**
 * Fetch recipes list with pagination, search and sorting
 *
 * @param params - Query parameters (search, sort, page, limit)
 * @returns Paginated recipes list
 * @throws Error if request fails
 */
export async function fetchRecipes(params: {
  search?: string;
  sort?: RecipeSortOption;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<RecipeListItemDto>> {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set("search", params.search);
  }
  if (params.sort) {
    searchParams.set("sort", params.sort);
  }
  if (params.page) {
    searchParams.set("page", params.page.toString());
  }
  if (params.limit) {
    searchParams.set("limit", params.limit.toString());
  }

  const url = `/api/recipes?${searchParams.toString()}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch recipes" }));
    throw new Error(error.error || "Failed to fetch recipes");
  }

  return response.json();
}

/**
 * Fetch single recipe by ID
 *
 * @param recipeId - Recipe ID
 * @returns Recipe with ingredients
 * @throws Error if request fails
 */
export async function fetchRecipe(recipeId: string): Promise<RecipeResponseDto> {
  const response = await fetch(`/api/recipes/${recipeId}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status === 404) {
    throw new Error("Recipe not found");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch recipe" }));
    throw new Error(error.error || "Failed to fetch recipe");
  }

  return response.json();
}

/**
 * Create a new recipe
 *
 * @param data - Recipe data (name, instructions, ingredients)
 * @returns Created recipe with ID
 * @throws Error if request fails
 */
export async function createRecipe(data: RecipeSchemaType): Promise<RecipeResponseDto> {
  const response = await fetch("/api/recipes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to create recipe" }));
    throw new Error(errorData.error || errorData.message || "Failed to create recipe");
  }

  return response.json();
}

/**
 * Update an existing recipe
 *
 * @param recipeId - Recipe ID
 * @param data - Updated recipe data
 * @returns Updated recipe
 * @throws Error if request fails
 */
export async function updateRecipe(recipeId: string, data: RecipeSchemaType): Promise<RecipeResponseDto> {
  const response = await fetch(`/api/recipes/${recipeId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to update recipe" }));
    throw new Error(errorData.error || errorData.message || "Failed to update recipe");
  }

  return response.json();
}

/**
 * Delete a recipe
 *
 * @param recipeId - Recipe ID
 * @returns Success response
 * @throws Error if request fails
 */
export async function deleteRecipe(recipeId: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`/api/recipes/${recipeId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to delete recipe" }));
    throw new Error(errorData.error || errorData.message || "Failed to delete recipe");
  }

  return response.json();
}
