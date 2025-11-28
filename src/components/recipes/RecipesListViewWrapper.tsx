/**
 * Recipes List View Wrapper
 * Wraps RecipesListView with QueryProvider to ensure proper React Query context
 * This is necessary because Astro's client:load creates separate islands
 */
import { QueryProvider } from "@/components/providers/QueryProvider";
import { RecipesListView } from "./RecipesListView";

/**
 * Wrapper component that provides QueryClient context to RecipesListView
 * Must be used as a single client:load component in Astro
 */
export function RecipesListViewWrapper() {
  return (
    <QueryProvider>
      <RecipesListView />
    </QueryProvider>
  );
}