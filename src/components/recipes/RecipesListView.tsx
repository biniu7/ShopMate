/**
 * Recipes List View - Main Container Component
 * Orchestrates the entire recipes list view with search, sort and infinite scroll
 */
import { useRecipesList } from "@/components/hooks/useRecipesList";
import { RecipesHeader } from "./RecipesHeader";
import { RecipesGrid } from "./RecipesGrid";
import { RecipesGridSkeleton } from "./RecipesGridSkeleton";
import { EmptyState } from "./EmptyState";
import { ErrorMessage } from "./ErrorMessage";

/**
 * Main Recipes List View Component
 * Manages state and orchestrates all child components
 * Handles loading, error and empty states
 */
export function RecipesListView() {
  const {
    search,
    sort,
    recipes,
    totalRecipes,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    error,
    handleSearchChange,
    handleSortChange,
    fetchNextPage,
    refetch,
    prefetchRecipe,
  } = useRecipesList();

  // === Loading state (first load) ===
  if (isLoading && recipes.length === 0) {
    return (
      <>
        <RecipesHeader
          search={search}
          sort={sort}
          onSearchChange={handleSearchChange}
          onSortChange={handleSortChange}
          recipesCount={totalRecipes}
        />
        <div className="container mx-auto p-4">
          <RecipesGridSkeleton />
        </div>
      </>
    );
  }

  // === Error state (first load failed) ===
  if (error && recipes.length === 0) {
    return (
      <>
        <RecipesHeader
          search={search}
          sort={sort}
          onSearchChange={handleSearchChange}
          onSortChange={handleSortChange}
          recipesCount={totalRecipes}
        />
        <div className="container mx-auto p-4">
          <ErrorMessage error={error} onRetry={refetch} />
        </div>
      </>
    );
  }

  // === Empty state (no recipes or no search results) ===
  if (recipes.length === 0) {
    return (
      <>
        <RecipesHeader
          search={search}
          sort={sort}
          onSearchChange={handleSearchChange}
          onSortChange={handleSortChange}
          recipesCount={totalRecipes}
        />
        <div className="container mx-auto p-4">
          <EmptyState hasSearch={!!search} search={search} onClearSearch={() => handleSearchChange("")} />
        </div>
      </>
    );
  }

  // === Success state (recipes loaded) ===
  return (
    <div className="recipes-list-view">
      <RecipesHeader
        search={search}
        sort={sort}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
        recipesCount={totalRecipes}
      />
      <div className="container mx-auto p-4">
        <RecipesGrid
          recipes={recipes}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={fetchNextPage}
          onPrefetch={prefetchRecipe}
        />
      </div>
    </div>
  );
}
