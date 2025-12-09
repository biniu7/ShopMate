/**
 * Shopping List Wizard Reducer
 * Manages wizard state transitions and data updates
 */
import type {
  CalendarSelectionDto,
  ShoppingListItemPreviewDto,
  ShoppingListPreviewMetadataDto,
  SaveShoppingListItemDto,
  ShoppingListPreviewResponseDto,
  MealType,
  IngredientCategory,
} from "@/types";

/**
 * Wizard state interface
 */
export interface WizardState {
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
 * Wizard action types
 */
export type WizardAction =
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
 * Initial wizard state
 */
export const initialWizardState: WizardState = {
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
 * Wizard reducer function
 * Handles all state transitions for the shopping list wizard
 */
export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
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
      return initialWizardState;

    default:
      return state;
  }
}
