/**
 * DTO (Data Transfer Object) and Command Model Type Definitions
 *
 * This file contains all DTOs and Command Models used in the ShopMate API.
 * All types are derived from database entity definitions to ensure type safety.
 *
 * Database entities are imported from './db/database.types'
 */

import type { Database } from "./db/database.types";

// ============================================================================
// Database Entity Type Aliases
// ============================================================================

export type Recipe = Database["public"]["Tables"]["recipes"]["Row"];
export type RecipeInsert = Database["public"]["Tables"]["recipes"]["Insert"];
export type RecipeUpdate = Database["public"]["Tables"]["recipes"]["Update"];

export type Ingredient = Database["public"]["Tables"]["ingredients"]["Row"];
export type IngredientInsert = Database["public"]["Tables"]["ingredients"]["Insert"];
export type IngredientUpdate = Database["public"]["Tables"]["ingredients"]["Update"];

export type MealPlan = Database["public"]["Tables"]["meal_plan"]["Row"];
export type MealPlanInsert = Database["public"]["Tables"]["meal_plan"]["Insert"];
export type MealPlanUpdate = Database["public"]["Tables"]["meal_plan"]["Update"];

export type ShoppingList = Database["public"]["Tables"]["shopping_lists"]["Row"];
export type ShoppingListInsert = Database["public"]["Tables"]["shopping_lists"]["Insert"];
export type ShoppingListUpdate = Database["public"]["Tables"]["shopping_lists"]["Update"];

export type ShoppingListItem = Database["public"]["Tables"]["shopping_list_items"]["Row"];
export type ShoppingListItemInsert = Database["public"]["Tables"]["shopping_list_items"]["Insert"];
export type ShoppingListItemUpdate = Database["public"]["Tables"]["shopping_list_items"]["Update"];

// ============================================================================
// Enums and Constants
// ============================================================================

export type MealType = "breakfast" | "second_breakfast" | "lunch" | "dinner";

export type IngredientCategory =
  | "Nabiał" // Dairy
  | "Warzywa" // Vegetables
  | "Owoce" // Fruits
  | "Mięso" // Meat/Fish
  | "Pieczywo" // Bread/Pasta
  | "Przyprawy" // Spices
  | "Inne"; // Other

export const MEAL_TYPES: MealType[] = ["breakfast", "second_breakfast", "lunch", "dinner"];

export const INGREDIENT_CATEGORIES: IngredientCategory[] = [
  "Nabiał",
  "Warzywa",
  "Owoce",
  "Mięso",
  "Pieczywo",
  "Przyprawy",
  "Inne",
];

/**
 * Kolejność kategorii składników (dla sortowania i wyświetlania)
 */
export const CATEGORY_ORDER: IngredientCategory[] = [
  "Nabiał",
  "Warzywa",
  "Owoce",
  "Mięso",
  "Pieczywo",
  "Przyprawy",
  "Inne",
];

// ============================================================================
// Recipe DTOs
// ============================================================================

/**
 * Input DTO for creating or updating ingredients within a recipe
 * Omits database-specific fields (id, recipe_id)
 */
export interface IngredientInputDto {
  name: string;
  quantity: number | null;
  unit: string | null;
  sort_order: number;
}

/**
 * Command Model for creating a new recipe
 * Used in POST /api/recipes
 */
export interface CreateRecipeDto {
  name: string;
  instructions: string;
  ingredients: IngredientInputDto[];
}

/**
 * Command Model for updating a recipe (full replacement)
 * Used in PUT /api/recipes/:id
 */
export type UpdateRecipeDto = CreateRecipeDto;

/**
 * Response DTO for a single ingredient
 * Extends database Ingredient type
 */
export type IngredientResponseDto = Ingredient;

/**
 * Response DTO for a single recipe with nested ingredients
 * Used in GET /api/recipes/:id and POST/PUT responses
 */
export interface RecipeResponseDto extends Recipe {
  ingredients: IngredientResponseDto[];
  meal_plan_assignments?: number; // Count of meal plan assignments
}

/**
 * Response DTO for recipe list items
 * Used in GET /api/recipes (list endpoint)
 */
