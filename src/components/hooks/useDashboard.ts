/**
 * useDashboard - Custom hook zarządzający stanem dashboardu
 * Agreguje dane z wielu źródeł i transformuje je do postaci odpowiedniej dla UI
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { getCurrentWeekStart } from "@/lib/utils/date";
import type {
  DashboardData,
  DashboardStats,
  UpcomingMealViewModel,
  RecipeListItemDto,
  ShoppingListListItemDto,
  WeekCalendarResponseDto,
  PaginatedResponse,
} from "@/types";
import { MEAL_TYPE_LABELS, MEAL_TYPE_ORDER } from "@/types";

export function useDashboard(): DashboardData {
  const currentWeekStart = getCurrentWeekStart();

  // Fetch 1: Statystyki przepisów (używamy pagination.total)
  const {
    data: recipesData,
    isLoading: recipesLoading,
    error: recipesError,
  } = useQuery({
    queryKey: ["recipes", "stats"],
    queryFn: async () => {
      const response = await fetch("/api/recipes?page=1&limit=1");
      if (!response.ok) {
        throw new Error("Failed to fetch recipes stats");
      }
      return response.json() as Promise<PaginatedResponse<RecipeListItemDto>>;
    },
    staleTime: 5 * 60 * 1000, // 5 minut
  });

  // Fetch 2: Statystyki list zakupów
  const {
    data: shoppingListsData,
    isLoading: shoppingListsLoading,
    error: shoppingListsError,
  } = useQuery({
    queryKey: ["shopping-lists", "stats"],
    queryFn: async () => {
      const response = await fetch("/api/shopping-lists?page=1&limit=1");
      if (!response.ok) {
        throw new Error("Failed to fetch shopping lists stats");
      }
      return response.json() as Promise<PaginatedResponse<ShoppingListListItemDto>>;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch 3: Kalendarz bieżącego tygodnia (dla statystyk i upcoming meals)
  const {
    data: mealPlanData,
    isLoading: mealPlanLoading,
    error: mealPlanError,
  } = useQuery({
    queryKey: ["meal-plan", currentWeekStart],
    queryFn: async () => {
      const response = await fetch(`/api/meal-plan?week_start_date=${currentWeekStart}`);
      if (!response.ok) {
        throw new Error("Failed to fetch meal plan");
      }
      return response.json() as Promise<WeekCalendarResponseDto>;
    },
    staleTime: 0, // Zawsze fresh
    refetchOnWindowFocus: true,
  });

  // Fetch 4: Ostatnie 3 przepisy
  const {
    data: recentRecipesData,
    isLoading: recentRecipesLoading,
    error: recentRecipesError,
  } = useQuery({
    queryKey: ["recipes", "recent"],
    queryFn: async () => {
      const response = await fetch("/api/recipes?page=1&limit=3&sort=created_desc");
      if (!response.ok) {
        throw new Error("Failed to fetch recent recipes");
      }
      return response.json() as Promise<PaginatedResponse<RecipeListItemDto>>;
    },
    staleTime: 2 * 60 * 1000, // 2 minuty
  });

  // Compute stats
  const stats: DashboardStats = {
    recipesCount: recipesData?.pagination.total ?? 0,
    mealPlansCount: mealPlanData?.assignments.length ?? 0,
    shoppingListsCount: shoppingListsData?.pagination.total ?? 0,
  };

  // Compute upcoming meals (dziś i jutro)
  const upcomingMeals: UpcomingMealViewModel[] = useMemo(() => {
    if (!mealPlanData?.assignments) {
      return [];
    }

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayDayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // 1-7
    const tomorrowDayOfWeek = tomorrow.getDay() === 0 ? 7 : tomorrow.getDay();

    return mealPlanData.assignments
      .filter((assignment) => assignment.day_of_week === todayDayOfWeek || assignment.day_of_week === tomorrowDayOfWeek)
      .map((assignment) => {
        const isToday = assignment.day_of_week === todayDayOfWeek;
        const date = isToday ? today : tomorrow;

        return {
          day: isToday ? "Dzisiaj" : "Jutro",
          date: format(date, "d MMMM", { locale: pl }),
          isoDate: format(date, "yyyy-MM-dd"),
          dayOfWeek: assignment.day_of_week,
          mealType: assignment.meal_type,
          mealTypeLabel: MEAL_TYPE_LABELS[assignment.meal_type],
          recipeName: assignment.recipe_name,
          recipeId: assignment.recipe_id,
          sortOrder: (isToday ? 0 : 4) + MEAL_TYPE_ORDER[assignment.meal_type],
        } as UpcomingMealViewModel;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [mealPlanData]);

  // Aggregate loading state
  const isLoading = recipesLoading || shoppingListsLoading || mealPlanLoading || recentRecipesLoading;

  // Aggregate errors (return first error found)
  const error = (recipesError || shoppingListsError || mealPlanError || recentRecipesError) as Error | null;

  return {
    stats,
    recentRecipes: recentRecipesData?.data ?? [],
    upcomingMeals,
    isNewUser: stats.recipesCount === 0,
    isLoading,
    error,
  };
}
