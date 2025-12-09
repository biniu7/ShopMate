/**
 * Recipe search hook
 * Handles recipe search with debounce and infinite scroll
 */
import { useState, useEffect, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchRecipes } from "@/lib/api/recipes";

/**
 * Recipe search hook
 * Provides debounced search with infinite scroll
 *
 * @returns Search state and handlers
 */
export function useRecipeSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Infinite query for recipes
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useInfiniteQuery({
    queryKey: ["recipes", debouncedQuery],
    queryFn: ({ pageParam = 1 }) =>
      fetchRecipes({
        search: debouncedQuery,
        page: pageParam,
        limit: 20,
      }),
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.pagination;
      return page < total_pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Flatten all pages into single array
  const recipes = useMemo(() => data?.pages.flatMap((page) => page.data) || [], [data]);

  return {
    searchQuery,
    setSearchQuery,
    recipes,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  };
}
