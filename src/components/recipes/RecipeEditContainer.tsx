/**
 * Recipe Edit Container Component
 * Logic layer for recipe editing - handles data, mutations, and business logic
 */
import React, { useState } from "react";
import { useRecipeEdit } from "@/components/hooks/useRecipeEdit";
import { RecipeDetailsSkeleton } from "./RecipeDetailsSkeleton";
import { ErrorMessage } from "./ErrorMessage";
import { RecipeEditForm } from "./RecipeEditForm";
import { DiscardChangesDialog } from "./DiscardChangesDialog";
import type { RecipeSchemaType } from "@/lib/validation/recipe.schema";

interface RecipeEditContainerProps {
  recipeId: string;
}

/**
 * Container component for recipe editing
 * Handles all business logic and delegates rendering to presentational components
 */
export function RecipeEditContainer({ recipeId }: RecipeEditContainerProps) {
  const { recipe, isLoading, error, refetch, form, mutation } = useRecipeEdit(recipeId);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  const {
    handleSubmit,
    formState: { isDirty, isValid },
  } = form;

  // Submit handler
  const onSubmit = (data: RecipeSchemaType) => {
    // Assign sort_order based on array index
    const dataWithSortOrder: RecipeSchemaType = {
      ...data,
      ingredients: data.ingredients.map((ing, index) => ({
        ...ing,
        sort_order: index,
      })),
    };

    mutation.mutate(dataWithSortOrder);
  };

  // Cancel handler with dirty check
  const handleCancel = () => {
    if (isDirty) {
      setDiscardDialogOpen(true);
    } else {
      window.location.href = `/recipes/${recipeId}`;
    }
  };

  // Handle discard action from dialog
  const handleDiscard = () => {
    window.location.href = `/recipes/${recipeId}`;
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="recipe-edit-view min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-3xl p-4 py-8">
          <RecipeDetailsSkeleton />
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    // 404 error - show not found message
    if (error instanceof Error && error.message === "Recipe not found") {
      return (
        <div className="recipe-edit-view min-h-screen bg-gray-50">
          <div className="container mx-auto max-w-3xl p-4 py-16 text-center">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Przepis nie znaleziony</h2>
              <p className="text-gray-600 mb-6">Przepis o podanym ID nie istnieje lub nie masz do niego dostępu.</p>
              <a href="/recipes" className="inline-flex items-center gap-2 text-primary hover:underline">
                Powrót do listy przepisów
              </a>
            </div>
          </div>
        </div>
      );
    }

    // Other errors - show error message with retry
    return (
      <div className="recipe-edit-view min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-3xl p-4 py-8">
          <ErrorMessage error={error} onRetry={() => refetch()} />
        </div>
      </div>
    );
  }

  // Handle no data
  if (!recipe) {
    return null;
  }

  // Render edit form
  return (
    <div className="recipe-edit-view min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-3xl p-4 py-8">
        <RecipeEditForm
          recipe={recipe}
          form={form}
          onSubmit={handleSubmit(onSubmit)}
          onCancel={handleCancel}
          isSubmitting={mutation.isPending}
          isValid={isValid}
        />

        {/* Discard Changes Dialog */}
        <DiscardChangesDialog
          isOpen={discardDialogOpen}
          onClose={() => setDiscardDialogOpen(false)}
          onDiscard={handleDiscard}
        />
      </div>
    </div>
  );
}
