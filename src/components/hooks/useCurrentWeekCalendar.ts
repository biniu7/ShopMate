/**
 * Custom hook for fetching current week calendar data
 * Uses TanStack Query for caching and automatic refetching
 */
import { useQuery } from "@tanstack/react-query";
import { getCurrentWeekStart } from "@/lib/utils/date";
import { fetchMealPlan } from "@/lib/api/meal-plan";
import type { WeekCalendarResponseDto } from "@/types";

/**
 * Fetch meal plan for current week
 *
 * @returns TanStack Query result with calendar data
 */
export function useCurrentWeekCalendar() {
  const weekStartDate = getCurrentWeekStart();

  return useQuery<WeekCalendarResponseDto>({
    queryKey: ["meal-plan", weekStartDate],
    queryFn: () => fetchMealPlan(weekStartDate),
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh for 5 min
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}
