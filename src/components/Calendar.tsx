/**
 * Main Calendar Component
 * Weekly meal planner calendar view
 */
import { lazy, Suspense } from "react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { WeekNavigator } from "@/components/WeekNavigator";
import { CalendarGrid } from "@/components/CalendarGrid";
import { useCalendar } from "@/components/hooks/useCalendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

// Lazy load modals for better performance
const RecipePickerModal = lazy(() => import("@/components/RecipePickerModal"));
const RecipePreviewModal = lazy(() => import("@/components/RecipePreviewModal"));

/**
 * Calendar Loading Skeleton
 * Displayed while calendar data is loading
 */
function CalendarSkeleton() {
  return (
    <div className="calendar-skeleton" aria-busy="true" aria-label="Ładowanie kalendarza">
      {/* Week Navigator Skeleton */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm mb-6">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </div>

      {/* Calendar Grid Skeleton */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          {Array.from({ length: 28 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Calendar Error State
 * Displayed when calendar data fails to load
 */
function CalendarError({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  return (
    <div className="error-state text-center p-8 max-w-md mx-auto" role="alert" aria-live="assertive">
      <div className="mb-4">
        <svg
          className="w-16 h-16 mx-auto text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Nie udało się załadować kalendarza</h2>
      <p className="text-gray-600 mb-6">
        {error?.message || "Wystąpił błąd podczas ładowania danych. Spróbuj ponownie."}
      </p>
      <Button onClick={onRetry} variant="default">
        Spróbuj ponownie
      </Button>
    </div>
  );
}

/**
 * Calendar Empty State
 * Displayed when calendar has no assignments
 */
function CalendarEmptyState({ onAssignFirst }: { onAssignFirst: () => void }) {
  return (
    <div className="empty-state text-center p-12 max-w-md mx-auto">
      <div className="mb-4">
        <svg
          className="w-16 h-16 mx-auto text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Twój kalendarz jest pusty</h3>
      <p className="text-gray-600 mb-6">
        Zacznij planować posiłki klikając &quot;Przypisz przepis&quot; w wybranej komórce
      </p>
      <Button onClick={onAssignFirst} variant="default">
        Przypisz pierwszy przepis
      </Button>
    </div>
  );
}

/**
 * Calendar Content
 * Main calendar content with data
 */
function CalendarContent() {
  const {
    // State
    weekStartDate,
    dateRange,
    assignments,
    cells,
    isLoading,
    error,
    refetch,

    // Modal states
    recipePickerState,
    recipePreviewState,

    // Handlers
    handleWeekChange,
    handleAssignRecipe,
    handleRecipeSelected,
    handleRemoveAssignment,
    handlePreviewRecipe,

    // Modal controllers
    closeRecipePicker,
    closeRecipePreview,
  } = useCalendar();

  // Loading state
  if (isLoading) {
    return <CalendarSkeleton />;
  }

  // Error state
  if (error) {
    return <CalendarError error={error} onRetry={() => refetch()} />;
  }

  const hasAnyAssignments = assignments.length > 0;

  return (
    <div className="calendar-container min-h-screen bg-gray-50">
      {/* Week Navigator */}
      <WeekNavigator weekStartDate={weekStartDate} onWeekChange={handleWeekChange} dateRange={dateRange} />

      {/* Calendar Grid */}
      <div className="container mx-auto px-4 py-6">
        {!hasAnyAssignments ? (
          <CalendarEmptyState onAssignFirst={() => handleAssignRecipe(1, "breakfast")} />
        ) : (
          <CalendarGrid
            weekStartDate={weekStartDate}
            cells={cells}
            onAssignRecipe={handleAssignRecipe}
            onRemoveAssignment={handleRemoveAssignment}
            onPreviewRecipe={handlePreviewRecipe}
          />
        )}
      </div>

      {/* Modals - Lazy Loaded */}
      <Suspense fallback={null}>
        {recipePickerState.isOpen && (
          <RecipePickerModal
            isOpen={recipePickerState.isOpen}
            onClose={closeRecipePicker}
            targetCell={recipePickerState.targetCell}
            weekStartDate={weekStartDate}
            onRecipeSelected={handleRecipeSelected}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {recipePreviewState.isOpen && (
          <RecipePreviewModal
            isOpen={recipePreviewState.isOpen}
            onClose={closeRecipePreview}
            recipeId={recipePreviewState.recipeId}
            assignmentId={recipePreviewState.assignmentId}
            onRemoveFromCalendar={handleRemoveAssignment}
          />
        )}
      </Suspense>
    </div>
  );
}

/**
 * Main Calendar Component with QueryProvider
 */
export default function Calendar() {
  return (
    <QueryProvider>
      <CalendarContent />
    </QueryProvider>
  );
}
