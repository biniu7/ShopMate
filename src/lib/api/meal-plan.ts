/**
 * API functions for meal plan management
 * Handles fetching, creating, and deleting meal plan assignments
 */
import type { WeekCalendarResponseDto, CreateMealPlanDto, MealPlanAssignmentDto } from "@/types";

/**
 * Fetch meal plan for a specific week
 *
 * @param weekStartDate - Week start date (Monday) in YYYY-MM-DD format
 * @returns Week calendar with assignments
 * @throws Error if request fails
 */
export async function fetchMealPlan(weekStartDate: string): Promise<WeekCalendarResponseDto> {
  const response = await fetch(`/api/meal-plan?week_start_date=${weekStartDate}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch meal plan" }));
    throw new Error(error.error || "Failed to fetch meal plan");
  }

  return response.json();
}

/**
 * Create a new meal plan assignment
 *
 * @param dto - Create meal plan DTO
 * @returns Created meal plan assignment
 * @throws Error if request fails
 */
export async function createMealPlanAssignment(dto: CreateMealPlanDto): Promise<MealPlanAssignmentDto> {
  const response = await fetch("/api/meal-plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to create assignment" }));
    throw new Error(error.error || "Failed to create assignment");
  }

  return response.json();
}

/**
 * Delete a meal plan assignment
 *
 * @param assignmentId - ID of the assignment to delete
 * @throws Error if request fails
 */
export async function deleteMealPlanAssignment(assignmentId: string): Promise<void> {
  const response = await fetch(`/api/meal-plan/${assignmentId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to delete assignment" }));
    throw new Error(error.error || "Failed to delete assignment");
  }
}
