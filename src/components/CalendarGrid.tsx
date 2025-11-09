/**
 * Calendar Grid Component
 * Responsive grid layout for calendar cells
 * Desktop: 7×4 grid, Tablet: horizontal scroll, Mobile: accordion
 */
import { memo, useMemo } from "react";
import { MealCell } from "./MealCell";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { MealPlanAssignmentDto, MealType } from "@/types";
import type { CalendarCellViewModel } from "@/lib/utils/calendar";
import { groupCellsByDay } from "@/lib/utils/calendar";

interface CalendarGridProps {
  weekStartDate: string;
  cells: CalendarCellViewModel[];
  onAssignRecipe: (dayOfWeek: number, mealType: MealType) => void;
  onRemoveAssignment: (assignmentId: string) => void;
  onPreviewRecipe: (recipeId: string, assignmentId: string) => void;
}

/**
 * Calendar Grid Component
 * Renders calendar with responsive layouts
 */
export const CalendarGrid = memo<CalendarGridProps>(
  ({ cells, onAssignRecipe, onRemoveAssignment, onPreviewRecipe }) => {
    // Group cells by day for tablet/mobile layouts
    const cellsByDay = useMemo(() => groupCellsByDay(cells), [cells]);

    // Get array of days (1-7)
    const days = useMemo(() => Array.from({ length: 7 }, (_, i) => i + 1), []);

    return (
      <div className="calendar-grid-container">
        {/* Desktop Layout (≥1024px) - CSS Grid 7×4 */}
        <div className="hidden lg:block" role="grid" aria-label="Kalendarz posiłków">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-4 mb-4">
            {days.map((dayOfWeek) => {
              const dayCells = cellsByDay.get(dayOfWeek) || [];
              const firstCell = dayCells[0];
              if (!firstCell) return null;

              return (
                <div
                  key={dayOfWeek}
                  className="text-center font-semibold text-gray-700 py-2 border-b-2 border-gray-300"
                  role="columnheader"
                >
                  <div className="text-sm">{firstCell.dayNameShort}</div>
                  <div className="text-xs text-gray-500">
                    {firstCell.date.getDate()}.{firstCell.date.getMonth() + 1}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calendar Grid - 7 columns × 4 rows */}
          <div className="grid grid-cols-7 gap-4">
            {cells.map((cell) => (
              <MealCell
                key={`${cell.dayOfWeek}-${cell.mealType}`}
                date={cell.date}
                dayOfWeek={cell.dayOfWeek}
                mealType={cell.mealType}
                mealTypeLabel={cell.mealTypeLabel}
                assignment={cell.assignment}
                onAssignRecipe={onAssignRecipe}
                onRemoveAssignment={onRemoveAssignment}
                onPreviewRecipe={onPreviewRecipe}
              />
            ))}
          </div>
        </div>

        {/* Tablet Layout (768-1023px) - Horizontal Scroll */}
        <div className="hidden md:block lg:hidden overflow-x-auto" role="grid" aria-label="Kalendarz posiłków">
          <div className="flex gap-4 pb-4" style={{ minWidth: "max-content" }}>
            {days.map((dayOfWeek) => {
              const dayCells = cellsByDay.get(dayOfWeek) || [];
              const firstCell = dayCells[0];
              if (!firstCell) return null;

              return (
                <div key={dayOfWeek} className="flex-shrink-0 w-64" role="columnheader">
                  {/* Day Header */}
                  <div className="text-center font-semibold text-gray-700 py-3 mb-4 border-b-2 border-gray-300 sticky top-0 bg-white z-10">
                    <div className="text-base">{firstCell.dayName}</div>
                    <div className="text-sm text-gray-500">
                      {firstCell.date.getDate()}.{firstCell.date.getMonth() + 1}.{firstCell.date.getFullYear()}
                    </div>
                  </div>

                  {/* Meals for this day */}
                  <div className="space-y-3">
                    {dayCells.map((cell) => (
                      <MealCell
                        key={`${cell.dayOfWeek}-${cell.mealType}`}
                        date={cell.date}
                        dayOfWeek={cell.dayOfWeek}
                        mealType={cell.mealType}
                        mealTypeLabel={cell.mealTypeLabel}
                        assignment={cell.assignment}
                        onAssignRecipe={onAssignRecipe}
                        onRemoveAssignment={onRemoveAssignment}
                        onPreviewRecipe={onPreviewRecipe}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Layout (<768px) - Accordion */}
        <div className="md:hidden" role="region" aria-label="Kalendarz posiłków">
          <Accordion type="single" collapsible className="w-full">
            {days.map((dayOfWeek) => {
              const dayCells = cellsByDay.get(dayOfWeek) || [];
              const firstCell = dayCells[0];
              if (!firstCell) return null;

              // Count assigned meals for badge
              const assignedCount = dayCells.filter((cell) => !cell.isEmpty).length;

              return (
                <AccordionItem key={dayOfWeek} value={`day-${dayOfWeek}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">{firstCell.dayName}</div>
                        <div className="text-sm text-gray-500">
                          {firstCell.date.getDate()}.{firstCell.date.getMonth() + 1}.{firstCell.date.getFullYear()}
                        </div>
                      </div>
                      {assignedCount > 0 && (
                        <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-white bg-blue-600 rounded-full">
                          {assignedCount}
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      {dayCells.map((cell) => (
                        <MealCell
                          key={`${cell.dayOfWeek}-${cell.mealType}`}
                          date={cell.date}
                          dayOfWeek={cell.dayOfWeek}
                          mealType={cell.mealType}
                          mealTypeLabel={cell.mealTypeLabel}
                          assignment={cell.assignment}
                          onAssignRecipe={onAssignRecipe}
                          onRemoveAssignment={onRemoveAssignment}
                          onPreviewRecipe={onPreviewRecipe}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </div>
    );
  }
);

CalendarGrid.displayName = "CalendarGrid";
