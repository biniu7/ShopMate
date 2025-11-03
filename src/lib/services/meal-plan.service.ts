import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { WeekCalendarResponseDto, MealPlanAssignmentDto, MealType } from "@/types";

type SupabaseClientType = SupabaseClient<Database>;

/**
 * Helper: Calculate week end date (Sunday) from week start date (Monday)
 *
 * @param weekStartDate - ISO date string (YYYY-MM-DD) for Monday
 * @returns ISO date string (YYYY-MM-DD) for Sunday (6 days later)
 */
function calculateWeekEndDate(weekStartDate: string): string {
  const startDate = new Date(weekStartDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6); // Add 6 days to get Sunday

  return endDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
}

/**
 * Helper: Define meal type order for sorting
 */
const MEAL_TYPE_ORDER: Record<MealType, number> = {
  breakfast: 0,
  second_breakfast: 1,
  lunch: 2,
  dinner: 3,
};

/**
 * Get meal plan assignments for a specific week with recipe names
 *
 * This function performs the following steps:
 * 1. Query meal_plan table with JOIN to recipes table
 * 2. Filter by user_id and week_start_date
 * 3. Sort by day_of_week and meal_type
 * 4. Calculate week_end_date
 * 5. Map to DTOs and return WeekCalendarResponseDto
 *
 * @param supabase - Authenticated Supabase client
 * @param userId - User ID from auth session
 * @param weekStartDate - ISO date string for Monday (YYYY-MM-DD)
 * @returns WeekCalendarResponseDto with assignments and week dates
 * @throws Error if database query fails
 */
export async function getMealPlanForWeek(
  supabase: SupabaseClientType,
  userId: string,
  weekStartDate: string
): Promise<WeekCalendarResponseDto> {
  // Step 1: Query meal_plan with JOIN to recipes
  const { data, error } = await supabase
    .from("meal_plan")
    .select(
      `
      id,
      user_id,
      recipe_id,
      week_start_date,
      day_of_week,
      meal_type,
      created_at,
      recipes (
        name
      )
    `
    )
    .eq("user_id", userId)
    .eq("week_start_date", weekStartDate)
    .order("day_of_week", { ascending: true });

  if (error) {
    console.error("Database error in getMealPlanForWeek:", error);
    throw new Error(`Failed to fetch meal plan: ${error.message}`);
  }

  // Step 2: Calculate week end date
  const weekEndDate = calculateWeekEndDate(weekStartDate);

  // Step 3: Map data to MealPlanAssignmentDto[]
  const assignments: MealPlanAssignmentDto[] = (data || [])
    .map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      recipe_id: item.recipe_id,
      recipe_name: item.recipes?.name || "Unknown Recipe",
      week_start_date: item.week_start_date,
      day_of_week: item.day_of_week,
      meal_type: item.meal_type,
      created_at: item.created_at,
    }))
    // Step 4: Sort by day_of_week first, then by meal_type
    .sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) {
        return a.day_of_week - b.day_of_week;
      }
      return MEAL_TYPE_ORDER[a.meal_type] - MEAL_TYPE_ORDER[b.meal_type];
    });

  // Step 5: Return WeekCalendarResponseDto
  return {
    week_start_date: weekStartDate,
    week_end_date: weekEndDate,
    assignments,
  };
}