export interface RecipeListItemDto {
  id: string;
  name: string;
  ingredients_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Response DTO for recipe deletion
 */
export interface DeleteRecipeResponseDto {
  message: string;
  deleted_meal_plan_assignments: number;
}

// ============================================================================
// Meal Plan DTOs
// ============================================================================

/**
 * Command Model for creating a meal plan assignment
 * Used in POST /api/meal-plan
 */
export interface CreateMealPlanDto {
  recipe_id: string;
  week_start_date: string; // YYYY-MM-DD format
  day_of_week: number; // 1-7 (1 = Monday, 7 = Sunday)
  meal_type: MealType;
}

/**
 * Response DTO for a single meal plan assignment
 * Extends database MealPlan and includes recipe name
 */
export interface MealPlanAssignmentDto {
  id: string;
  user_id: string;
  recipe_id: string;
  recipe_name: string;
  week_start_date: string;
  day_of_week: number;
  meal_type: MealType;
  created_at: string;
}

/**
 * Response DTO for week calendar
 * Used in GET /api/meal-plan
 */
export interface WeekCalendarResponseDto {
  week_start_date: string;
  week_end_date: string;
  assignments: MealPlanAssignmentDto[];
}

/**
 * Response DTO for meal plan assignment deletion
 */
export interface DeleteMealPlanResponseDto {
  message: string;
}

// ============================================================================
// Shopping List DTOs
// ============================================================================

/**
 * Selection for calendar-based shopping list generation
 */
export interface CalendarSelectionDto {
  day_of_week: number;
  meal_types: MealType[];
}

/**
 * Command Model for shopping list preview request (Mode 1: From Calendar)
 * Used in POST /api/shopping-lists/preview
 */
export interface ShoppingListPreviewCalendarRequestDto {
  source: "calendar";
  week_start_date: string;
  selections: CalendarSelectionDto[];
}

/**
 * Command Model for shopping list preview request (Mode 2: From Recipes)
 * Used in POST /api/shopping-lists/preview
 */
export interface ShoppingListPreviewRecipesRequestDto {
  source: "recipes";
  recipe_ids: string[];
}

/**
 * Union type for shopping list preview requests
 */
export type ShoppingListPreviewRequestDto =
  | ShoppingListPreviewCalendarRequestDto
  | ShoppingListPreviewRecipesRequestDto;

/**
 * Item in shopping list preview response
 */
export interface ShoppingListItemPreviewDto {
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  category: IngredientCategory;
  sort_order: number;
}

/**
 * Metadata for shopping list preview
 */
export interface ShoppingListPreviewMetadataDto {
  source: "calendar" | "recipes";
  week_start_date?: string;
  total_recipes: number;
  total_items: number;
  ai_categorization_status: "success" | "failed";
  ai_error?: string;
  skipped_empty_meals?: number;
}

/**
 * Response DTO for shopping list preview
 * Used in POST /api/shopping-lists/preview response
 */
export interface ShoppingListPreviewResponseDto {
  items: ShoppingListItemPreviewDto[];
  metadata: ShoppingListPreviewMetadataDto;
}

/**
 * Input DTO for shopping list item when saving
 */
export interface SaveShoppingListItemDto {
  ingredient_name: string;
  quantity?: number | null;
  unit?: string | null;
  category: IngredientCategory;
  sort_order: number;
}

/**
 * Command Model for saving a shopping list
 * Used in POST /api/shopping-lists
 */
export interface SaveShoppingListDto {
  name: string;
  week_start_date?: string | null;
  items: SaveShoppingListItemDto[];
}

/**
 * Response DTO for a shopping list item
 * Extends database ShoppingListItem type
 */
export type ShoppingListItemDto = ShoppingListItem;

/**
 * Response DTO for a complete shopping list with items
 * Used in GET /api/shopping-lists/:id and POST response
 */
export interface ShoppingListResponseDto extends ShoppingList {
  items: ShoppingListItemDto[];
}

/**
 * Response DTO for shopping list in list view
 * Used in GET /api/shopping-lists (list endpoint)
 */
export interface ShoppingListListItemDto {
  id: string;
  name: string;
  week_start_date: string | null;
  items_count: number;
  created_at: string;
}

/**
 * Command Model for updating a shopping list item (check/uncheck)
 * Used in PATCH /api/shopping-lists/:list_id/items/:item_id
 */
export interface UpdateShoppingListItemDto {
  is_checked: boolean;
}

/**
 * Response DTO for shopping list deletion
 */
export interface DeleteShoppingListResponseDto {
  message: string;
}

// ============================================================================
// Pagination DTOs
// ============================================================================

/**
 * Query parameters for pagination
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Pagination metadata in responses
 */
export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * Generic paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

// ============================================================================
// Query Parameter DTOs
// ============================================================================

/**
 * Query parameters for recipe list endpoint
 * Used in GET /api/recipes
 */
export interface RecipeListQueryParams extends PaginationParams {
  search?: string;
  sort?: "name_asc" | "name_desc" | "created_asc" | "created_desc";
}

/**
 * Query parameters for meal plan endpoint
 * Used in GET /api/meal-plan
 */
export interface MealPlanQueryParams {
  week_start_date: string; // YYYY-MM-DD
}

/**
 * Query parameters for shopping list list endpoint
 * Used in GET /api/shopping-lists
 */
export type ShoppingListQueryParams = PaginationParams;

// ============================================================================
// Error Response DTOs
// ============================================================================

/**
 * Standard error response
 */
export interface ErrorResponseDto {
  error: string;
  message?: string;
}

/**
 * Validation error details
 */
export type ValidationErrorDetails = Record<string, string[]>;

/**
 * Validation error response
 */
export interface ValidationErrorResponseDto {
  error: string;
  details: ValidationErrorDetails;
}

// ============================================================================
// Analytics DTOs
// ============================================================================

/**
 * Command Model for tracking export events
 * Used in POST /api/analytics/export
 */
export interface TrackExportDto {
  shopping_list_id: string;
  format: "pdf" | "txt";
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extracts the week start date from a given date (returns Monday)
 */
export type WeekStartDate = string; // YYYY-MM-DD format, always Monday

/**
 * ISO date string format
 */
export type ISODateString = string; // YYYY-MM-DD

/**
 * ISO datetime string format
 */
export type ISODateTimeString = string; // ISO 8601 format

/**
 * UUID string format
 */
export type UUID = string;

// ============================================================================
// API Response Types (Helper types for common response patterns)
// ============================================================================

/**
 * Success response with data
 */
export interface SuccessResponse<T> {
  data: T;
}

/**
 * Created response (201)
 */
export type CreatedResponse<T> = T;

/**
 * No content response (204)
 */
export type NoContentResponse = Record<string, never>;

/**
 * Message-only response
 */
export interface MessageResponse {
  message: string;
}

// ============================================================================
// Calendar View Models (Frontend)
// ============================================================================

/**
 * State tygodnia kalendarza
 */
export interface WeekState {
  weekStartDate: string; // YYYY-MM-DD (Monday)
  weekEndDate: string; // YYYY-MM-DD (Sunday)
  dateRange: string; // "20-26 stycznia 2025" (formatted for display)
}

/**
 * ViewModel dla pojedynczej komórki kalendarza
 * Łączy informacje o dacie, posiłku i przypisaniu
 */
export interface CalendarCellViewModel {
  date: Date; // Full date object
  dateString: string; // YYYY-MM-DD
  dayOfWeek: number; // 1-7 (1=Monday)
  dayName: string; // "Poniedziałek", "Wtorek", ...
  dayNameShort: string; // "Pon", "Wt", ...
  mealType: MealType;
  mealTypeLabel: string; // "Śniadanie", "Drugie śniadanie", "Obiad", "Kolacja"
  assignment: MealPlanAssignmentDto | null;
  isEmpty: boolean; // true if assignment === null
}

/**
 * State modala wyboru przepisu
 */
export interface RecipePickerState {
  isOpen: boolean;
  targetCell: {
    dayOfWeek: number;
    mealType: MealType;
    date: Date;
  } | null;
}

/**
 * State podglądu przepisu
 */
export interface RecipePreviewState {
  isOpen: boolean;
  recipeId: string | null;
  assignmentId: string | null; // Do usunięcia z kalendarza
}

/**
 * Stan całego komponentu Calendar
 */
export interface CalendarState {
  // Week navigation
  weekStartDate: string;
  weekEndDate: string;
  dateRange: string;

