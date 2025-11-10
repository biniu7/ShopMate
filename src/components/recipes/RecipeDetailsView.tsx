/**
 * Recipe Details View - główny kontener widoku szczegółów przepisu
 * Zarządza stanem, pobiera dane z API i renderuje komponenty dziecięce
 */
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { RecipeResponseDto, DeleteRecipeResponseDto } from "@/types";
import { RecipeDetailsHeader } from "./RecipeDetailsHeader";
import { RecipeDetailsContent } from "./RecipeDetailsContent";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { RecipeDetailsSkeleton } from "./RecipeDetailsSkeleton";
import { ErrorMessage } from "./ErrorMessage";

interface RecipeDetailsViewProps {
  recipeId: string;
}

/**
 * RecipeDetailsView
 * Główny komponent widoku szczegółów przepisu
 */
export function RecipeDetailsView({ recipeId }: RecipeDetailsViewProps) {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  // Fetch recipe details
  const {
    data: recipe,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["recipe", recipeId],
    queryFn: async () => {
      const response = await fetch(`/api/recipes/${recipeId}`);

      if (response.status === 404) {
        throw new Error("Recipe not found");
      }

      if (!response.ok) {
        throw new Error("Failed to fetch recipe");
      }

      return response.json() as Promise<RecipeResponseDto>;
    },
    staleTime: 10 * 60 * 1000, // 10 minut
    retry: (failureCount, error) => {
      // Don't retry 404
      if (error instanceof Error && error.message === "Recipe not found") {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete recipe");
      }

      return response.json() as Promise<DeleteRecipeResponseDto>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["meal-plan"] }); // May be assigned

      toast.success(
        data.deleted_meal_plan_assignments > 0
          ? `Przepis usunięty wraz z ${data.deleted_meal_plan_assignments} przypisaniami`
          : "Przepis usunięty"
      );

      // Redirect to recipes list
      window.location.href = "/recipes";
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nie udało się usunąć przepisu");
    },
  });

  // Handle loading state
  if (isLoading) {
    return <RecipeDetailsSkeleton />;
  }

  // Handle error state
  if (error) {
    // 404 error - show not found message
    if (error instanceof Error && error.message === "Recipe not found") {
      return (
        <div className="py-16 text-center">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Przepis nie znaleziony
            </h2>
            <p className="text-gray-600 mb-6">
              Przepis o podanym ID nie istnieje lub nie masz do niego dostępu.
            </p>
            <a
              href="/recipes"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              Powrót do listy przepisów
            </a>
          </div>
        </div>
      );
    }

    // Other errors - show error message with retry
    return <ErrorMessage error={error} onRetry={() => refetch()} />;
  }

  // Handle no data
  if (!recipe) {
    return null;
  }

  // Render recipe details
  return (
    <div className="recipe-details-view">
      <RecipeDetailsHeader
        recipeName={recipe.name}
        recipeId={recipe.id}
        onDelete={() => setDeleteDialogOpen(true)}
      />

      <RecipeDetailsContent recipe={recipe} />

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        recipeId={recipe.id}
        recipeName={recipe.name}
        assignmentsCount={recipe.meal_plan_assignments ?? 0}
        onConfirm={() => deleteMutation.mutate()}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
