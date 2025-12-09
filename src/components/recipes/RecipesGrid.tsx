/**
 * Recipes Grid Component
 * Displays recipes in a responsive grid with infinite scroll
 */
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecipeCard } from "./RecipeCard";
import type { RecipeListItemDto } from "@/types";

interface RecipesGridProps {
  recipes: RecipeListItemDto[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  onPrefetch?: (recipeId: string) => void;
}

/**
 * Recipes Grid Component
 * Responsive grid with infinite scroll using Intersection Observer
 * Fallback to manual "Load More" button if needed
 */
export function RecipesGrid({ recipes, hasNextPage, isFetchingNextPage, onLoadMore, onPrefetch }: RecipesGridProps) {
  // Intersection Observer for infinite scroll
  const { ref: sentinelRef, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  // Auto-trigger fetchNextPage when sentinel is in viewport
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      onLoadMore();
    }
  }, [inView, hasNextPage, isFetchingNextPage, onLoadMore]);

  return (
    <div className="recipes-grid">
      {/* Recipes grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} onPrefetch={onPrefetch} />
        ))}
      </div>

      {/* Infinite scroll sentinel / Load More section */}
      {hasNextPage && (
        <div ref={sentinelRef} className="py-8 flex justify-center">
          {isFetchingNextPage ? (
            // Loading spinner
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Ładowanie...</span>
            </div>
          ) : (
            // Fallback manual button
            <Button onClick={onLoadMore} variant="outline" aria-label="Załaduj więcej przepisów">
              Załaduj więcej
            </Button>
          )}
        </div>
      )}

      {/* Live region for screen readers */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {isFetchingNextPage && "Ładowanie kolejnych przepisów"}
        {!hasNextPage && recipes.length > 0 && "Załadowano wszystkie przepisy"}
      </div>
    </div>
  );
}
