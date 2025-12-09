import React, { useReducer, useCallback } from "react";
import type {
  CalendarSelectionDto,
  ShoppingListItemPreviewDto,
  ShoppingListPreviewMetadataDto,
  SaveShoppingListItemDto,
  ShoppingListPreviewRequestDto,
  ShoppingListPreviewResponseDto,
  SaveShoppingListDto,
  MealType,
  IngredientCategory,
} from "@/types";
import WizardHeader from "./WizardHeader";
import Step1_ModeSelection from "./Step1_ModeSelection";
import Step2a_CalendarSelection from "./Step2a_CalendarSelection";
import Step2b_RecipesSelection from "./Step2b_RecipesSelection";
import Step3_Generation from "./Step3_Generation";
import Step4_PreviewEdit from "./Step4_PreviewEdit";
import { toast } from "sonner";

/**
 * Stan wizarda
 */
interface WizardState {
  currentStep: 1 | 2 | 3 | 4;
  mode: "calendar" | "recipes" | null;

  // Step 2a state (calendar)
  selectedMeals: CalendarSelectionDto[];

  // Step 2b state (recipes)
  selectedRecipes: string[];

  // Step 3 state (generation)
  generationStatus: "idle" | "fetching" | "categorizing" | "done" | "error";
  generationProgress: number;

  // Step 4 state (preview)
  previewItems: ShoppingListItemPreviewDto[];
  previewMetadata: ShoppingListPreviewMetadataDto | null;

  // Modified items (for save)
  modifiedItems: SaveShoppingListItemDto[];
}

/**
 * Akcje reducera
 */
type WizardAction =
  | { type: "GO_TO_STEP"; payload: 1 | 2 | 3 | 4 }
  | { type: "SET_MODE"; payload: "calendar" | "recipes" }
  | { type: "TOGGLE_MEAL"; payload: { dayOfWeek: number; mealType: MealType } }
  | { type: "SELECT_ALL_MEALS"; payload: CalendarSelectionDto[] }
  | { type: "TOGGLE_RECIPE"; payload: string }
  | { type: "SET_GENERATION_STATUS"; payload: { status: WizardState["generationStatus"]; progress: number } }
  | { type: "SET_PREVIEW_DATA"; payload: ShoppingListPreviewResponseDto }
  | {
      type: "UPDATE_ITEM";
      payload: { index: number; field: string; value: string | number | null | IngredientCategory };
    }
  | { type: "REMOVE_ITEM"; payload: number }
  | { type: "ADD_ITEM"; payload: SaveShoppingListItemDto }
  | { type: "RESET" };

/**
 * Initial state
 */
const initialState: WizardState = {
  currentStep: 1,
  mode: null,
  selectedMeals: [],
  selectedRecipes: [],
  generationStatus: "idle",
  generationProgress: 0,
  previewItems: [],
  previewMetadata: null,
  modifiedItems: [],
};

/**
 * Reducer dla zarządzania stanem wizarda
 */
