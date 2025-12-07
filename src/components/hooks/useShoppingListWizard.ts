/**
 * Custom hook for Shopping List Wizard logic
 * Manages wizard state, API calls, and business logic
 */
import { useReducer, useCallback } from "react";
import { toast } from "sonner";
import { wizardReducer, initialWizardState, type WizardState } from "@/lib/reducers/wizard.reducer";
import { generatePreview, saveShoppingList } from "@/lib/api/shopping-lists";
import { getCurrentWeekStart } from "@/lib/utils/date";
import type {
  CalendarSelectionDto,
  MealType,
  SaveShoppingListItemDto,
  ShoppingListPreviewRequestDto,
  SaveShoppingListDto,
  IngredientCategory,
} from "@/types";

/**
 * Hook for shopping list wizard management
 *
 * @returns Wizard state, actions, and API handlers
 *
 * @example
 * const wizard = useShoppingListWizard();
 * wizard.goToStep(2);
 * wizard.selectMode("calendar");
 */
export function useShoppingListWizard() {
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);

  /**
   * Navigation: Go to specific step
   */
  const goToStep = useCallback((step: 1 | 2 | 3 | 4) => {
    dispatch({ type: "GO_TO_STEP", payload: step });
  }, []);

  /**
   * Step 1: Select mode
   */
  const selectMode = useCallback((mode: "calendar" | "recipes") => {
    dispatch({ type: "SET_MODE", payload: mode });
  }, []);

  /**
   * Step 2a: Toggle meal selection
   */
  const toggleMeal = useCallback((dayOfWeek: number, mealType: MealType) => {
    dispatch({ type: "TOGGLE_MEAL", payload: { dayOfWeek, mealType } });
  }, []);

  /**
   * Step 2a: Select all meals
   */
  const selectAllMeals = useCallback((selections: CalendarSelectionDto[]) => {
    dispatch({ type: "SELECT_ALL_MEALS", payload: selections });
  }, []);

  /**
   * Step 2b: Toggle recipe selection
   */
  const toggleRecipe = useCallback((recipeId: string) => {
    dispatch({ type: "TOGGLE_RECIPE", payload: recipeId });
  }, []);

  /**
   * Step 3: Generate preview
   */
  const generateShoppingListPreview = useCallback(async () => {
    dispatch({ type: "SET_GENERATION_STATUS", payload: { status: "fetching", progress: 0 } });

    try {
      // Prepare request body
      const requestBody: ShoppingListPreviewRequestDto =
        state.mode === "calendar"
          ? {
              source: "calendar",
              week_start_date: getCurrentWeekStart(),
              selections: state.selectedMeals,
            }
          : {
              source: "recipes",
              recipe_ids: state.selectedRecipes,
            };

      // Simulate progress
      dispatch({ type: "SET_GENERATION_STATUS", payload: { status: "fetching", progress: 40 } });

      // Call API
      const data = await generatePreview(requestBody);

      dispatch({ type: "SET_GENERATION_STATUS", payload: { status: "categorizing", progress: 70 } });

      // Small delay to show categorizing state
      await new Promise((resolve) => setTimeout(resolve, 300));

      dispatch({ type: "SET_GENERATION_STATUS", payload: { status: "categorizing", progress: 90 } });

      // Set preview data
      dispatch({ type: "SET_PREVIEW_DATA", payload: data });

      dispatch({ type: "SET_GENERATION_STATUS", payload: { status: "done", progress: 100 } });

      // Auto-navigate to step 4
      setTimeout(() => {
        goToStep(4);
      }, 500);
    } catch (error) {
      console.error("Generation error:", error);
      dispatch({ type: "SET_GENERATION_STATUS", payload: { status: "error", progress: 0 } });
      toast.error(error instanceof Error ? error.message : "Nie udało się wygenerować listy");
    }
  }, [state.mode, state.selectedMeals, state.selectedRecipes, goToStep]);

  /**
   * Step 4: Update item in preview
   */
  const updateItem = useCallback((index: number, field: string, value: string | number | null | IngredientCategory) => {
    dispatch({ type: "UPDATE_ITEM", payload: { index, field, value } });
  }, []);

  /**
   * Step 4: Remove item from preview
   */
  const removeItem = useCallback((index: number) => {
    dispatch({ type: "REMOVE_ITEM", payload: index });
  }, []);

  /**
   * Step 4: Add item to preview
   */
  const addItem = useCallback((item: SaveShoppingListItemDto) => {
    dispatch({ type: "ADD_ITEM", payload: item });
  }, []);

  /**
   * Step 4: Save shopping list
   */
  const saveList = useCallback(
    async (name: string) => {
      try {
        const requestBody: SaveShoppingListDto = {
          name,
          week_start_date: state.mode === "calendar" ? state.previewMetadata?.week_start_date || null : null,
          items: state.modifiedItems,
        };

        const savedList = await saveShoppingList(requestBody);

        toast.success("Lista zakupów została zapisana");

        // Redirect to shopping list details
        window.location.href = `/shopping-lists/${savedList.id}`;
      } catch (error) {
        console.error("Save error:", error);
        toast.error(error instanceof Error ? error.message : "Nie udało się zapisać listy");
        throw error;
      }
    },
    [state.mode, state.modifiedItems, state.previewMetadata]
  );

  /**
   * Reset wizard to initial state
   */
  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return {
    // State
    state,

    // Navigation
    goToStep,

    // Step 1: Mode selection
    selectMode,

    // Step 2a: Calendar selection
    toggleMeal,
    selectAllMeals,

    // Step 2b: Recipes selection
    toggleRecipe,

    // Step 3: Generation
    generateShoppingListPreview,

    // Step 4: Preview editing
    updateItem,
    removeItem,
    addItem,
    saveList,

    // Utility
    reset,
  };
}
