import { z } from "zod";

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