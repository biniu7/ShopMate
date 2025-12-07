/**
 * Custom hook for recipe edit form management
 * Handles form state, validation, and automatic data reset
 */
import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RecipeSchema, type RecipeSchemaType } from "@/lib/validation/recipe.schema";
import type { RecipeResponseDto } from "@/types";

/**
 * Hook for managing recipe edit form with React Hook Form
 *
 * @param recipe - Recipe data from API (optional, for edit mode)
 * @returns React Hook Form object with form methods and field array
 *
 * @example
 * const form = useRecipeForm(recipe);
 * const { control, handleSubmit, formState: { errors } } = form;
 * const { fields, append, remove } = form.ingredientsArray;
 */
export function useRecipeForm(recipe?: RecipeResponseDto) {
  // Setup react-hook-form with Zod validation
  const form = useForm<RecipeSchemaType>({
    resolver: zodResolver(RecipeSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      instructions: "",
      ingredients: [{ name: "", quantity: null, unit: null, sort_order: 0 }],
    },
  });

  const { control, reset } = form;

  // Setup field array for dynamic ingredients
  const ingredientsArray = useFieldArray({
    control,
    name: "ingredients",
  });

  // Reset form when recipe data arrives or changes
  useEffect(() => {
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

  return {
    ...form,
    ingredientsArray,
  };
}
