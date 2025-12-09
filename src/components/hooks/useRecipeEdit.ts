/**
 * Compound hook for recipe editing
 * Combines query, form, and mutation hooks for complete recipe edit functionality
 */
import { useRecipeQuery } from "./useRecipeQuery";
import { useRecipeForm } from "./useRecipeForm";
import { useRecipeUpdateMutation } from "./useRecipeUpdateMutation";

/**
 * Compound hook for recipe edit page
 * Provides all necessary state and functions for editing a recipe
 *
 * @param recipeId - Recipe ID to edit
 * @returns Object with recipe data, form methods, mutation, and loading states
 *
 * @example
 * const { recipe, isLoading, error, form, mutation, refetch } = useRecipeEdit(recipeId);
 *
 * const onSubmit = (data) => {
 *   mutation.mutate(data);
 * };
 *
 * return <RecipeEditForm recipe={recipe} form={form} onSubmit={onSubmit} />;
 */
export function useRecipeEdit(recipeId: string) {
  // Fetch recipe data
  const { data: recipe, isLoading, error, refetch } = useRecipeQuery(recipeId);

  // Setup form with recipe data
  const form = useRecipeForm(recipe);

  // Setup update mutation
  const mutation = useRecipeUpdateMutation(recipeId);

  return {
    // Recipe data
    recipe,
    isLoading,
    error,
    refetch,

    // Form state and methods
    form,

    // Mutation state and methods
    mutation,
  };
}
