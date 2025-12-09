/**
 * Recipe Edit View Component
 * Main container for recipe editing form with data fetching
 */
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { RecipeSchema, type RecipeSchemaType } from "@/lib/validation/recipe.schema";
import type { RecipeResponseDto } from "@/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormHeader } from "./FormHeader";
import { NameInput } from "./NameInput";
import { InstructionsTextarea } from "./InstructionsTextarea";
import { IngredientsList } from "./IngredientsList";
import { FormActions } from "./FormActions";
import { DiscardChangesDialog } from "./DiscardChangesDialog";
import { RecipeDetailsSkeleton } from "./RecipeDetailsSkeleton";
import { ErrorMessage } from "./ErrorMessage";

interface RecipeEditViewProps {
  recipeId: string;
}

/**
 * Recipe Edit View Component
 * Fetches recipe data and provides editing form
 */
export function RecipeEditView({ recipeId }: RecipeEditViewProps) {
  const queryClient = useQueryClient();
  const [discardDialogOpen, setDiscardDialogOpen] = React.useState(false);

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
    staleTime: 5 * 60 * 1000, // 5 minut
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message === "Recipe not found") {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Setup react-hook-form with Zod validation
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, isDirty },
    reset,
  } = useForm<RecipeSchemaType>({
    resolver: zodResolver(RecipeSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      instructions: "",
      ingredients: [{ name: "", quantity: null, unit: null, sort_order: 0 }],
    },
  });

  // Reset form with fetched data
  React.useEffect(() => {
    if (recipe) {
      reset({
        name: recipe.name,
        instructions: recipe.instructions,
        ingredients: recipe.ingredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          sort_order: ing.sort_order,
        })),
      });
    }
  }, [recipe, reset]);

  // Setup field array for dynamic ingredients
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "ingredients",
  });

  // Setup mutation for PUT /api/recipes/:id
  const mutation = useMutation({
    mutationFn: async (data: RecipeSchemaType) => {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Nie udało się zaktualizować przepisu");
      }

      return response.json() as Promise<RecipeResponseDto>;
    },
    onSuccess: (updatedRecipe) => {
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
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="recipe-form bg-white rounded-lg shadow-sm p-6 sm:p-8"
          noValidate
          aria-label="Formularz edycji przepisu"
        >
          {/* Header with breadcrumbs */}
          <FormHeader mode="edit" recipeName={recipe.name} />

          {/* Info Alert about propagation */}
          <Alert className="my-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Zmiany zaktualizują wszystkie przypisania w kalendarzu. Wcześniej wygenerowane listy zakupów pozostaną
              niezmienione (snapshot).
            </AlertDescription>
          </Alert>

          {/* Form Fields */}
          <div className="space-y-8">
            {/* Name Input */}
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <NameInput value={field.value} onChange={field.onChange} error={errors.name?.message} />
              )}
            />

            {/* Instructions Textarea */}
            <Controller
              name="instructions"
              control={control}
              render={({ field }) => (
                <InstructionsTextarea
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.instructions?.message}
                />
              )}
            />

            {/* Ingredients List */}
            <IngredientsList
              ingredients={fields}
              onAdd={append}
              onRemove={remove}
              onUpdate={(index, field, value) => {
                const ingredient = fields[index];
                update(index, { ...ingredient, [field]: value });
              }}
              errors={errors.ingredients as any}
            />
          </div>

          {/* Form Actions (sticky bottom) */}
          <FormActions onCancel={handleCancel} isSubmitting={mutation.isPending} isValid={isValid} mode="edit" />
        </form>

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
