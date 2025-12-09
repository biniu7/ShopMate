/**
 * Recipe Picker Modal Component
 * Modal for selecting a recipe to assign to a meal
 */
import { memo, useCallback, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/SearchBar";
import { useRecipeSearch } from "@/components/hooks/useRecipeSearch";
import type { MealType } from "@/types";
import { getMealTypeLabel, getDayName } from "@/lib/utils/date";

interface RecipePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCell: {
    dayOfWeek: number;
    mealType: MealType;
    date: Date;
  } | null;
  weekStartDate: string;
  onRecipeSelected: (recipeId: string) => void;
}

/**
 * Recipe Card Component
 * Clickable card for selecting a recipe
 */
const RecipeCard = memo<{
  id: string;
  name: string;
  ingredientsCount: number;
  onClick: () => void;
}>(({ name, ingredientsCount, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label={`Wybierz przepis: ${name}`}
    >
      <h3 className="font-medium text-gray-900 mb-1">{name}</h3>
      <p className="text-sm text-gray-500">
        {ingredientsCount} {ingredientsCount === 1 ? "składnik" : "składników"}
      </p>
    </button>
  );
});

RecipeCard.displayName = "RecipeCard";

/**
 * Recipe Picker Modal Component
 * Modal with search, infinite scroll, and recipe selection
 */
const RecipePickerModal = memo<RecipePickerModalProps>(({ isOpen, onClose, targetCell, onRecipeSelected }) => {
  const { searchQuery, setSearchQuery, recipes, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } =
    useRecipeSearch();

  // Intersection Observer for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle recipe selection
  const handleSelectRecipe = useCallback(
    (recipeId: string) => {
      onRecipeSelected(recipeId);
    },
    [onRecipeSelected]
  );

  // Get target cell display name
  const targetCellDisplay = targetCell
    ? `${getDayName(targetCell.dayOfWeek)} - ${getMealTypeLabel(targetCell.mealType)}`
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Wybierz przepis</DialogTitle>
          <DialogDescription>{targetCell && `Przypisujesz przepis do: ${targetCellDisplay}`}</DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="py-4">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Szukaj przepisu..." />
        </div>

        {/* Recipe List */}
        <ScrollArea className="flex-1 h-[400px] -mx-6 px-6">
          {isLoading && (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
              Ładowanie przepisów...
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-600">Nie udało się załadować przepisów. Spróbuj ponownie.</div>
          )}

          {!isLoading && !error && recipes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchQuery
                ? `Nie znaleziono przepisów dla: "${searchQuery}"`
                : "Brak przepisów. Dodaj pierwszy przepis!"}
            </div>
          )}

          {!isLoading && !error && recipes.length > 0 && (
            <div className="space-y-3">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  id={recipe.id}
                  name={recipe.name}
                  ingredientsCount={recipe.ingredients_count}
                  onClick={() => handleSelectRecipe(recipe.id)}
                />
              ))}

              {/* Load More Trigger */}
              {hasNextPage && (
                <div ref={loadMoreRef} className="text-center py-4">
                  {isFetchingNextPage ? (
                    <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
                  ) : (
                    <p className="text-sm text-gray-500">Przewiń, aby załadować więcej</p>
                  )}
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

RecipePickerModal.displayName = "RecipePickerModal";

export default RecipePickerModal;
