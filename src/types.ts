/**
 * This file contains the Data Transfer Object (DTO) and Command Model types
 * for the ShopMate application's API. These types are derived from the
 * database entity types to ensure consistency and type safety across the application.
 */

import type { Database } from "./db/database.types";

// --- Base Entity Types ---
// These types represent the raw data structure from the database tables.

/** Represents a row in the `recipes` table. */
export type Recipe = Database["public"]["Tables"]["recipes"]["Row"];

/** Represents a row in the `ingredients` table. */
export type Ingredient = Database["public"]["Tables"]["ingredients"]["Row"];

/** Represents a row in the `meal_plan` table. */
export type MealPlan = Database["public"]["Tables"]["meal_plan"]["Row"];

/** Represents a row in the `shopping_lists` table. */
export type ShoppingList = Database["public"]["Tables"]["shopping_lists"]["Row"];

/** Represents a row in the `shopping_list_items` table. */
export type ShoppingListItem = Database["public"]["Tables"]["shopping_list_items"]["Row"];

// --- Enums ---

/** Represents the possible meal types in the meal plan. */
export const mealTypes = ["breakfast", "second_breakfast", "lunch", "dinner"] as const;
export type MealType = (typeof mealTypes)[number];

/** Represents the possible AI-generated categories for shopping list items. */
export const shoppingListItemCategories = [
  "Nabiał",
  "Warzywa",
  "Owoce",
  "Mięso",
  "Pieczywo",
  "Przyprawy",
  "Inne",
] as const;
export type ShoppingListItemCategory = (typeof shoppingListItemCategories)[number];

// --- API Response Wrappers ---

/**
 * Pagination metadata for paginated API responses.
 */
export interface Pagination {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

/**
 * Wrapper for paginated API responses.
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

/**
 * Wrapper for standard API responses.
 */
export interface ApiResponse<T> {
  data: T;
}

// --- Recipe DTOs and Commands ---

/**
 * DTO for an item in the recipe list (`GET /api/recipes`).
 * It's a subset of the `Recipe` entity with an added `ingredient_count`.
 */
export type RecipeListItemDto = Pick<Recipe, "id" | "name" | "instructions" | "created_at" | "updated_at"> & {
  ingredient_count: number;
};

/**
 * DTO for the detailed view of a single recipe (`GET /api/recipes/:id`).
 * Includes the full recipe, its ingredients, and the number of meal plan assignments.
 */
export type RecipeDetailDto = Recipe & {
  ingredients: Omit<Ingredient, "recipe_id">[];
  meal_plan_assignments: number;
};

/**
 * Command model for creating a new ingredient within a recipe.
 * It omits database-generated fields like `id` and `recipe_id`.
 */
export type CreateIngredientCommand = Omit<Ingredient, "id" | "recipe_id">;

/**
 * Command model for creating a new recipe (`POST /api/recipes`).
 * Contains the necessary fields to create a `Recipe` and its associated `Ingredients`.
 */
export type CreateRecipeCommand = Pick<Recipe, "name" | "instructions"> & {
  ingredients: CreateIngredientCommand[];
};

/**
 * Command model for updating an existing recipe (`PUT /api/recipes/:id`).
 * The structure is identical to the creation command.
 */
export type UpdateRecipeCommand = CreateRecipeCommand;

// --- Meal Plan DTOs and Commands ---

/**
 * DTO for a single meal plan assignment, including the recipe name.
 * Used within the `MealPlanDto`.
 */
export type MealPlanAssignmentDto = Pick<MealPlan, "id" | "recipe_id" | "day_of_week" | "created_at"> & {
  meal_type: MealType;
  recipe_name: string;
};

/**
 * DTO for the weekly meal plan view (`GET /api/meal-plan`).
 */
export interface MealPlanDto {
  week_start_date: string;
  assignments: MealPlanAssignmentDto[];
}

/**
 * Command model for creating a new meal plan assignment (`POST /api/meal-plan`).
 */
export type CreateMealPlanAssignmentCommand = Omit<MealPlan, "id" | "created_at" | "user_id">;

// --- Shopping List DTOs and Commands ---

/**
 * DTO for an item in the shopping list history (`GET /api/shopping-lists`).
 */
export type ShoppingListItemDto = Pick<
  ShoppingList,
  "id" | "name" | "week_start_date" | "created_at" | "updated_at"
> & {
  item_count: number;
};

/**
 * DTO for a detailed shopping list view (`GET /api/shopping-lists/:id`).
 * Includes all its items.
 */
export type ShoppingListDetailDto = ShoppingList & {
  items: ShoppingListItem[];
};

/**
 * Command model for generating a shopping list from the calendar.
 */
export interface GenerateShoppingListFromCalendarCommand {
  source: "calendar";
  week_start_date: string;
  selections: {
    day_of_week: number;
    meal_types: MealType[];
  }[];
}

/**
 * Command model for generating a shopping list from a selection of recipes.
 */
export interface GenerateShoppingListFromRecipesCommand {
  source: "recipes";
  recipe_ids: string[];
}

/**
 * Union type for the shopping list generation command (`POST /api/shopping-lists/generate`).
 */
export type GenerateShoppingListCommand =
  | GenerateShoppingListFromCalendarCommand
  | GenerateShoppingListFromRecipesCommand;

/**
 * Represents a single, aggregated item in a generated (but not yet saved) shopping list.
 */
export type GeneratedShoppingListItem = Omit<ShoppingListItem, "id" | "shopping_list_id" | "is_checked">;

/**
 * DTO for the response of the shopping list generation endpoint.
 */
export interface GeneratedShoppingListDto {
  items: GeneratedShoppingListItem[];
  metadata: {
    total_items: number;
    ai_categorization_status: "success" | "failed";
    ai_error?: string;
    source_recipes: number;
  };
}

/**
 * Command model for creating (saving) a new shopping list (`POST /api/shopping-lists`).
 */
export type CreateShoppingListCommand = Pick<ShoppingList, "name" | "week_start_date"> & {
  items: Omit<ShoppingListItem, "id" | "shopping_list_id">[];
};

/**
 * Command model for updating a single item in a shopping list (`PATCH /api/shopping-lists/:id/items/:itemId`).
 * Allows partial updates to specific fields.
 */
export type UpdateShoppingListItemCommand = Partial<
  Pick<ShoppingListItem, "is_checked" | "category" | "quantity" | "sort_order">
>;
