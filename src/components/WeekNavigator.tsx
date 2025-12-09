/**
 * Week Navigator Component
 * Navigation between weeks with date range display
 */
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { useWeekNavigation } from "@/components/hooks/useWeekNavigation";
import type { WeekChangeHandler } from "@/types";

interface WeekNavigatorProps {
  weekStartDate: string; // YYYY-MM-DD
  onWeekChange: WeekChangeHandler;
  dateRange: string; // "20-26 stycznia 2025"
}

/**
 * Week Navigator Component
 * Displays week navigation controls and date range
 */
export const WeekNavigator = memo<WeekNavigatorProps>(({ weekStartDate, onWeekChange, dateRange }) => {
  const { goToPreviousWeek, goToNextWeek, goToCurrentWeek } = useWeekNavigation(weekStartDate, onWeekChange);

  return (
    <nav className="sticky top-0 z-10 bg-white border-b shadow-sm" aria-label="Nawigacja tygodniowa">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Previous Week Button */}
          <Button
            variant="outline"
            onClick={goToPreviousWeek}
            className="w-full sm:w-auto"
            aria-label="Poprzedni tydzień"
          >
            <span className="mr-2">←</span>
            Poprzedni tydzień
          </Button>

          {/* Date Range Display */}
          <div className="flex flex-col items-center">
            <span className="text-lg font-semibold text-gray-900" aria-live="polite">
              {dateRange}
            </span>
            <Button
              variant="ghost"
              onClick={goToCurrentWeek}
              className="text-sm text-blue-600 hover:text-blue-800 mt-1"
              aria-label="Wróć do bieżącego tygodnia"
            >
              Bieżący tydzień
            </Button>
          </div>

          {/* Next Week Button */}
          <Button variant="outline" onClick={goToNextWeek} className="w-full sm:w-auto" aria-label="Następny tydzień">
            Następny tydzień
            <span className="ml-2">→</span>
          </Button>
        </div>
      </div>
    </nav>
  );
});

WeekNavigator.displayName = "WeekNavigator";
