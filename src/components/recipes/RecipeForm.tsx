/**
 * Recipe Form Component
 * Main form for creating recipes with react-hook-form and TanStack Query
 */
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { FormHeader } from "./FormHeader";
import { NameInput } from "./NameInput";
import { InstructionsTextarea } from "./InstructionsTextarea";
import { IngredientsList } from "./IngredientsList";
import { FormActions } from "./FormActions";
import { RecipeSchema, type RecipeSchemaType } from "@/lib/validation/recipe.schema";
import type { RecipeResponseDto } from "@/types";

/**
 * Recipe Form Component
 * Manages form state, validation, and submission
 */
export function RecipeForm() {
  // Setup react-hook-form with Zod validation
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<RecipeSchemaType>({
    resolver: zodResolver(RecipeSchema),
    mode: "onChange", // Validate on change for instant feedback
    defaultValues: {
      name: "",
      instructions: "",
      ingredients: [{ name: "", quantity: null, unit: null, sort_order: 0 }],
    },
  });

  // Setup field array for dynamic ingredients
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "ingredients",
  });

  // Setup mutation for POST /api/recipes
  const mutation = useMutation({
    mutationFn: async (data: RecipeSchemaType) => {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Nie udało się dodać przepisu");
      }

      return response.json() as Promise<RecipeResponseDto>;
    },
    onSuccess: (newRecipe) => {
      // Show success notification
      toast.success("Przepis dodany pomyślnie!", {
        description: `Przekierowywanie do szczegółów przepisu...`,
      });
      // Redirect to recipe details after short delay
      setTimeout(() => {
        window.location.href = `/recipes/${newRecipe.id}`;
      }, 1000);
    },
    onError: (error: Error) => {
      // Show error notification
      toast.error("Nie udało się dodać przepisu", {
        description: error.message || "Sprawdź połączenie z internetem i spróbuj ponownie.",
        action: {
          label: "Spróbuj ponownie",
          onClick: () => mutation.mutate(mutation.variables!),
        },
      });
      console.error("Recipe creation error:", error);
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
    // Check if form has any values (dirty check)
    const hasChanges =
      nameValue.trim() !== "" || instructionsValue.trim() !== "" || fields.some((field) => field.name.trim() !== "");

    if (hasChanges) {
      if (confirm("Czy na pewno chcesz anulować? Niezapisane zmiany zostaną utracone.")) {
        window.history.back();
      }
    } else {
      window.history.back();
    }
  };

  // Watch form values
  const nameValue = watch("name");
  const instructionsValue = watch("instructions");

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="recipe-form bg-white rounded-lg shadow-sm p-6 sm:p-8"
      noValidate
      aria-label="Formularz dodawania przepisu"
    >
      {/* Header with breadcrumbs */}
      <FormHeader />

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
            <InstructionsTextarea value={field.value} onChange={field.onChange} error={errors.instructions?.message} />
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
      <FormActions onCancel={handleCancel} isSubmitting={mutation.isPending} isValid={isValid} />
    </form>
  );
}
