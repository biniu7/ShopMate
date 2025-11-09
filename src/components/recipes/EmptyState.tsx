/**
 * Empty State Component for Recipes List
 * Displays different states when no recipes are found
 */
import { SearchX, ChefHat, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  hasSearch: boolean;
  search?: string;
  onClearSearch?: () => void;
}

/**
 * Empty State Component
 * Two variants:
 * 1. Search results empty (hasSearch=true) - shows clear button
 * 2. No recipes at all (hasSearch=false) - shows CTA to add first recipe
 */
export function EmptyState({ hasSearch, search, onClearSearch }: EmptyStateProps) {
  return (
    <div className="empty-state py-16 text-center">
      <div className="max-w-md mx-auto">
        {hasSearch ? (
          // Variant 1: Empty search results
          <>
            <SearchX className="h-16 w-16 mx-auto text-gray-400 mb-4" aria-hidden="true" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Brak wyników wyszukiwania</h2>
            <p className="text-gray-600 mb-6">Nie znaleziono przepisów pasujących do &quot;{search}&quot;</p>
            <Button onClick={onClearSearch} variant="outline">
              Wyczyść wyszukiwanie
            </Button>
          </>
        ) : (
          // Variant 2: No recipes at all (new user)
          <>
            <ChefHat className="h-16 w-16 mx-auto text-gray-400 mb-4" aria-hidden="true" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Brak przepisów</h2>
            <p className="text-gray-600 mb-6">Dodaj pierwszy przepis, aby rozpocząć planowanie posiłków</p>
            <Button asChild size="lg">
              <a href="/recipes/new" className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Dodaj pierwszy przepis
              </a>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
