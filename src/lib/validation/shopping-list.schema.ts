/**
 * Validation schemas for Shopping List Preview endpoint
 * POST /api/shopping-lists/preview
 */

import { z } from "zod";
import { MEAL_TYPES, INGREDIENT_CATEGORIES } from "@/types";

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
export type ShoppingListPreviewRequestValidated = z.infer<
  typeof shoppingListPreviewRequestSchema
>;

/**
 * Helper type for calendar selection
 */
export type CalendarSelectionValidated = z.infer<typeof calendarSelectionSchema>;
