/**
 * Calendar utility functions
 * Builds calendar view models and manages calendar state
 */
import { addDays, format } from "date-fns";
import type { MealType, MealPlanAssignmentDto } from "@/types";
import { getDayName, getMealTypeLabel } from "./date";

/**
 * Calendar cell view model
 * Combines date, meal type, and assignment information
 */
export interface CalendarCellViewModel {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayOfWeek: number; // 1-7 (1=Monday)
  dayName: string; // "Poniedziałek", "Wtorek", ...
  dayNameShort: string; // "Pon", "Wt", ...
  mealType: MealType;
  mealTypeLabel: string; // "Śniadanie", "Drugie śniadanie", "Obiad", "Kolacja"
  assignment: MealPlanAssignmentDto | null;
  isEmpty: boolean; // true if assignment === null
}

/**
 * Week state for navigation
 */
export interface WeekState {
  weekStartDate: string; // YYYY-MM-DD (Monday)
  weekEndDate: string; // YYYY-MM-DD (Sunday)
  dateRange: string; // "20-26 stycznia 2025" (formatted for display)
}

/**
 * All meal types in order
 */
const MEAL_TYPES: MealType[] = ["breakfast", "second_breakfast", "lunch", "dinner"];

/**
 * Build calendar cells for a week
 * Creates a view model for each cell (7 days × 4 meals = 28 cells)
 *
 * @param weekStartDate - Week start date (Monday) in YYYY-MM-DD format
 * @param assignments - Array of meal plan assignments for the week
 * @returns Array of 28 calendar cell view models
 */
export function buildCalendarCells(
  weekStartDate: string,
  assignments: MealPlanAssignmentDto[]
): CalendarCellViewModel[] {
  const cells: CalendarCellViewModel[] = [];

  // Iterate through 7 days
  for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
    const date = addDays(new Date(weekStartDate), dayOfWeek - 1);

    // Iterate through 4 meal types
    for (const mealType of MEAL_TYPES) {
      // Find assignment for this day and meal type
      const assignment = assignments.find((a) => a.day_of_week === dayOfWeek && a.meal_type === mealType);

      cells.push({
        date,
        dateString: format(date, "yyyy-MM-dd"),
        dayOfWeek,
        dayName: getDayName(dayOfWeek),
        dayNameShort: getDayName(dayOfWeek, true),
        mealType,
        mealTypeLabel: getMealTypeLabel(mealType),
        assignment: assignment || null,
        isEmpty: !assignment,
      });
    }
  }

  return cells;
}

/**
 * Group calendar cells by day of week
 * Useful for tablet/mobile accordion layouts
 *
 * @param cells - Array of calendar cell view models
 * @returns Map of day of week (1-7) to array of cells for that day
 */
export function groupCellsByDay(cells: CalendarCellViewModel[]): Map<number, CalendarCellViewModel[]> {
  const grouped = new Map<number, CalendarCellViewModel[]>();

  for (const cell of cells) {
    const dayCells = grouped.get(cell.dayOfWeek);
    if (!dayCells) {
      grouped.set(cell.dayOfWeek, [cell]);
    } else {
      dayCells.push(cell);
    }
  }

  return grouped;
}

/**
 * Truncate text to a maximum length
 * Adds ellipsis if truncated
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Format day and meal type for toast messages
 *
 * @param dayOfWeek - Day of week (1-7)
 * @param mealType - Meal type
 * @returns Formatted string (e.g., "Poniedziałek - Śniadanie")
 */
export function formatDayMealType(dayOfWeek: number, mealType: MealType): string {
  return `${getDayName(dayOfWeek)} - ${getMealTypeLabel(mealType)}`;
}
