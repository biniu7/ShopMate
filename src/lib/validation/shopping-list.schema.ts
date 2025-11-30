/**
 * Validation schemas for Shopping List Preview endpoint
 * POST /api/shopping-lists/preview
 */

import { z } from "zod";

/**
 * Schema for calendar selection (day + meal types)
 */
const calendarSelectionSchema = z.object({
  day_of_week: z
    .number()
    .int("Day of week must be an integer")
    .min(1, "Day of week must be between 1 (Monday) and 7 (Sunday)")
    .max(7, "Day of week must be between 1 (Monday) and 7 (Sunday)"),
  meal_types: z
    .array(
      z.enum(["breakfast", "second_breakfast", "lunch", "dinner"], {
        errorMap: () => ({
          message: "Invalid meal type. Must be one of: breakfast, second_breakfast, lunch, dinner",
        }),
      })
    )
    .min(1, "At least one meal type must be selected")
    .max(4, "Maximum 4 meal types allowed"),
});

/**
 * Custom validation for Monday check
 */
const isMondayDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  // getDay() returns 0 for Sunday, 1 for Monday, etc.
  return date.getDay() === 1;
};

/**
 * Schema for Mode 1: Calendar-based shopping list preview
 */
const shoppingListPreviewCalendarRequestSchema = z.object({
  source: z.literal("calendar"),
  week_start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Expected YYYY-MM-DD")
    .refine(
      (date) => {
        // Validate that it's a valid date
        const dateObj = new Date(date);
        return !isNaN(dateObj.getTime());
      },
      { message: "Invalid date" }
    )
    .refine(isMondayDate, {
      message: "Week start date must be a Monday",
    }),
  selections: z
    .array(calendarSelectionSchema)
    .min(1, "At least one day selection must be provided")
    .max(28, "Maximum 28 selections allowed (7 days × 4 meals)"),
});

/**
 * Schema for Mode 2: Recipe-based shopping list preview
 */
const shoppingListPreviewRecipesRequestSchema = z.object({
  source: z.literal("recipes"),
  recipe_ids: z
    .array(z.string().uuid("Invalid recipe ID format. Expected UUID"))
    .min(1, "At least one recipe ID must be provided")
    .max(20, "Maximum 20 recipes allowed per request"),
});

/**
 * Discriminated union schema for shopping list preview requests
 * Uses "source" field as discriminator
 */
export const shoppingListPreviewRequestSchema = z.discriminatedUnion("source", [
  shoppingListPreviewCalendarRequestSchema,
  shoppingListPreviewRecipesRequestSchema,
]);

/**
 * Type inference for validated request
 */
export type ShoppingListPreviewRequestValidated = z.infer<typeof shoppingListPreviewRequestSchema>;

/**
 * Helper type for calendar selection
 */
export type CalendarSelectionValidated = z.infer<typeof calendarSelectionSchema>;

// ============================================================================
// Shopping List Save Schemas (POST /api/shopping-lists)
// ============================================================================

/**
 * Regex for date validation (YYYY-MM-DD)
 */
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Schema for a single shopping list item when saving
 */
export const saveShoppingListItemSchema = z.object({
  ingredient_name: z
    .string()
    .trim()
    .min(1, "Ingredient name is required")
    .max(100, "Ingredient name must not exceed 100 characters"),

  quantity: z.number().positive("Quantity must be positive").nullable().optional(),

  unit: z.string().trim().max(50, "Unit must not exceed 50 characters").nullable().optional(),

  category: z.enum(["Nabiał", "Warzywa", "Owoce", "Mięso", "Pieczywo", "Przyprawy", "Inne"], {
    errorMap: () => ({ message: "Invalid ingredient category" }),
  }),

  sort_order: z.number().int("Sort order must be an integer").min(0, "Sort order must be non-negative").default(0),
});

/**
 * Schema for saving a complete shopping list
 * Used in POST /api/shopping-lists
 */
export const saveShoppingListSchema = z.object({
  name: z.string().trim().max(200, "Name must not exceed 200 characters").default("Lista zakupów"),

  week_start_date: z
    .string()
    .regex(dateRegex, "Invalid date format. Use YYYY-MM-DD")
    .refine(
      (date) => {
        // Validate that it's a valid date
        const dateObj = new Date(date);
        return !isNaN(dateObj.getTime());
      },
      { message: "Invalid date" }
    )
    .nullable()
    .optional(),

  items: z
    .array(saveShoppingListItemSchema)
    .min(1, "At least 1 item is required")
    .max(100, "Maximum 100 items allowed"),
});

/**
 * Type inference for save shopping list request
 */
export type SaveShoppingListInput = z.infer<typeof saveShoppingListSchema>;

/**
 * Type inference for shopping list item
 */
export type SaveShoppingListItemInput = z.infer<typeof saveShoppingListItemSchema>;

// ============================================================================
// Shopping List Query Schemas (GET /api/shopping-lists)
// ============================================================================

/**
 * Schema for query params when fetching shopping lists
 * Used in GET /api/shopping-lists
 */
export const shoppingListQuerySchema = z.object({
  page: z.number().int("Page must be an integer").min(1, "Page must be at least 1").default(1),

  limit: z
    .number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must not exceed 100")
    .default(20),
});

/**
 * Type inference for shopping list query params
 */
export type ShoppingListQueryInput = z.infer<typeof shoppingListQuerySchema>;

// ============================================================================
// Shopping List By ID Schemas (GET /api/shopping-lists/:id)
// ============================================================================

/**
 * Schema for path parameter validation (GET /api/shopping-lists/:id)
 * Validates that the id is a valid UUID format
 */
export const shoppingListIdParamSchema = z.object({
  id: z.string().uuid("Invalid shopping list ID format"),
});

/**
 * Type inference for path param
 */
export type ShoppingListIdParam = z.infer<typeof shoppingListIdParamSchema>;

// ============================================================================
// Shopping List Item Update Schemas (PATCH /api/shopping-lists/:list_id/items/:item_id)
// ============================================================================

/**
 * Schema for validating UUID format in path parameters
 * Reusable for any UUID validation needs
 */
export const uuidParamSchema = z.string().uuid({
  message: "Nieprawidłowy format UUID",
});

/**
 * Schema for updating shopping list item checked status
 * Used in PATCH /api/shopping-lists/:list_id/items/:item_id
 * This is the ONLY mutation allowed on saved shopping lists (snapshot pattern)
 */
export const updateShoppingListItemSchema = z
  .object({
    is_checked: z.boolean({
      required_error: "Pole is_checked jest wymagane",
      invalid_type_error: "Pole is_checked musi być typu boolean",
    }),
  })
  .strict(); // Prevent additional fields (mass assignment protection)

/**
 * Type inference for update shopping list item request
 */
export type UpdateShoppingListItemInput = z.infer<typeof updateShoppingListItemSchema>;