  // Assignments
  assignments: MealPlanAssignmentDto[];
  isLoading: boolean;
  error: Error | null;

  // Modals
  recipePicker: RecipePickerState;
  recipePreview: RecipePreviewState;
}

/**
 * Parametry wyszukiwania przepisów w modalu
 */
export interface RecipeSearchParams {
  search: string;
  page: number;
  limit: number;
}

/**
 * Typ dla handlera zmiany tygodnia
 */
export type WeekChangeHandler = (newWeekStart: string) => void;

/**
 * Typ dla handlera przypisania przepisu
 */
export type AssignRecipeHandler = (dayOfWeek: number, mealType: MealType, recipeId: string) => Promise<void>;

/**
 * Typ dla handlera usunięcia przypisania
 */
export type RemoveAssignmentHandler = (assignmentId: string) => Promise<void>;

// ============================================================================
// Dashboard View Models
// ============================================================================

/**
 * Statystyki dashboardu
 */
export interface DashboardStats {
  /** Całkowita liczba przepisów użytkownika */
  recipesCount: number;
  /** Liczba przypisań posiłków w bieżącym tygodniu */
  mealPlansCount: number;
  /** Całkowita liczba zapisanych list zakupów */
  shoppingListsCount: number;
}

/**
 * ViewModel dla nadchodzącego posiłku w timeline
 */
export interface UpcomingMealViewModel {
  /** Etykieta dnia: "Dzisiaj" lub "Jutro" */
  day: string;
  /** Sformatowana data (np. "20 stycznia") */
  date: string;
  /** ISO date string dla sortowania */
  isoDate: string;
  /** Dzień tygodnia (1-7) */
  dayOfWeek: number;
  /** Typ posiłku (breakfast, lunch, etc.) */
  mealType: MealType;
  /** Polska etykieta typu posiłku (np. "Śniadanie") */
  mealTypeLabel: string;
  /** Nazwa przypisanego przepisu */
  recipeName: string;
  /** ID przypisanego przepisu */
  recipeId: string;
  /** Porządek sortowania (0-7, gdzie 0 = dziś śniadanie, 7 = jutro kolacja) */
  sortOrder: number;
}

/**
 * Kompletne dane dla widoku Dashboard
 */
export interface DashboardData {
  /** Statystyki (liczby) */
  stats: DashboardStats;
  /** 3 ostatnio dodane przepisy */
  recentRecipes: RecipeListItemDto[];
  /** Posiłki na dziś i jutro */
  upcomingMeals: UpcomingMealViewModel[];
  /** Czy użytkownik jest nowy (0 przepisów) */
  isNewUser: boolean;
  /** Czy dane się ładują */
  isLoading: boolean;
  /** Błąd jeśli wystąpił */
  error: Error | null;
}

/**
 * Mapowanie typu posiłku na polską etykietę
 */
export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Śniadanie",
  second_breakfast: "Drugie śniadanie",
  lunch: "Obiad",
  dinner: "Kolacja",
};

/**
 * Kolejność typów posiłków (dla sortowania)
 */
export const MEAL_TYPE_ORDER: Record<MealType, number> = {
  breakfast: 0,
  second_breakfast: 1,
  lunch: 2,
  dinner: 3,
};

// ============================================================================
// Recipes List View Models
// ============================================================================

/**
 * Opcje sortowania dla listy przepisów
 */
export type RecipeSortOption = "name_asc" | "name_desc" | "created_asc" | "created_desc";

/**
 * Labels dla opcji sortowania (UI)
 */
export const RECIPE_SORT_LABELS: Record<RecipeSortOption, string> = {
  name_asc: "Alfabetycznie A-Z",
  name_desc: "Alfabetycznie Z-A",
  created_asc: "Najstarsze",
  created_desc: "Najnowsze",
};

/**
 * Stan URL query params dla Recipes List
 */
export interface RecipesListUrlParams {
  search?: string;
  sort?: RecipeSortOption;
}

/**
 * Stan wewnętrzny widoku Recipes List
 */
export interface RecipesListState {
  /** Fraza wyszukiwania */
  search: string;
  /** Typ sortowania */
  sort: RecipeSortOption;
  /** Całkowita liczba przepisów (z pagination) */
  totalRecipes: number;
  /** Płaska lista przepisów ze wszystkich stron */
  recipes: RecipeListItemDto[];
  /** Czy są kolejne strony do załadowania */
  hasNextPage: boolean;
  /** Czy trwa ładowanie pierwszej strony */
  isLoading: boolean;
  /** Czy trwa ładowanie kolejnej strony */
  isFetchingNextPage: boolean;
  /** Błąd jeśli wystąpił */
  error: Error | null;
}

/**
 * Response dla infinite query
 */
export interface RecipesPageResponse {
  data: RecipeListItemDto[];
  pagination: PaginationMetadata;
  nextPage: number | undefined;
}