function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "GO_TO_STEP":
      return { ...state, currentStep: action.payload };

    case "SET_MODE":
      return { ...state, mode: action.payload };

    case "TOGGLE_MEAL": {
      const { dayOfWeek, mealType } = action.payload;
      const existingDay = state.selectedMeals.find((m) => m.day_of_week === dayOfWeek);

      if (existingDay) {
        const hasMealType = existingDay.meal_types.includes(mealType);

        if (hasMealType) {
          // Remove meal type
          const updatedMealTypes = existingDay.meal_types.filter((m) => m !== mealType);

          if (updatedMealTypes.length === 0) {
            // Remove entire day if no meal types left
            return {
              ...state,
              selectedMeals: state.selectedMeals.filter((m) => m.day_of_week !== dayOfWeek),
            };
          } else {
            // Update meal types for this day
            return {
              ...state,
              selectedMeals: state.selectedMeals.map((m) =>
                m.day_of_week === dayOfWeek ? { ...m, meal_types: updatedMealTypes } : m
              ),
            };
          }
        } else {
          // Add meal type to existing day
          return {
            ...state,
            selectedMeals: state.selectedMeals.map((m) =>
              m.day_of_week === dayOfWeek ? { ...m, meal_types: [...m.meal_types, mealType] } : m
            ),
          };
        }
      } else {
        // Add new day with meal type
        return {
          ...state,
          selectedMeals: [...state.selectedMeals, { day_of_week: dayOfWeek, meal_types: [mealType] }],
        };
      }
    }

    case "SELECT_ALL_MEALS":
      return { ...state, selectedMeals: action.payload };

    case "TOGGLE_RECIPE": {
      const recipeId = action.payload;
      const isSelected = state.selectedRecipes.includes(recipeId);

      return {
        ...state,
        selectedRecipes: isSelected
          ? state.selectedRecipes.filter((id) => id !== recipeId)
          : [...state.selectedRecipes, recipeId],
      };
    }

    case "SET_GENERATION_STATUS":
      return {
        ...state,
        generationStatus: action.payload.status,
        generationProgress: action.payload.progress,
      };

    case "SET_PREVIEW_DATA":
      return {
        ...state,
        previewItems: action.payload.items,
        previewMetadata: action.payload.metadata,
        modifiedItems: action.payload.items.map((item) => ({
          ingredient_name: item.ingredient_name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          sort_order: item.sort_order,
        })),
      };

    case "UPDATE_ITEM": {
      const { index, field, value } = action.payload;
      return {
        ...state,
        modifiedItems: state.modifiedItems.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
      };
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        modifiedItems: state.modifiedItems.filter((_, i) => i !== action.payload),
      };

    case "ADD_ITEM":
      return {
        ...state,
        modifiedItems: [...state.modifiedItems, action.payload],
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

/**
 * Główny komponent wizarda Shopping List Generate
 */
export default function ShoppingListWizard() {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  /**
   * Przejście do określonego kroku
   */
  const goToStep = useCallback((step: 1 | 2 | 3 | 4) => {
    dispatch({ type: "GO_TO_STEP", payload: step });
  }, []);

  /**
   * Wybór trybu generowania
   */
  const selectMode = useCallback((mode: "calendar" | "recipes") => {
    dispatch({ type: "SET_MODE", payload: mode });
  }, []);

  /**
   * Toggle zaznaczenia posiłku (calendar mode)
   */
  const toggleMeal = useCallback((dayOfWeek: number, mealType: MealType) => {
    dispatch({ type: "TOGGLE_MEAL", payload: { dayOfWeek, mealType } });
  }, []);

  /**
   * Zaznacz wszystkie posiłki
   */
  const selectAllMeals = useCallback((selections: CalendarSelectionDto[]) => {
    dispatch({ type: "SELECT_ALL_MEALS", payload: selections });
  }, []);

  /**
   * Toggle zaznaczenia przepisu (recipes mode)
   */
  const toggleRecipe = useCallback((recipeId: string) => {
    dispatch({ type: "TOGGLE_RECIPE", payload: recipeId });
  }, []);

  /**
   * Generuj preview listy zakupów
   */
  const generatePreview = useCallback(async () => {
    dispatch({ type: "SET_GENERATION_STATUS", payload: { status: "fetching", progress: 0 } });

    try {
      // Przygotuj request body
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

      // Symulacja progress
      dispatch({ type: "SET_GENERATION_STATUS", payload: { status: "fetching", progress: 40 } });

      // POST /api/shopping-lists/preview
      const response = await fetch("/api/shopping-lists/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      dispatch({ type: "SET_GENERATION_STATUS", payload: { status: "categorizing", progress: 70 } });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Nie udało się wygenerować listy");
      }

      const data: ShoppingListPreviewResponseDto = await response.json();

      dispatch({ type: "SET_GENERATION_STATUS", payload: { status: "categorizing", progress: 90 } });

      // Ustaw dane preview
      dispatch({ type: "SET_PREVIEW_DATA", payload: data });

      dispatch({ type: "SET_GENERATION_STATUS", payload: { status: "done", progress: 100 } });

      // Automatyczne przejście do step 4
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
   * Aktualizuj składnik w preview
   */
  const updateItem = useCallback((index: number, field: string, value: string | number | null | IngredientCategory) => {
    dispatch({ type: "UPDATE_ITEM", payload: { index, field, value } });
  }, []);

  /**
   * Usuń składnik z preview
   */
  const removeItem = useCallback((index: number) => {
    dispatch({ type: "REMOVE_ITEM", payload: index });
  }, []);

  /**
   * Dodaj składnik do preview
   */
  const addItem = useCallback((item: SaveShoppingListItemDto) => {
    dispatch({ type: "ADD_ITEM", payload: item });
  }, []);

  /**
   * Zapisz listę zakupów
   */
  const saveList = useCallback(
    async (name: string) => {
      try {
        const requestBody: SaveShoppingListDto = {
          name,
          week_start_date: state.mode === "calendar" ? state.previewMetadata?.week_start_date || null : null,
          items: state.modifiedItems,
        };

        const response = await fetch("/api/shopping-lists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Nie udało się zapisać listy");
        }

        const savedList = await response.json();

        toast.success("Lista zakupów została zapisana");

        // Przekieruj do widoku szczegółów listy (używamy window.location w Astro)
        window.location.href = `/shopping-lists/${savedList.id}`;
      } catch (error) {
        console.error("Save error:", error);
        toast.error(error instanceof Error ? error.message : "Nie udało się zapisać listy");
        throw error;
      }
    },
    [state.mode, state.modifiedItems, state.previewMetadata]
  );

  return (
    <div className="wizard">
      <WizardHeader currentStep={state.currentStep} />

      {state.currentStep === 1 && (
        <Step1_ModeSelection selectedMode={state.mode} onSelectMode={selectMode} onNext={() => goToStep(2)} />
      )}

      {state.currentStep === 2 && state.mode === "calendar" && (
        <Step2a_CalendarSelection
          selectedMeals={state.selectedMeals}
          onToggleMeal={toggleMeal}
          onSelectAllMeals={selectAllMeals}
          onBack={() => goToStep(1)}
          onNext={() => {
            goToStep(3);
            generatePreview();
          }}
        />
      )}

      {state.currentStep === 2 && state.mode === "recipes" && (
        <Step2b_RecipesSelection
          selectedRecipes={state.selectedRecipes}
          onToggleRecipe={toggleRecipe}
          onBack={() => goToStep(1)}
          onNext={() => {
            goToStep(3);
            generatePreview();
          }}
        />
      )}

      {state.currentStep === 3 && (
        <Step3_Generation status={state.generationStatus} progress={state.generationProgress} />
      )}

      {state.currentStep === 4 && (
        <Step4_PreviewEdit
          items={state.modifiedItems}
          metadata={state.previewMetadata}
          onUpdateItem={updateItem}
          onRemoveItem={removeItem}
          onAddItem={addItem}
          onBack={() => goToStep(2)}
          onCancel={() => (window.location.href = "/shopping-lists")}
          onSave={saveList}
        />
      )}
    </div>
  );
}

/**
 * Pomocnicza funkcja do pobrania początku aktualnego tygodnia
 */
function getCurrentWeekStart(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Poniedziałek = 1
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);

  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, "0");
  const day = String(monday.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
