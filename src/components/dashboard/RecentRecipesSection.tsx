/**
 * RecentRecipesSection - Sekcja z ostatnimi przepisami
 * Wyświetla 3 ostatnio dodane przepisy
 */

import { ArrowRight } from "lucide-react";
import { RecipeCard } from "./RecipeCard";
import type { RecipeListItemDto } from "@/types";

interface RecentRecipesSectionProps {
  recipes: RecipeListItemDto[];
  isLoading?: boolean;
}

export function RecentRecipesSection({ recipes, isLoading }: RecentRecipesSectionProps) {
  if (isLoading) {
    return (
      <section className="recent-recipes-section mb-8">
        <div className="section-header flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ostatnie przepisy</h2>
        </div>
        <div className="recipes-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="recipe-card-skeleton h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="recent-recipes-section mb-8">
      <div className="section-header flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ostatnie przepisy</h2>
        <a
          href="/recipes"
          className="view-all-link inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
        >
          Zobacz wszystkie
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      {recipes.length === 0 ? (
        <div className="empty-message p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Nie masz jeszcze przepisów</p>
          <a
            href="/recipes/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            <span>Dodaj pierwszy przepis</span>
          </a>
        </div>
      ) : (
        <div className="recipes-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </section>
  );
}