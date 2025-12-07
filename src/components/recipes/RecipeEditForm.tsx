/**
 * Recipe Edit Form Component
 * Presentational layer - pure UI without business logic
 */
import React from "react";
import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormHeader } from "./FormHeader";
import { NameInput } from "./NameInput";
import { InstructionsTextarea } from "./InstructionsTextarea";
import { IngredientsList } from "./IngredientsList";
import { FormActions } from "./FormActions";
import type { RecipeSchemaType } from "@/lib/validation/recipe.schema";
import type { RecipeResponseDto } from "@/types";

interface RecipeEditFormProps {
  recipe: RecipeResponseDto;
  form: UseFormReturn<RecipeSchemaType> & {
    ingredientsArray: {
      fields: any[];
      append: (value: any) => void;
      remove: (index: number) => void;
      update: (index: number, value: any) => void;
    };
  };
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isValid: boolean;
}

/**
 * Presentational form component for recipe editing
 * Receives all data and handlers as props
 */
export function RecipeEditForm({ recipe, form, onSubmit, onCancel, isSubmitting, isValid }: RecipeEditFormProps) {
  const {
    control,
    formState: { errors },
    ingredientsArray: { fields, append, remove },
  } = form;

  return (
    <form onSubmit={onSubmit} className="recipe-form bg-white rounded-lg shadow-sm p-6 sm:p-8" noValidate aria-label="Formularz edycji przepisu">
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
          render={({ field }) => <NameInput value={field.value} onChange={field.onChange} error={errors.name?.message} />}
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
          control={control}
          onAdd={append}
          onRemove={remove}
          errors={errors.ingredients as any}
        />
      </div>

      {/* Form Actions (sticky bottom) */}
      <FormActions onCancel={onCancel} isSubmitting={isSubmitting} isValid={isValid} mode="edit" />
    </form>
  );
}
