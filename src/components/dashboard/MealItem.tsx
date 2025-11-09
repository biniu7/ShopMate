/**
 * MealItem - Pojedynczy element timeline posiłku
 * Wyświetla dzień ("Dzisiaj"/"Jutro"), typ posiłku i nazwę przepisu
 */

import { cn } from "@/lib/utils";
import type { UpcomingMealViewModel } from "@/types";

interface MealItemProps {
  meal: UpcomingMealViewModel;
}

export function MealItem({ meal }: MealItemProps) {
  return (
    <div className="meal-item relative flex gap-4 pb-6 last:pb-0">
      {/* Timeline indicator */}
      <div className="meal-item-indicator relative flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-primary-500 dark:bg-primary-400 ring-4 ring-white dark:ring-gray-900 z-10" />
        <div className="absolute top-3 bottom-0 w-px bg-gray-200 dark:bg-gray-700 last:hidden" />
      </div>

      {/* Content */}
      <div className="meal-item-content flex-1 pt-0.5">
        <div className="meal-item-header flex items-center gap-2 mb-1">
          <span className="meal-item-day text-sm font-semibold text-primary-600 dark:text-primary-400">
            {meal.day}
          </span>
          <span className="meal-item-date text-sm text-gray-500 dark:text-gray-400">
            {meal.date}
          </span>
        </div>
        <div className="meal-item-body">
          <span className="meal-item-type text-sm text-gray-600 dark:text-gray-300 block mb-1">
            {meal.mealTypeLabel}
          </span>
          <a
            href={`/recipes/${meal.recipeId}`}
            className={cn(
              "meal-item-recipe inline-block font-medium text-gray-900 dark:text-white",
              "hover:text-primary-600 dark:hover:text-primary-400 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
            )}
          >
            {meal.recipeName}
          </a>
        </div>
      </div>
    </div>
  );
}