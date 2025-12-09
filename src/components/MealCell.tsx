/**
 * Meal Cell Component
 * Single cell in the calendar grid representing one meal
 */
import { memo } from "react";
import { Button } from "@/components/ui/button";
import type { MealPlanAssignmentDto, MealType } from "@/types";
import { truncateText } from "@/lib/utils/calendar";

interface MealCellProps {
  date: Date;
  dayOfWeek: number; // 1-7
  mealType: MealType;
  mealTypeLabel: string;
  assignment: MealPlanAssignmentDto | null;
  onAssignRecipe: (dayOfWeek: number, mealType: MealType) => void;
  onRemoveAssignment: (assignmentId: string) => void;
  onPreviewRecipe: (recipeId: string, assignmentId: string) => void;
}

/**
 * Meal Cell Component
 * Displays empty state or assigned recipe
 */
export const MealCell = memo<MealCellProps>(
  ({ dayOfWeek, mealType, mealTypeLabel, assignment, onAssignRecipe, onRemoveAssignment, onPreviewRecipe }) => {
    // Empty state - no assignment
    if (!assignment) {
      return (
        <div
          className="meal-cell empty border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
          role="gridcell"
        >
          <p className="text-sm text-gray-500 font-medium mb-2">{mealTypeLabel}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onAssignRecipe(dayOfWeek, mealType)}
            className="w-full text-xs"
            aria-label={`Przypisz przepis do ${mealTypeLabel}`}
          >
            + Przypisz przepis
          </Button>
        </div>
      );
    }

    // Assigned state - has recipe
    return (
      <div
        className="meal-cell assigned border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
        role="gridcell"
      >
        <p className="text-sm text-gray-500 font-medium mb-2">{mealTypeLabel}</p>
        <div className="flex items-start justify-between gap-2">
          <button
            className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline cursor-pointer text-left flex-1 min-w-0 transition-colors"
            onClick={() => onPreviewRecipe(assignment.recipe_id, assignment.id)}
            title={assignment.recipe_name}
            aria-label={`Podgląd przepisu: ${assignment.recipe_name}`}
          >
            <span className="block truncate">{truncateText(assignment.recipe_name, 30)}</span>
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveAssignment(assignment.id)}
            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 h-auto min-w-0 flex-shrink-0"
            aria-label={`Usuń przypisanie: ${assignment.recipe_name}`}
          >
            <span className="text-lg leading-none">×</span>
          </Button>
        </div>
      </div>
    );
  }
);

MealCell.displayName = "MealCell";
