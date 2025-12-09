/**
 * Main calendar hook
 * Manages calendar state, meal plan data, and modal states
 */
import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateMealPlanDto,
  MealPlanAssignmentDto,
  MealType,
  RecipePickerState,
  RecipePreviewState,
  WeekCalendarResponseDto,
} from "@/types";
import { fetchMealPlan, createMealPlanAssignment, deleteMealPlanAssignment } from "@/lib/api/meal-plan";
import { buildCalendarCells } from "@/lib/utils/calendar";
import { getCurrentWeekStart, formatDateRange, getWeekEndDate, isValidWeekDate } from "@/lib/utils/date";

/**
 * Main calendar hook
 * Manages all calendar state and operations
 *
 * @param initialWeekStart - Optional initial week start date from URL
 * @returns Calendar state and handlers
 */
export function useCalendar(initialWeekStart?: string) {
  // === State ===
  const [weekStartDate, setWeekStartDate] = useState<string>(
    initialWeekStart && isValidWeekDate(initialWeekStart) ? initialWeekStart : getCurrentWeekStart()
  );

  const [recipePickerState, setRecipePickerState] = useState<RecipePickerState>({
    isOpen: false,
    targetCell: null,
  });

  const [recipePreviewState, setRecipePreviewState] = useState<RecipePreviewState>({
    isOpen: false,
    recipeId: null,
    assignmentId: null,
  });

  // === TanStack Query ===
  const queryClient = useQueryClient();

  // Fetch meal plan for current week
  const {
    data: mealPlanData,
    isLoading,
    error,
    refetch,
  } = useQuery<WeekCalendarResponseDto>({
    queryKey: ["meal-plan", weekStartDate],
    queryFn: () => fetchMealPlan(weekStartDate),
    staleTime: 0, // Always fresh
    refetchOnWindowFocus: true,
  });

  // Mutation: Create assignment with optimistic update
  const createAssignmentMutation = useMutation({
    mutationFn: (dto: CreateMealPlanDto) => createMealPlanAssignment(dto),
    onMutate: async (newAssignment) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["meal-plan", weekStartDate] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<WeekCalendarResponseDto>(["meal-plan", weekStartDate]);

      // Optimistically update to the new value
      queryClient.setQueryData<WeekCalendarResponseDto>(["meal-plan", weekStartDate], (old) => {
        if (!old) return old;
        return {
          ...old,
          assignments: [
            ...old.assignments,
            {
              id: "temp-" + Date.now(), // Temporary ID
              user_id: "temp",
              ...newAssignment,
              recipe_name: "Ładowanie...", // Will be replaced
              created_at: new Date().toISOString(),
            } as MealPlanAssignmentDto,
          ],
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(["meal-plan", weekStartDate], context.previousData);
      }
      console.error("Failed to assign recipe:", err);
      alert("Nie udało się przypisać przepisu. Spróbuj ponownie.");
    },
    onSuccess: () => {
      console.log("Recipe assigned successfully");
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["meal-plan", weekStartDate] });
    },
  });

  // Mutation: Delete assignment with optimistic update
  const deleteAssignmentMutation = useMutation({
    mutationFn: (assignmentId: string) => deleteMealPlanAssignment(assignmentId),
    onMutate: async (assignmentId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["meal-plan", weekStartDate] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<WeekCalendarResponseDto>(["meal-plan", weekStartDate]);

      // Optimistically remove from cache
      queryClient.setQueryData<WeekCalendarResponseDto>(["meal-plan", weekStartDate], (old) => {
        if (!old) return old;
        return {
          ...old,
          assignments: old.assignments.filter((a) => a.id !== assignmentId),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(["meal-plan", weekStartDate], context.previousData);
      }
      console.error("Failed to remove assignment:", err);
      alert("Nie udało się usunąć przypisania. Spróbuj ponownie.");
    },
    onSuccess: () => {
      console.log("Assignment removed successfully");
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["meal-plan", weekStartDate] });
    },
  });

  // === Handlers ===

  /**
   * Handle week change
   * Updates state and URL
   */
  const handleWeekChange = useCallback((newWeekStart: string) => {
    setWeekStartDate(newWeekStart);
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set("week", newWeekStart);
    window.history.pushState({}, "", url.toString());
  }, []);

  /**
   * Handle assign recipe action
   * Opens recipe picker modal
   */
  const handleAssignRecipe = useCallback(
    (dayOfWeek: number, mealType: MealType) => {
      const date = new Date(weekStartDate);
      date.setDate(date.getDate() + (dayOfWeek - 1));

      setRecipePickerState({
        isOpen: true,
        targetCell: {
          dayOfWeek,
          mealType,
          date,
        },
      });
    },
    [weekStartDate]
  );

  /**
   * Handle recipe selected from picker
   * Creates assignment and closes modal
   */
  const handleRecipeSelected = useCallback(
    async (recipeId: string) => {
      if (!recipePickerState.targetCell) return;

      const dto: CreateMealPlanDto = {
        recipe_id: recipeId,
        week_start_date: weekStartDate,
        day_of_week: recipePickerState.targetCell.dayOfWeek,
        meal_type: recipePickerState.targetCell.mealType,
      };

      await createAssignmentMutation.mutateAsync(dto);
      setRecipePickerState({ isOpen: false, targetCell: null });
    },
    [recipePickerState, weekStartDate, createAssignmentMutation]
  );

  /**
   * Handle remove assignment
   * Deletes assignment with optimistic update
   */
  const handleRemoveAssignment = useCallback(
    async (assignmentId: string) => {
      await deleteAssignmentMutation.mutateAsync(assignmentId);
    },
    [deleteAssignmentMutation]
  );

  /**
   * Handle preview recipe
   * Opens recipe preview modal
   */
  const handlePreviewRecipe = useCallback((recipeId: string, assignmentId: string) => {
    setRecipePreviewState({
      isOpen: true,
      recipeId,
      assignmentId,
    });
  }, []);

  // === Computed values ===

  const weekEndDate = useMemo(() => getWeekEndDate(weekStartDate), [weekStartDate]);

  const dateRange = useMemo(() => formatDateRange(weekStartDate, weekEndDate), [weekStartDate, weekEndDate]);

  const cells = useMemo(
    () => buildCalendarCells(weekStartDate, mealPlanData?.assignments || []),
    [weekStartDate, mealPlanData]
  );

  // === URL sync on mount ===
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const weekParam = params.get("week");

    if (weekParam && isValidWeekDate(weekParam) && weekParam !== weekStartDate) {
      setWeekStartDate(weekParam);
    }
  }, []);

  // === Browser back/forward handling ===
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const weekParam = params.get("week");

      if (weekParam && isValidWeekDate(weekParam)) {
        setWeekStartDate(weekParam);
      } else {
        setWeekStartDate(getCurrentWeekStart());
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return {
    // State
    weekStartDate,
    weekEndDate,
    dateRange,
    assignments: mealPlanData?.assignments || [],
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
    closeRecipePicker: () => setRecipePickerState({ isOpen: false, targetCell: null }),
    closeRecipePreview: () => setRecipePreviewState({ isOpen: false, recipeId: null, assignmentId: null }),

    // Mutation states
    isCreating: createAssignmentMutation.isPending,
    isDeleting: deleteAssignmentMutation.isPending,
  };
}
