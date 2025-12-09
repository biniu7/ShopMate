/**
 * UpcomingMealsSection - Sekcja z nadchodzącymi posiłkami
 * Wyświetla posiłki zaplanowane na dziś i jutro w formie timeline
 */

import { ArrowRight } from "lucide-react";
import { MealItem } from "./MealItem";
import type { UpcomingMealViewModel } from "@/types";

interface UpcomingMealsSectionProps {
  meals: UpcomingMealViewModel[];
  isLoading?: boolean;
}

export function UpcomingMealsSection({ meals, isLoading }: UpcomingMealsSectionProps) {
  if (isLoading) {
    return (
      <section className="upcoming-meals-section mb-8">
        <div className="section-header flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nadchodzące posiłki</h2>
        </div>
        <div className="meals-timeline space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="meal-item-skeleton h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="upcoming-meals-section mb-8">
      <div className="section-header flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nadchodzące posiłki</h2>
        <a
          href="/calendar"
          className="view-calendar-link inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
        >
          Zobacz kalendarz
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      {meals.length === 0 ? (
        <div className="empty-message p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Brak zaplanowanych posiłków</p>
          <a
            href="/calendar"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            <span>Zaplanuj tydzień</span>
          </a>
        </div>
      ) : (
        <div className="meals-timeline bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          {meals.map((meal, index) => (
            <MealItem key={`${meal.recipeId}-${meal.dayOfWeek}-${meal.mealType}`} meal={meal} />
          ))}
        </div>
      )}
    </section>
  );
}
