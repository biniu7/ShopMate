import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { CalendarSelectionDto, MealPlanAssignmentDto, MealType } from "@/types";
import { MEAL_TYPES, MEAL_TYPE_LABELS } from "@/types";
import { cn } from "@/lib/utils";

interface CalendarSelectorProps {
  assignments: MealPlanAssignmentDto[];
  selectedMeals: CalendarSelectionDto[];
  onToggleMeal: (dayOfWeek: number, mealType: MealType) => void;
}

const DAY_NAMES = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];
const DAY_NAMES_SHORT = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"];

/**
 * Selektor kalendarza z checkboxami (7 dni × 4 posiłki)
 */
export default function CalendarSelector({ assignments, selectedMeals, onToggleMeal }: CalendarSelectorProps) {
  /**
   * Sprawdza czy posiłek jest zaznaczony
   */
  const isMealSelected = (dayOfWeek: number, mealType: MealType): boolean => {
    const day = selectedMeals.find((m) => m.day_of_week === dayOfWeek);
    return day ? day.meal_types.includes(mealType) : false;
  };

  /**
   * Znajduje przypisanie dla danego dnia i posiłku
   */
  const getAssignment = (dayOfWeek: number, mealType: MealType): MealPlanAssignmentDto | null => {
    return assignments.find((a) => a.day_of_week === dayOfWeek && a.meal_type === mealType) || null;
  };

  return (
    <div className="calendar-selector border rounded-lg p-4 bg-white">
      {/* Desktop: Grid 7 columns */}
      <div className="hidden md:grid md:grid-cols-7 gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => (
          <div key={dayOfWeek} className="day-column">
            <div className="font-medium text-sm mb-2 text-center">
              <div className="hidden lg:block">{DAY_NAMES[dayOfWeek - 1]}</div>
              <div className="lg:hidden">{DAY_NAMES_SHORT[dayOfWeek - 1]}</div>
            </div>

            <div className="space-y-2">
              {MEAL_TYPES.map((mealType) => {
                const assignment = getAssignment(dayOfWeek, mealType);
                const isSelected = isMealSelected(dayOfWeek, mealType);
                const isEmpty = !assignment;

                return (
                  <div
                    key={mealType}
                    className={cn(
                      "meal-checkbox-item p-2 border rounded text-xs transition-colors",
                      isEmpty && "bg-gray-50 text-gray-400",
                      !isEmpty && "hover:bg-gray-50 cursor-pointer",
                      isSelected && !isEmpty && "border-primary bg-primary/5"
                    )}
                    onClick={() => !isEmpty && onToggleMeal(dayOfWeek, mealType)}
                    onKeyDown={(e) => {
                      if (!isEmpty && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        onToggleMeal(dayOfWeek, mealType);
                      }
                    }}
                    role="button"
                    tabIndex={isEmpty ? -1 : 0}
                  >
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id={`meal-${dayOfWeek}-${mealType}`}
                        checked={isSelected}
                        onCheckedChange={() => onToggleMeal(dayOfWeek, mealType)}
                        disabled={isEmpty}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={`meal-${dayOfWeek}-${mealType}`}
                          className={cn("text-xs cursor-pointer block", isEmpty && "cursor-not-allowed")}
                        >
                          <div className="font-medium">{MEAL_TYPE_LABELS[mealType]}</div>
                          {assignment && (
                            <div className="text-xs truncate text-gray-600 mt-1" title={assignment.recipe_name}>
                              {assignment.recipe_name}
                            </div>
                          )}
                          {isEmpty && <div className="text-xs text-gray-400 mt-1">Brak przepisu</div>}
                        </Label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: Lista */}
      <div className="md:hidden space-y-3">
        {[1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => (
          <div key={dayOfWeek} className="day-section border rounded-lg p-3">
            <h3 className="font-semibold text-sm mb-2">{DAY_NAMES[dayOfWeek - 1]}</h3>
            <div className="space-y-2">
              {MEAL_TYPES.map((mealType) => {
                const assignment = getAssignment(dayOfWeek, mealType);
                const isSelected = isMealSelected(dayOfWeek, mealType);
                const isEmpty = !assignment;

                return (
                  <div
                    key={mealType}
                    className={cn(
                      "meal-checkbox-item p-2 border rounded text-sm transition-colors",
                      isEmpty && "bg-gray-50 text-gray-400",
                      !isEmpty && "hover:bg-gray-50 cursor-pointer",
                      isSelected && !isEmpty && "border-primary bg-primary/5"
                    )}
                    onClick={() => !isEmpty && onToggleMeal(dayOfWeek, mealType)}
                    onKeyDown={(e) => {
                      if (!isEmpty && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        onToggleMeal(dayOfWeek, mealType);
                      }
                    }}
                    role="button"
                    tabIndex={isEmpty ? -1 : 0}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={`meal-mobile-${dayOfWeek}-${mealType}`}
                        checked={isSelected}
                        onCheckedChange={() => onToggleMeal(dayOfWeek, mealType)}
                        disabled={isEmpty}
                      />
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={`meal-mobile-${dayOfWeek}-${mealType}`}
                          className={cn("cursor-pointer block", isEmpty && "cursor-not-allowed")}
                        >
                          <div className="font-medium text-sm">{MEAL_TYPE_LABELS[mealType]}</div>
                          {assignment && <div className="text-sm text-gray-600 mt-1">{assignment.recipe_name}</div>}
                          {isEmpty && <div className="text-sm text-gray-400 mt-1">Brak przepisu</div>}
                        </Label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
