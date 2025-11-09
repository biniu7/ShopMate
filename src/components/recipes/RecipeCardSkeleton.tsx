/**
 * Recipe Card Skeleton Component
 * Loading placeholder for RecipeCard with matching layout
 */
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Recipe Card Skeleton Component
 * Displays a skeleton loader matching RecipeCard layout
 * Used during initial load and infinite scroll
 */
export function RecipeCardSkeleton() {
  return (
    <div className="recipe-card-skeleton border rounded-lg p-6 bg-white h-full">
      {/* Title skeleton (2 lines) */}
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-6 w-1/2 mb-3" />

      {/* Metadata skeleton (badges) */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  );
}
