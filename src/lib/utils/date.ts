/**
 * Date utility functions for calendar view
 * Handles week calculations, date formatting, and validation
 */
import { format, addDays, subDays, startOfWeek, addYears } from "date-fns";
import { pl } from "date-fns/locale";
import type { MealType } from "@/types";

/**
 * Get the start date of the current week (Monday)
 * @returns ISO date string in YYYY-MM-DD format
 */
export function getCurrentWeekStart(): string {
  const today = new Date();
  const monday = startOfWeek(today, { weekStartsOn: 1 }); // 1 = Monday
  return format(monday, "yyyy-MM-dd");
}

/**
 * Validate if a date string is a valid week start date (Monday)
 * @param dateString - Date string to validate in YYYY-MM-DD format
 * @returns true if valid, false otherwise
 */
export function isValidWeekDate(dateString: string): boolean {
  // Check format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);

  // Check valid date
  if (isNaN(date.getTime())) {
    return false;
  }

  // Check is Monday (getDay() returns 0 for Sunday, 1 for Monday, etc.)
  // We need to handle the case where getDay() returns 1 for Monday
  const dayOfWeek = date.getDay();
  if (dayOfWeek !== 1) {
    return false;
  }

  // Check not too far in future (max 10 years)
  const tenYearsFromNow = addYears(new Date(), 10);
  if (date > tenYearsFromNow) {
    return false;
  }

  return true;
}

/**
 * Format a date range for display
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Formatted date range string (e.g., "20-26 stycznia 2025")
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startDay = format(start, "d", { locale: pl });
  const endDay = format(end, "d MMMM yyyy", { locale: pl });

  return `${startDay}-${endDay}`;
}

/**
 * Get the Polish name of a day of the week
 * @param dayOfWeek - Day number (1-7, where 1=Monday, 7=Sunday)
 * @param short - If true, return short name (e.g., "Pon" instead of "Poniedziałek")
 * @returns Day name in Polish
 */
export function getDayName(dayOfWeek: number, short = false): string {
  const days = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];
  const daysShort = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Niedz"];

  // Validate dayOfWeek range
  if (dayOfWeek < 1 || dayOfWeek > 7) {
    throw new Error(`Invalid dayOfWeek: ${dayOfWeek}. Must be between 1 and 7.`);
  }

  return short ? daysShort[dayOfWeek - 1] : days[dayOfWeek - 1];
}

/**
 * Get the Polish label for a meal type
 * @param mealType - Meal type enum value
 * @returns Meal type label in Polish
 */
export function getMealTypeLabel(mealType: MealType): string {
  const labels: Record<MealType, string> = {
    breakfast: "Śniadanie",
    second_breakfast: "Drugie śniadanie",
    lunch: "Obiad",
    dinner: "Kolacja",
  };
  return labels[mealType];
}

/**
 * Add days to a date string
 * @param dateString - Date in YYYY-MM-DD format
 * @param days - Number of days to add
 * @returns New date string in YYYY-MM-DD format
 */
export function addDaysToDateString(dateString: string, days: number): string {
  const date = new Date(dateString);
  const newDate = addDays(date, days);
  return format(newDate, "yyyy-MM-dd");
}

/**
 * Subtract days from a date string
 * @param dateString - Date in YYYY-MM-DD format
 * @param days - Number of days to subtract
 * @returns New date string in YYYY-MM-DD format
 */
export function subDaysFromDateString(dateString: string, days: number): string {
  const date = new Date(dateString);
  const newDate = subDays(date, days);
  return format(newDate, "yyyy-MM-dd");
}

/**
 * Get the end date of a week given the start date (Sunday)
 * @param weekStartDate - Week start date (Monday) in YYYY-MM-DD format
 * @returns Week end date (Sunday) in YYYY-MM-DD format
 */
export function getWeekEndDate(weekStartDate: string): string {
  return addDaysToDateString(weekStartDate, 6);
}
