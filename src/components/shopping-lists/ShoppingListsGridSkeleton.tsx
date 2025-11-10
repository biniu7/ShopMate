/**
 * ShoppingListsGridSkeleton component
 * Skeleton loader displayed while shopping lists are loading
 */

import { Skeleton } from "@/components/ui/skeleton";

export function ShoppingListsGridSkeleton() {
  return (
    <div className="shopping-lists-grid-skeleton container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="border rounded-lg p-6 bg-white">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <div className="flex gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
