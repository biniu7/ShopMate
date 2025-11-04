import { z } from "zod";

/**
 * Meal type enum values
 */
const MEAL_TYPES = ["breakfast", "second_breakfast", "lunch", "dinner"] as const;

/**
 * Helper function to check if a date string represents Monday
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns true if the date is Monday, false otherwise
 */
const isMondayDate = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  // getDay() returns 0 for Sunday, 1 for Monday, etc.
  return date.getDay() === 1;
};

/**
 * Zod schema for validating GET /api/meal-plan query parameters
 * Validates week_start_date in YYYY-MM-DD format
 */
export const mealPlanQuerySchema = z.object({
  week_start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Expected YYYY-MM-DD")
    .refine((date) => !isNaN(Date.parse(date)), "Invalid date. Must be a valid ISO date")
    .describe("ISO date string for Monday of the week (YYYY-MM-DD)"),
});

export type MealPlanQueryInput = z.infer<typeof mealPlanQuerySchema>;

/**
 * Zod schema for validating POST /api/meal-plan request body
 * Used to create a new meal plan assignment
 */
export const createMealPlanSchema = z.object({
  recipe_id: z.string().uuid({ message: "Invalid recipe ID format" }),

  week_start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be in YYYY-MM-DD format")
    .refine((date) => !isNaN(Date.parse(date)), "Invalid date")
    .refine(isMondayDate, { message: "Must be Monday" }),

  day_of_week: z.number().int().min(1, "Must be between 1 and 7").max(7, "Must be between 1 and 7"),

  meal_type: z.enum(MEAL_TYPES, {
    errorMap: () => ({
      message: "Must be one of: breakfast, second_breakfast, lunch, dinner",
    }),
  }),
});

export type CreateMealPlanInput = z.infer<typeof createMealPlanSchema>;
