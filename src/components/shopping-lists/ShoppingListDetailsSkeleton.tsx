/**
 * ShoppingListDetailsSkeleton - skeleton loader dla widoku szczegółów listy
 */
import { Skeleton } from "@/components/ui/skeleton";

export function ShoppingListDetailsSkeleton() {
  return (
    <div className="shopping-list-details-skeleton">
      {/* Header skeleton */}
      <header className="sticky top-0 bg-white z-10 border-b shadow-sm">
        <div className="container mx-auto p-4">
          {/* Breadcrumbs skeleton */}
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-48" />
          </div>

          {/* Buttons skeleton */}
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
      </header>

      {/* Content skeleton */}
      <div className="container mx-auto max-w-4xl p-4">
        {/* Title skeleton */}
        <Skeleton className="h-10 w-96 mb-2" />

        {/* Meta skeleton */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>

        {/* Categories skeleton */}
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg">
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
