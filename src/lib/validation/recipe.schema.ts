import { z } from "zod";

/**
 * Zod schema for validating ingredient input data
 * Used when creating or updating recipes
 */
export const IngredientInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nazwa składnika jest wymagana")
    .max(100, "Nazwa składnika nie może przekroczyć 100 znaków"),

  quantity: z.number().positive("Ilość musi być liczbą dodatnią").nullable(),

  unit: z.string().trim().max(50, "Jednostka nie może przekroczyć 50 znaków").nullable(),

  sort_order: z.number().int("Kolejność musi być liczbą całkowitą").min(0, "Kolejność nie może być ujemna"),
});

/**
 * Zod schema for validating recipe creation/update data
 * Enforces business rules: 3-100 chars for name, 10-5000 for instructions, 1-50 ingredients
 */
export const RecipeSchema = z.object({
  name: z.string().trim().min(3, "Nazwa musi mieć minimum 3 znaki").max(100, "Nazwa może mieć maksimum 100 znaków"),

  instructions: z
    .string()
    .trim()
    .min(10, "Instrukcje muszą mieć minimum 10 znaków")
    .max(5000, "Instrukcje mogą mieć maksimum 5000 znaków"),

  ingredients: z
    .array(IngredientInputSchema)
    .min(1, "Wymagany jest minimum 1 składnik")
    .max(50, "Maksimum 50 składników"),
});

/**
 * TypeScript types inferred from Zod schemas
 * These can be used for type-safe function parameters
 */
export type RecipeSchemaType = z.infer<typeof RecipeSchema>;
export type IngredientInputSchemaType = z.infer<typeof IngredientInputSchema>;

/**
 * Zod schema for GET /api/recipes query parameters
 * Validates search, sort, page, and limit params
 */
export const recipeListQuerySchema = z.object({
  search: z.string().trim().optional().describe("Case-insensitive search on recipe name"),

  sort: z
    .enum(["name_asc", "name_desc", "created_asc", "created_desc"])
    .default("created_desc")
    .describe("Sort order for recipes"),

  page: z.coerce.number().int().min(1, "Page must be at least 1").default(1).describe("Page number for pagination"),

  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .default(20)
    .describe("Number of items per page"),
});

export type RecipeListQueryInput = z.infer<typeof recipeListQuerySchema>;

/**
 * Zod schema for GET /api/recipes/:id path parameter
 * Validates that the recipe ID is a valid UUID
 */
export const getRecipeByIdParamsSchema = z.object({
  id: z.string().uuid({ message: "Invalid recipe ID format" }),
});

export type GetRecipeByIdParams = z.infer<typeof getRecipeByIdParamsSchema>;

/**
 * Zod schema for DELETE /api/recipes/:id path parameter
 * Validates that the recipe ID is a valid UUID
 */
export const deleteRecipeParamsSchema = z.object({
  id: z.string().uuid({ message: "Invalid recipe ID format" }),
});

export type DeleteRecipeParams = z.infer<typeof deleteRecipeParamsSchema>;
