/**
 * API functions for recipes
 * Handles fetching recipes list
 */
import type { PaginatedResponse, RecipeListItemDto, RecipeResponseDto } from "@/types";

/**
 * Fetch recipes list with pagination and search
 *
 * @param params - Query parameters (search, page, limit)
 * @returns Paginated recipes list
 * @throws Error if request fails
 */
export async function fetchRecipes(params: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<RecipeListItemDto>> {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set("search", params.search);
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

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch recipe" }));
    throw new Error(error.error || "Failed to fetch recipe");
  }

  return response.json();
}
