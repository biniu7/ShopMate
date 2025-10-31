import { z } from "zod";

/**
 * Zod schema for validating ingredient input data
 * Used when creating or updating recipes
 */
export const IngredientInputSchema = z.object({
  name: z.string().min(1, "Ingredient name is required").max(100, "Ingredient name must not exceed 100 characters"),

  quantity: z.number().positive("Quantity must be a positive number").nullable(),

  unit: z.string().max(50, "Unit must not exceed 50 characters").nullable(),

  sort_order: z.number().int("Sort order must be an integer").min(0, "Sort order must be non-negative").default(0),
});

/**
 * Zod schema for validating recipe creation/update data
 * Enforces business rules: 3-100 chars for name, 10-5000 for instructions, 1-50 ingredients
 */
export const RecipeSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name must not exceed 100 characters").trim(),

  instructions: z
    .string()
    .min(10, "Instructions must be at least 10 characters")
    .max(5000, "Instructions must not exceed 5000 characters")
    .trim(),

  ingredients: z
    .array(IngredientInputSchema)
    .min(1, "At least 1 ingredient required")
    .max(50, "Maximum 50 ingredients allowed"),
});

/**
 * TypeScript types inferred from Zod schemas
 * These can be used for type-safe function parameters
 */
export type RecipeSchemaType = z.infer<typeof RecipeSchema>;
export type IngredientInputSchemaType = z.infer<typeof IngredientInputSchema>;
