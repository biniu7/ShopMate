/**
 * Recipe Details Skeleton - skeleton loader dla widoku szczegółów przepisu
 * Wyświetlany podczas ładowania danych
 */
import { Skeleton } from "@/components/ui/skeleton";

/**
 * RecipeDetailsSkeleton
 * Skeleton loader podczas ładowania szczegółów przepisu
 */
export function RecipeDetailsSkeleton() {
  return (
    <div className="recipe-details-skeleton">
      {/* Header skeleton */}
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto max-w-7xl px-4 py-4">
          {/* Breadcrumbs skeleton */}
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Buttons skeleton */}
          <div className="flex gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Title skeleton */}
        <Skeleton className="h-10 w-3/4 mb-2" />

        {/* Meta skeleton */}
        <div className="flex gap-4 mb-8">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Grid skeleton */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Ingredients skeleton */}
          <div>
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>

          {/* Instructions skeleton */}
          <div>
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
