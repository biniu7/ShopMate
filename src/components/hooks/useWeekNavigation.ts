/**
 * Week navigation hook
 * Handles navigation between weeks
 */
import { useCallback } from "react";
import { format, addDays, subDays, startOfWeek } from "date-fns";
import type { WeekChangeHandler } from "@/types";

/**
 * Week navigation hook
 * Provides functions for navigating between weeks
 *
 * @param currentWeekStart - Current week start date (Monday) in YYYY-MM-DD format
 * @param onWeekChange - Callback when week changes
 * @returns Navigation functions
 */
export function useWeekNavigation(currentWeekStart: string, onWeekChange: WeekChangeHandler) {
  /**
   * Navigate to previous week
   * Subtracts 7 days from current week start
   */
  const goToPreviousWeek = useCallback(() => {
    const currentDate = new Date(currentWeekStart);
    const previousWeek = subDays(currentDate, 7);
    const newWeekStart = format(previousWeek, "yyyy-MM-dd");
    onWeekChange(newWeekStart);
  }, [currentWeekStart, onWeekChange]);

  /**
   * Navigate to next week
   * Adds 7 days to current week start
   */
  const goToNextWeek = useCallback(() => {
    const currentDate = new Date(currentWeekStart);
    const nextWeek = addDays(currentDate, 7);
    const newWeekStart = format(nextWeek, "yyyy-MM-dd");
    onWeekChange(newWeekStart);
  }, [currentWeekStart, onWeekChange]);

  /**
   * Navigate to current week
   * Resets to current week (Monday)
   */
  const goToCurrentWeek = useCallback(() => {
    const today = new Date();
    const monday = startOfWeek(today, { weekStartsOn: 1 }); // 1 = Monday
    const currentWeek = format(monday, "yyyy-MM-dd");
    onWeekChange(currentWeek);
  }, [onWeekChange]);

  return {
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
  };
}
