/**
 * Custom hook for recipe update mutation
 * Handles API calls, cache invalidation, and success/error states
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateRecipe } from "@/lib/api/recipes";
import { toast } from "sonner";
import type { RecipeSchemaType } from "@/lib/validation/recipe.schema";
import type { RecipeResponseDto } from "@/types";

/**
 * Hook for updating recipe with automatic cache invalidation
 *
 * @param recipeId - Recipe ID to update
 * @returns TanStack Query mutation object
 *
 * @example
 * const mutation = useRecipeUpdateMutation("recipe-123");
 * mutation.mutate(recipeData);
 */
export function useRecipeUpdateMutation(recipeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RecipeSchemaType) => updateRecipe(recipeId, data),
    onSuccess: (updatedRecipe: RecipeResponseDto) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["recipe", recipeId] });
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["meal-plan"] }); // Live update in calendar

      // Show success notification
      toast.success("Przepis zaktualizowany pomyślnie!", {
        description: "Przekierowywanie do szczegółów przepisu...",
      });

      // Redirect to recipe details after short delay
      setTimeout(() => {
        window.location.href = `/recipes/${updatedRecipe.id}`;
      }, 1000);
    },
    onError: (error: Error) => {
      // Show error notification
      toast.error("Nie udało się zaktualizować przepisu", {
        description: error.message || "Sprawdź połączenie z internetem i spróbuj ponownie.",
      });
      console.error("Recipe update error:", error);
    },
  });
}
