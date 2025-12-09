import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { WeekCalendarResponseDto, MealPlanAssignmentDto, MealType, CreateMealPlanDto } from "@/types";

type SupabaseClientType = SupabaseClient<Database>;

/**
 * Custom error classes for better error handling
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseError";
  }
}

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      return MEAL_TYPE_ORDER[a.meal_type as MealType] - MEAL_TYPE_ORDER[b.meal_type as MealType];
    });

  // Step 5: Return WeekCalendarResponseDto
  return {
    week_start_date: weekStartDate,
    week_end_date: weekEndDate,
    assignments,
  };
}

/**
 * Verify that a recipe exists and belongs to the specified user
 *
 * This function checks if:
 * 1. Recipe exists in the database
 * 2. Recipe belongs to the authenticated user (via RLS + explicit check)
 *
 * @param supabase - Authenticated Supabase client
 * @param recipeId - UUID of the recipe to verify
 * @param userId - User ID from auth session
 * @returns true if recipe exists and belongs to user, false otherwise
 */
export async function verifyRecipeOwnership(
  supabase: SupabaseClientType,
  recipeId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase.from("recipes").select("id").eq("id", recipeId).eq("user_id", userId).single();

  // Return true only if no error and data exists
  return !error && data !== null;
}

/**
 * Check if a meal slot is already assigned
 *
 * Checks for existing assignment with the same:
 * - user_id
 * - week_start_date
 * - day_of_week
 * - meal_type
 *
 * This prevents duplicate assignments (enforced by UNIQUE constraint)
 *
 * @param supabase - Authenticated Supabase client
 * @param userId - User ID from auth session
 * @param weekStartDate - ISO date string (YYYY-MM-DD)
 * @param dayOfWeek - Day of week (1-7)
 * @param mealType - Meal type enum value
 * @returns true if slot is already assigned, false if available
 */
export async function checkDuplicateAssignment(
  supabase: SupabaseClientType,
  userId: string,
  weekStartDate: string,
  dayOfWeek: number,
  mealType: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("meal_plan")
    .select("id")
    .eq("user_id", userId)
    .eq("week_start_date", weekStartDate)
    .eq("day_of_week", dayOfWeek)
    .eq("meal_type", mealType)
    .single();

  // Return true if assignment exists (no error and data found)
  return !error && data !== null;
}

/**
 * Create a new meal plan assignment
 *
 * This function performs the following steps:
 * 1. Insert new assignment into meal_plan table
 * 2. Fetch full assignment data with recipe name (JOIN with recipes)
 * 3. Map to MealPlanAssignmentDto
 *
 * @param supabase - Authenticated Supabase client
 * @param userId - User ID from auth session
 * @param input - CreateMealPlanDto with assignment data
 * @returns Object with data (MealPlanAssignmentDto) or error
 */
export async function createMealPlanAssignment(
  supabase: SupabaseClientType,
  userId: string,
  input: CreateMealPlanDto
): Promise<{ data: MealPlanAssignmentDto | null; error: Error | null }> {
  try {
    // Step 1: Insert assignment into meal_plan table
    const { data: assignment, error: insertError } = await supabase
      .from("meal_plan")
      .insert({
        user_id: userId,
        recipe_id: input.recipe_id,
        week_start_date: input.week_start_date,
        day_of_week: input.day_of_week,
        meal_type: input.meal_type,
      })
      .select("*")
      .single();

    if (insertError) {
      return { data: null, error: insertError };
    }

    // Step 2: Fetch full data with recipe name (JOIN)
    const { data: fullData, error: selectError } = await supabase
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
      .eq("id", assignment.id)
      .single();

    if (selectError || !fullData) {
      return {
        data: null,
        error: selectError || new Error("Failed to fetch assignment"),
      };
    }

    // Step 3: Map to MealPlanAssignmentDto
    const result: MealPlanAssignmentDto = {
      id: fullData.id,
      user_id: fullData.user_id,
      recipe_id: fullData.recipe_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recipe_name: (fullData.recipes as any)?.name || "Unknown Recipe",
      week_start_date: fullData.week_start_date,
      day_of_week: fullData.day_of_week,
      meal_type: fullData.meal_type as MealType,
      created_at: fullData.created_at,
    };

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Usuwa przypisanie przepisu z kalendarza (meal plan assignment).
 * Nie usuwa samego przepisu, tylko wpis w tabeli meal_plan.
 *
 * @param supabase - Supabase client z auth context
 * @param userId - ID użytkownika (z auth.getUser())
 * @param assignmentId - ID przypisania do usunięcia
 * @throws {NotFoundError} Gdy assignment nie istnieje lub nie należy do użytkownika
 * @throws {DatabaseError} Gdy wystąpi błąd bazy danych
 */
export async function deleteMealPlanAssignment(
  supabase: SupabaseClientType,
  userId: string,
  assignmentId: string
): Promise<void> {
  // Query z count option do sprawdzenia affected rows
  const { error, count } = await supabase
    .from("meal_plan")
    .delete({ count: "exact" })
    .eq("id", assignmentId)
    .eq("user_id", userId); // Explicit authorization check

  // Handle database errors
  if (error) {
    console.error("[meal-plan.service] Delete query failed:", {
      assignmentId,
      userId,
      error: error.message,
      code: error.code,
    });

    throw new DatabaseError(`Failed to delete meal plan assignment: ${error.message}`);
  }

  // Check if anything was deleted
  if (count === 0) {
    // Assignment nie istnieje LUB user nie ma do niego dostępu
    // Celowo nie rozróżniamy (security best practice)
    throw new NotFoundError("Assignment not found or you don't have permission to delete it");
  }

  // Success - return void
  return;
}
