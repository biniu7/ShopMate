/**
 * Custom hook for fetching single recipe data
 * Uses TanStack Query for caching and error handling
 */
import { useQuery } from "@tanstack/react-query";
import { fetchRecipe } from "@/lib/api/recipes";
import type { RecipeResponseDto } from "@/types";

/**
 * Fetch single recipe by ID with caching and retry logic
 *
 * @param recipeId - Recipe ID to fetch
 * @returns TanStack Query result with recipe data
 *
 * @example
 * const { data: recipe, isLoading, error } = useRecipeQuery("recipe-123");
 */
export function useRecipeQuery(recipeId: string) {
  return useQuery<RecipeResponseDto>({
    queryKey: ["recipe", recipeId],
    queryFn: () => fetchRecipe(recipeId),
    staleTime: 5 * 60 * 1000, // 5 minutes - recipe data stays fresh
    retry: (failureCount, error) => {
      // Don't retry on 404 errors (recipe not found)
      if (error instanceof Error && error.message === "Recipe not found") {
        return false;
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
  });
}
