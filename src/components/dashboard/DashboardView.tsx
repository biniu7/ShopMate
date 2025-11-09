/**
 * DashboardView - Główny kontener widoku Dashboard
 * Zarządza stanem całego dashboardu i renderuje odpowiednie komponenty
 */

import { useQueryClient } from "@tanstack/react-query";
import { useDashboard } from "@/components/hooks/useDashboard";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { EmptyState } from "./EmptyState";
import { ErrorMessage } from "./ErrorMessage";
import { StatsSection } from "./StatsSection";
import { QuickActionsSection } from "./QuickActionsSection";
import { RecentRecipesSection } from "./RecentRecipesSection";
import { UpcomingMealsSection } from "./UpcomingMealsSection";

export function DashboardView() {
  const queryClient = useQueryClient();
  const { stats, recentRecipes, upcomingMeals, isNewUser, isLoading, error } = useDashboard();

  // Loading state - show skeleton
  if (isLoading) {
    return (
      <div className="dashboard-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardSkeleton />
      </div>
    );
  }

  // Error state - show error message
  if (error) {
    return (
      <div className="dashboard-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorMessage
          title="Nie udało się załadować dashboardu"
          message="Sprawdź połączenie z internetem i spróbuj ponownie."
          error={error}
          onRetry={() => {
            queryClient.invalidateQueries({ queryKey: ["recipes"] });
            queryClient.invalidateQueries({ queryKey: ["shopping-lists"] });
            queryClient.invalidateQueries({ queryKey: ["meal-plan"] });
          }}
        />
      </div>
    );
  }

  // Empty state - new user (0 recipes)
  if (isNewUser) {
    return (
      <div className="dashboard-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardHeader />
        <EmptyState />
      </div>
    );
  }

  // Normal dashboard view
  return (
    <div className="dashboard-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <DashboardHeader />

      {/* Stats Section */}
      <StatsSection stats={stats} />

      {/* Quick Actions Section */}
      <QuickActionsSection />

      {/* Content Grid - Recent Recipes + Upcoming Meals */}
      <div className="dashboard-content grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentRecipesSection recipes={recentRecipes} />
        <UpcomingMealsSection meals={upcomingMeals} />
      </div>
    </div>
  );
}
