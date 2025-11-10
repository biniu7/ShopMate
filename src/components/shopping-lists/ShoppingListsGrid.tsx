/**
 * ShoppingListsGrid component
 * Grid layout with shopping list cards. Responsive (2 columns desktop, 1 mobile).
 * Handles pagination with manual "Load more" button.
 */

import { ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShoppingListCard } from "./ShoppingListCard";
import type { ShoppingListListItemDto } from "@/types";

interface ShoppingListsGridProps {
  shoppingLists: ShoppingListListItemDto[];
  onDelete: (id: string, name: string) => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

export function ShoppingListsGrid({
  shoppingLists,
  onDelete,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: ShoppingListsGridProps) {
  return (
    <div className="shopping-lists-grid container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {shoppingLists.map((list) => (
          <ShoppingListCard key={list.id} list={list} onDelete={() => onDelete(list.id, list.name)} />
        ))}
      </div>

      {hasNextPage && (
        <div className="mt-8 flex justify-center">
          <Button onClick={onLoadMore} disabled={isFetchingNextPage} variant="outline" size="lg">
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Ładowanie...
              </>
            ) : (
              <>
                Załaduj więcej
                <ChevronDown className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
