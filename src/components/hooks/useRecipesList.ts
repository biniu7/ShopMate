/**
 * Custom hook for Recipes List view
 * Manages recipes list state, infinite scroll, search and sorting
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useDebouncedValue } from "./useDebouncedValue";
import { fetchRecipes, fetchRecipe } from "@/lib/api/recipes";
import type { RecipeSortOption, RecipesPageResponse, RecipeListItemDto, PaginatedResponse } from "@/types";

const RECIPES_PER_PAGE = 20;
const SEARCH_DEBOUNCE_MS = 300;
const VALID_SORT_OPTIONS: RecipeSortOption[] = ["name_asc", "name_desc", "created_asc", "created_desc"];

/**
 * Parse and validate sort parameter from URL
 * @param sortParam - Sort parameter from URL
 * @returns Valid sort option or default
 */
function parseSort(sortParam: string | null): RecipeSortOption {
  if (sortParam && VALID_SORT_OPTIONS.includes(sortParam as RecipeSortOption)) {
    return sortParam as RecipeSortOption;
  }
  return "created_desc"; // Default
}

/**
 * Main hook for Recipes List view
 * Manages search, sort, infinite scroll and URL sync
 *
 * @returns Recipes list state and handlers
 */
export function useRecipesList() {
  const queryClient = useQueryClient();

  // === Parse URL params on mount ===
  const [initialParams] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      search: params.get("search") || "",
      sort: parseSort(params.get("sort")),
    };
  });

  // === State ===
  const [searchInput, setSearchInput] = useState<string>(initialParams.search);
  const [sort, setSort] = useState<RecipeSortOption>(initialParams.sort);

  // Debounced search value
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);

  // === Sync debounced search with URL (shallow) ===
  useEffect(() => {
    const params = new URLSearchParams();

    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    }
    if (sort !== "created_desc") {
      params.set("sort", sort);
    }

    const newUrl = params.toString() ? `/recipes?${params.toString()}` : "/recipes";

    // Shallow update (replaceState instead of pushState)
    window.history.replaceState({}, "", newUrl);
  }, [debouncedSearch, sort]);

  // === Infinite query for recipes ===
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, refetch } =
    useInfiniteQuery<RecipesPageResponse>({
      queryKey: ["recipes", "list", debouncedSearch, sort],
      queryFn: async ({ pageParam = 1 }) => {
        const result: PaginatedResponse<RecipeListItemDto> = await fetchRecipes({
          search: debouncedSearch || undefined,
          sort,
          page: pageParam as number,
          limit: RECIPES_PER_PAGE,
        });

        return {
          data: result.data,
          pagination: result.pagination,
          nextPage: result.pagination.page < result.pagination.total_pages ? result.pagination.page + 1 : undefined,
        };
      },
      getNextPageParam: (lastPage) => lastPage.nextPage,
      initialPageParam: 1,
      staleTime: 2 * 60 * 1000, // 2 minutes
      refetchOnWindowFocus: true,
    });

  // === Flatten pages to single list ===
  const recipes = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  // === Total count from first page ===
  const totalRecipes = data?.pages[0]?.pagination.total ?? 0;

  // === Handlers ===

  /**
   * Handle search input change
   * Updates local state (debounce happens automatically)
   */
  const handleSearchChange = useCallback((value: string) => {
    // Sanitize and trim
    const sanitized = value.trim().slice(0, 100);
    setSearchInput(sanitized);
  }, []);

  /**
   * Handle sort change
   * Updates state and triggers refetch
   */
  const handleSortChange = useCallback((value: RecipeSortOption) => {
    setSort(value);
  }, []);

  /**
   * Prefetch recipe details (for hover on RecipeCard)
   * Caches recipe data for instant navigation
   */
  const prefetchRecipe = useCallback(
    (recipeId: string) => {
      queryClient.prefetchQuery({
        queryKey: ["recipe", recipeId],
        queryFn: () => fetchRecipe(recipeId),
        staleTime: 10 * 60 * 1000, // 10 minutes
      });
    },
    [queryClient]
  );

  // === Browser back/forward handling ===
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get("search") || "";
      const sortParam = parseSort(params.get("sort"));

      setSearchInput(searchParam);
      setSort(sortParam);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return {
    // State
    search: searchInput,
    sort,
    recipes,
    totalRecipes,
    hasNextPage: hasNextPage ?? false,
    isLoading,
    isFetchingNextPage,
    error: error as Error | null,

    // Handlers
    handleSearchChange,
    handleSortChange,
    fetchNextPage,
    refetch,
    prefetchRecipe,
  };
}
