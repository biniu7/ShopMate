/**
 * Recipes Header Component
 * Sticky header with search, sort and add recipe controls
 */
import { SearchBar } from "./SearchBar";
import { SortDropdown } from "./SortDropdown";
import { AddRecipeButton } from "./AddRecipeButton";
import type { RecipeSortOption } from "@/types";

interface RecipesHeaderProps {
  search: string;
  sort: RecipeSortOption;
  onSearchChange: (value: string) => void;
  onSortChange: (value: RecipeSortOption) => void;
  recipesCount: number;
}

/**
 * Get proper Polish pluralization for recipes count
 * @param count - Number of recipes
 * @returns Properly pluralized word
 */
function getPluralizedRecipes(count: number): string {
  if (count === 1) {
    return "przepis";
  }
  return "przepisów";
}

/**
 * Recipes Header Component
 * Sticky header containing search bar, sort dropdown and add recipe button
 * On mobile, shows FAB (Floating Action Button) instead of inline button
 */
export function RecipesHeader({ search, sort, onSearchChange, onSortChange, recipesCount }: RecipesHeaderProps) {
  return (
    <>
      <header className="recipes-header sticky top-0 bg-white z-10 border-b shadow-sm">
        <div className="container mx-auto p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Search bar (full width mobile, max-w-md desktop) */}
            <div className="flex-1 w-full md:max-w-md">
              <SearchBar value={search} onChange={onSearchChange} placeholder="Szukaj przepisu..." />
            </div>

            {/* Right side: count + sort + add button */}
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              {/* Recipes count (only if > 0) */}
              {recipesCount > 0 && (
                <span className="text-sm text-gray-600 whitespace-nowrap">
                  {recipesCount} {getPluralizedRecipes(recipesCount)}
                </span>
              )}

              {/* Sort dropdown */}
              <SortDropdown value={sort} onChange={onSortChange} />

              {/* Add recipe button (desktop only) */}
              <AddRecipeButton className="hidden md:inline-flex" />
            </div>
          </div>
        </div>
      </header>

      {/* Floating Action Button (mobile only) */}
      <AddRecipeButton variant="fab" className="md:hidden fixed bottom-6 right-6 z-20" />
    </>
  );
}
