/**
 * Recipes Grid Skeleton Component
 * Loading placeholder for full recipes grid
 */
import { RecipeCardSkeleton } from "./RecipeCardSkeleton";

/**
 * Recipes Grid Skeleton Component
 * Displays 20 skeleton cards in a responsive grid
 * Used during initial page load before recipes data is fetched
 */
export function RecipesGridSkeleton() {
  return (
    <div className="recipes-grid-skeleton">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 20 }).map((_, index) => (
          <RecipeCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
