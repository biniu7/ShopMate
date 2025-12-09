/**
 * Shopping List Details View Wrapper
 * Wraps ShoppingListDetailsView with QueryProvider to ensure proper React Query context
 * This is necessary because Astro's client:load creates separate islands
 */
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ShoppingListDetailsView } from "./ShoppingListDetailsView";

interface ShoppingListDetailsViewWrapperProps {
  listId: string;
}

/**
 * Wrapper component that provides QueryClient context to ShoppingListDetailsView
 * Must be used as a single client:load component in Astro
 */
export function ShoppingListDetailsViewWrapper({ listId }: ShoppingListDetailsViewWrapperProps) {
  return (
    <QueryProvider>
      <ShoppingListDetailsView listId={listId} />
    </QueryProvider>
  );
}
