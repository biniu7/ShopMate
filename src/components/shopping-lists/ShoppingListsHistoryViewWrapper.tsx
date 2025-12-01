/**
 * Shopping Lists History View Wrapper
 * Wraps ShoppingListsHistoryView with QueryProvider to ensure proper React Query context
 * This is necessary because Astro's client:load creates separate islands
 */
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ShoppingListsHistoryView } from "./ShoppingListsHistoryView";

/**
 * Wrapper component that provides QueryClient context to ShoppingListsHistoryView
 * Must be used as a single client:load component in Astro
 */
export function ShoppingListsHistoryViewWrapper() {
  return (
    <QueryProvider>
      <ShoppingListsHistoryView />
    </QueryProvider>
  );
}
