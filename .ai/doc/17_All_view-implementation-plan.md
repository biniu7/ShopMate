1# REST API Implementation Plan - ShopMate MVP

**Version:** 1.0
**Date:** 2025-10-25
**Status:** Ready for Implementation
**Total Endpoints:** 14 (5 Recipes + 3 Meal Plan + 6 Shopping Lists)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Shared Components](#2-shared-components)
3. [Recipes Endpoints](#3-recipes-endpoints)
4. [Meal Plan Endpoints](#4-meal-plan-endpoints)
5. [Shopping Lists Endpoints](#5-shopping-lists-endpoints)
6. [Implementation Sequence](#6-implementation-sequence)
7. [Testing Strategy](#7-testing-strategy)
8. [Deployment Checklist](#8-deployment-checklist)

---

## 1. Architecture Overview

### 1.1 Project Structure

```
src/
├── pages/api/                    # Astro API routes (prerender=false)
│   ├── recipes/
│   │   ├── index.ts             # GET, POST /api/recipes
│   │   └── [id].ts              # GET, PUT, DELETE /api/recipes/:id
│   ├── meal-plan/
│   │   ├── index.ts             # GET, POST /api/meal-plan
│   │   └── [id].ts              # DELETE /api/meal-plan/:id
│   └── shopping-lists/
│       ├── index.ts             # GET, POST /api/shopping-lists
│       ├── [id].ts              # GET, DELETE /api/shopping-lists/:id
│       ├── generate.ts          # POST /api/shopping-lists/generate
│       └── [id]/
│           └── items/
│               └── [itemId].ts  # PATCH /api/shopping-lists/:id/items/:itemId
├── lib/
│   ├── services/                # Business logic
│   │   ├── recipes.service.ts
│   │   ├── meal-plan.service.ts
│   │   ├── shopping-lists.service.ts
│   │   └── ai-categorization.service.ts
│   ├── validation/              # Zod schemas
│   │   ├── recipe.schema.ts
│   │   ├── meal-plan.schema.ts
│   │   ├── shopping-list.schema.ts
│   │   └── common.schema.ts
│   └── utils/
│       ├── api-response.ts      # Response helpers
│       └── error-handler.ts     # Error formatting
├── db/
│   ├── supabase.client.ts       # Supabase client type
│   └── database.types.ts        # Generated types
├── middleware/
│   └── index.ts                 # Supabase context injection
└── types.ts                     # DTOs and Command Models
```

### 1.2 Technology Stack

- **Framework:** Astro 5 with Node.js adapter
- **Runtime:** Node.js (server-side rendering)
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **Validation:** Zod schemas
- **AI:** OpenAI API (GPT-4o mini) - direct, not OpenRouter
- **Type Safety:** TypeScript 5

### 1.3 Common Patterns

**API Route Pattern (Astro):**
```typescript
export const prerender = false; // Required for all API routes

export async function GET(context: APIContext) {
  // Handler implementation
}

export async function POST(context: APIContext) {
  // Handler implementation
}
```

**Authentication Pattern:**
```typescript
const supabase = context.locals.supabase;
const { data: { user }, error } = await supabase.auth.getUser();

if (error || !user) {
  return new Response(JSON.stringify({
    error: "Unauthorized",
    message: "Authentication required"
  }), {
    status: 401,
    headers: { "Content-Type": "application/json" }
  });
}
```

**Validation Pattern:**
```typescript
const validation = schema.safeParse(input);

if (!validation.success) {
  return new Response(JSON.stringify({
    error: "ValidationError",
    message: "Invalid request data",
    details: validation.error.flatten().fieldErrors
  }), {
    status: 400,
    headers: { "Content-Type": "application/json" }
  });
}

const validData = validation.data;
```

**Service Call Pattern:**
```typescript
try {
  const result = await serviceFunction(user.id, validData);

  return new Response(JSON.stringify({
    data: result
  }), {
    status: 200, // or 201 for POST
    headers: { "Content-Type": "application/json" }
  });
} catch (error) {
  console.error("Service error:", error);

  if (error.code === "PGRST116") { // Not found
    return new Response(JSON.stringify({
      error: "NotFound",
      message: "Resource not found"
    }), { status: 404 });
  }

  return new Response(JSON.stringify({
    error: "InternalServerError",
    message: "An unexpected error occurred"
  }), { status: 500 });
}
```

---

## 2. Shared Components

### 2.1 Common Validation Schemas

**File: `src/lib/validation/common.schema.ts`**

```typescript
import { z } from "zod";

// UUID validation
export const uuidSchema = z.string().uuid({
  message: "Invalid UUID format"
});

// Date validation (YYYY-MM-DD)
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "Date must be in YYYY-MM-DD format"
});

// Monday validation helper
export function isMondayValidator(dateString: string): boolean {
  const date = new Date(dateString);
  return date.getDay() === 1; // Monday = 1
}

// Pagination parameters
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

// Generic sort schema factory
export function createSortSchema<T extends readonly string[]>(values: T) {
  return z.enum(values as [string, ...string[]]).optional();
}
```

**Implementation Steps:**
1. Create `src/lib/validation/common.schema.ts`
2. Implement UUID, date, pagination schemas
3. Add Monday validator helper
4. Export all schemas

---

### 2.2 API Response Helpers

**File: `src/lib/utils/api-response.ts`**

```typescript
import type { Pagination } from "@/types";

export function jsonResponse<T>(
  data: T,
  status: number = 200
): Response {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

export function paginatedResponse<T>(
  data: T[],
  pagination: Pagination,
  status: number = 200
): Response {
  return new Response(JSON.stringify({
    data,
    pagination
  }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

export function errorResponse(
  error: string,
  message: string,
  status: number,
  details?: Record<string, string[]>
): Response {
  return new Response(JSON.stringify({
    error,
    message,
    ...(details && { details })
  }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

export function validationErrorResponse(
  zodError: any
): Response {
  return errorResponse(
    "ValidationError",
    "Invalid request data",
    400,
    zodError.flatten().fieldErrors
  );
}
```

**Implementation Steps:**
1. Create `src/lib/utils/api-response.ts`
2. Implement response helper functions
3. Use throughout all API routes

---

### 2.3 Supabase Client Access

**Pattern (Already Configured):**

```typescript
// In API routes - use context.locals.supabase
import type { APIContext } from "astro";
import type { SupabaseClient } from "@/db/supabase.client";

export async function GET(context: APIContext) {
  const supabase: SupabaseClient = context.locals.supabase;
  // Use supabase client
}
```

**Note:** Middleware already injects Supabase client into `context.locals.supabase`

---

## 3. Recipes Endpoints

### 3.1 Validation Schema

**File: `src/lib/validation/recipe.schema.ts`**

```typescript
import { z } from "zod";

// Ingredient schema
export const ingredientSchema = z.object({
  name: z.string()
    .min(1, "Ingredient name is required")
    .max(100, "Ingredient name must be at most 100 characters")
    .transform(val => val.trim()),

  quantity: z.number()
    .positive("Quantity must be positive")
    .optional(),

  unit: z.string()
    .max(50, "Unit must be at most 50 characters")
    .transform(val => val?.trim())
    .optional(),

  sort_order: z.number()
    .int("Sort order must be an integer")
    .min(0, "Sort order must be non-negative")
    .default(0)
});

// Create recipe command schema
export const createRecipeSchema = z.object({
  name: z.string()
    .min(3, "Recipe name must be at least 3 characters")
    .max(100, "Recipe name must be at most 100 characters")
    .transform(val => val.trim()),

  instructions: z.string()
    .min(10, "Instructions must be at least 10 characters")
    .max(5000, "Instructions must be at most 5000 characters")
    .transform(val => val.trim()),

  ingredients: z.array(ingredientSchema)
    .min(1, "At least one ingredient is required")
    .max(50, "Maximum 50 ingredients allowed")
});

// Update recipe schema (identical to create)
export const updateRecipeSchema = createRecipeSchema;

// List recipes query params
export const listRecipesQuerySchema = z.object({
  search: z.string().optional(),
  sort: z.enum(["name_asc", "name_desc", "created_asc", "created_desc"])
    .optional()
    .default("created_desc"),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});
```

**Implementation Steps:**
1. Create `src/lib/validation/recipe.schema.ts`
2. Define ingredient schema with validation
3. Define create/update recipe schemas
4. Define list query params schema
5. Export all schemas

---

### 3.2 Service Layer

**File: `src/lib/services/recipes.service.ts`**

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type {
  CreateRecipeCommand,
  UpdateRecipeCommand,
  RecipeListItemDto,
  RecipeDetailDto
} from "@/types";
import type { Pagination } from "@/types";

interface ListRecipesFilters {
  search?: string;
  sort?: string;
  limit: number;
  offset: number;
}

/**
 * List all recipes for a user with filtering and pagination
 */
export async function listRecipes(
  supabase: SupabaseClient,
  userId: string,
  filters: ListRecipesFilters
): Promise<{ recipes: RecipeListItemDto[]; pagination: Pagination }> {
  // Build query
  let query = supabase
    .from("recipes")
    .select("id, name, instructions, created_at, updated_at, ingredients(count)", {
      count: "exact"
    });

  // Apply search filter
  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  // Apply sorting
  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    name_asc: { column: "name", ascending: true },
    name_desc: { column: "name", ascending: false },
    created_asc: { column: "created_at", ascending: true },
    created_desc: { column: "created_at", ascending: false }
  };

  const sortConfig = sortMap[filters.sort || "created_desc"];
  query = query.order(sortConfig.column, { ascending: sortConfig.ascending });

  // Apply pagination
  query = query.range(filters.offset, filters.offset + filters.limit - 1);

  // Execute query
  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  // Transform to DTO
  const recipes: RecipeListItemDto[] = (data || []).map(recipe => ({
    id: recipe.id,
    name: recipe.name,
    instructions: recipe.instructions,
    created_at: recipe.created_at,
    updated_at: recipe.updated_at,
    ingredient_count: recipe.ingredients?.[0]?.count || 0
  }));

  const pagination: Pagination = {
    total: count || 0,
    limit: filters.limit,
    offset: filters.offset,
    has_more: (filters.offset + filters.limit) < (count || 0)
  };

  return { recipes, pagination };
}

/**
 * Get a single recipe by ID with ingredients and meal plan assignments count
 */
export async function getRecipeById(
  supabase: SupabaseClient,
  userId: string,
  recipeId: string
): Promise<RecipeDetailDto> {
  // Fetch recipe with ingredients
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .select(`
      id,
      name,
      instructions,
      created_at,
      updated_at,
      user_id,
      ingredients (
        id,
        name,
        quantity,
        unit,
        sort_order
      )
    `)
    .eq("id", recipeId)
    .single();

  if (recipeError) {
    throw recipeError;
  }

  // Count meal plan assignments
  const { count: assignmentsCount } = await supabase
    .from("meal_plan")
    .select("*", { count: "exact", head: true })
    .eq("recipe_id", recipeId);

  // Transform to DTO
  return {
    id: recipe.id,
    user_id: recipe.user_id,
    name: recipe.name,
    instructions: recipe.instructions,
    created_at: recipe.created_at,
    updated_at: recipe.updated_at,
    ingredients: (recipe.ingredients || []).map(ing => ({
      id: ing.id,
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      sort_order: ing.sort_order
    })),
    meal_plan_assignments: assignmentsCount || 0
  };
}

/**
 * Create a new recipe with ingredients (atomic transaction)
 */
export async function createRecipe(
  supabase: SupabaseClient,
  userId: string,
  command: CreateRecipeCommand
): Promise<RecipeDetailDto> {
  // Insert recipe
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      user_id: userId,
      name: command.name,
      instructions: command.instructions
    })
    .select()
    .single();

  if (recipeError) {
    throw recipeError;
  }

  // Insert ingredients
  const ingredientsToInsert = command.ingredients.map(ing => ({
    recipe_id: recipe.id,
    name: ing.name,
    quantity: ing.quantity,
    unit: ing.unit,
    sort_order: ing.sort_order
  }));

  const { data: ingredients, error: ingredientsError } = await supabase
    .from("ingredients")
    .insert(ingredientsToInsert)
    .select();

  if (ingredientsError) {
    // Rollback recipe (RLS will prevent access, but clean up)
    await supabase.from("recipes").delete().eq("id", recipe.id);
    throw ingredientsError;
  }

  return {
    id: recipe.id,
    user_id: recipe.user_id,
    name: recipe.name,
    instructions: recipe.instructions,
    created_at: recipe.created_at,
    updated_at: recipe.updated_at,
    ingredients: ingredients.map(ing => ({
      id: ing.id,
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      sort_order: ing.sort_order
    })),
    meal_plan_assignments: 0
  };
}

/**
 * Update a recipe and replace all ingredients
 */
export async function updateRecipe(
  supabase: SupabaseClient,
  userId: string,
  recipeId: string,
  command: UpdateRecipeCommand
): Promise<RecipeDetailDto> {
  // Update recipe
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .update({
      name: command.name,
      instructions: command.instructions
    })
    .eq("id", recipeId)
    .select()
    .single();

  if (recipeError) {
    throw recipeError;
  }

  // Delete old ingredients (CASCADE handled by DB)
  await supabase
    .from("ingredients")
    .delete()
    .eq("recipe_id", recipeId);

  // Insert new ingredients
  const ingredientsToInsert = command.ingredients.map(ing => ({
    recipe_id: recipe.id,
    name: ing.name,
    quantity: ing.quantity,
    unit: ing.unit,
    sort_order: ing.sort_order
  }));

  const { data: ingredients, error: ingredientsError } = await supabase
    .from("ingredients")
    .insert(ingredientsToInsert)
    .select();

  if (ingredientsError) {
    throw ingredientsError;
  }

  // Count meal plan assignments
  const { count: assignmentsCount } = await supabase
    .from("meal_plan")
    .select("*", { count: "exact", head: true })
    .eq("recipe_id", recipeId);

  return {
    id: recipe.id,
    user_id: recipe.user_id,
    name: recipe.name,
    instructions: recipe.instructions,
    created_at: recipe.created_at,
    updated_at: recipe.updated_at,
    ingredients: ingredients.map(ing => ({
      id: ing.id,
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      sort_order: ing.sort_order
    })),
    meal_plan_assignments: assignmentsCount || 0
  };
}

/**
 * Delete a recipe and return the count of deleted meal plan assignments
 */
export async function deleteRecipe(
  supabase: SupabaseClient,
  userId: string,
  recipeId: string
): Promise<{ meal_plan_assignments_deleted: number }> {
  // Count meal plan assignments before deletion
  const { count: assignmentsCount } = await supabase
    .from("meal_plan")
    .select("*", { count: "exact", head: true })
    .eq("recipe_id", recipeId);

  // Delete recipe (CASCADE handles ingredients and meal_plan)
  const { error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", recipeId);

  if (error) {
    throw error;
  }

  return {
    meal_plan_assignments_deleted: assignmentsCount || 0
  };
}
```

**Implementation Steps:**
1. Create `src/lib/services/recipes.service.ts`
2. Implement `listRecipes()` with search, sort, pagination
3. Implement `getRecipeById()` with JOIN ingredients
4. Implement `createRecipe()` with atomic transaction
5. Implement `updateRecipe()` with ingredient replacement
6. Implement `deleteRecipe()` with cascade count
7. Add proper TypeScript types and error handling

---

### 3.3 API Routes

#### 3.3.1 GET /api/recipes and POST /api/recipes

**File: `src/pages/api/recipes/index.ts`**

```typescript
import type { APIContext } from "astro";
import { listRecipesQuerySchema, createRecipeSchema } from "@/lib/validation/recipe.schema";
import { listRecipes, createRecipe } from "@/lib/services/recipes.service";
import {
  jsonResponse,
  paginatedResponse,
  errorResponse,
  validationErrorResponse
} from "@/lib/utils/api-response";

export const prerender = false;

/**
 * GET /api/recipes
 * List all recipes with search, filtering, and pagination
 */
export async function GET(context: APIContext) {
  const supabase = context.locals.supabase;

  // Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return errorResponse("Unauthorized", "Authentication required", 401);
  }

  // Parse and validate query parameters
  const url = new URL(context.request.url);
  const queryParams = {
    search: url.searchParams.get("search") || undefined,
    sort: url.searchParams.get("sort") || undefined,
    limit: url.searchParams.get("limit") || undefined,
    offset: url.searchParams.get("offset") || undefined
  };

  const validation = listRecipesQuerySchema.safeParse(queryParams);
  if (!validation.success) {
    return validationErrorResponse(validation.error);
  }

  // Execute service
  try {
    const { recipes, pagination } = await listRecipes(
      supabase,
      user.id,
      validation.data
    );

    return paginatedResponse(recipes, pagination);
  } catch (error) {
    console.error("Error listing recipes:", error);
    return errorResponse(
      "InternalServerError",
      "An unexpected error occurred",
      500
    );
  }
}

/**
 * POST /api/recipes
 * Create a new recipe with ingredients
 */
export async function POST(context: APIContext) {
  const supabase = context.locals.supabase;

  // Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return errorResponse("Unauthorized", "Authentication required", 401);
  }

  // Parse request body
  let body;
  try {
    body = await context.request.json();
  } catch (error) {
    return errorResponse("ValidationError", "Invalid JSON in request body", 400);
  }

  // Validate request body
  const validation = createRecipeSchema.safeParse(body);
  if (!validation.success) {
    return validationErrorResponse(validation.error);
  }

  // Execute service
  try {
    const recipe = await createRecipe(supabase, user.id, validation.data);
    return jsonResponse(recipe, 201);
  } catch (error) {
    console.error("Error creating recipe:", error);
    return errorResponse(
      "InternalServerError",
      "An unexpected error occurred",
      500
    );
  }
}
```

**Implementation Steps:**
1. Create `src/pages/api/recipes/index.ts`
2. Implement GET handler with query param validation
3. Implement POST handler with body validation
4. Add authentication checks
5. Call service layer functions
6. Return proper response formats

---

#### 3.3.2 GET, PUT, DELETE /api/recipes/:id

**File: `src/pages/api/recipes/[id].ts`**

```typescript
import type { APIContext } from "astro";
import { uuidSchema } from "@/lib/validation/common.schema";
import { updateRecipeSchema } from "@/lib/validation/recipe.schema";
import {
  getRecipeById,
  updateRecipe,
  deleteRecipe
} from "@/lib/services/recipes.service";
import {
  jsonResponse,
  errorResponse,
  validationErrorResponse
} from "@/lib/utils/api-response";

export const prerender = false;

/**
 * GET /api/recipes/:id
 * Get a single recipe with ingredients
 */
export async function GET(context: APIContext) {
  const supabase = context.locals.supabase;

  // Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return errorResponse("Unauthorized", "Authentication required", 401);
  }

  // Validate recipe ID
  const recipeId = context.params.id;
  const idValidation = uuidSchema.safeParse(recipeId);
  if (!idValidation.success) {
    return errorResponse("ValidationError", "Invalid recipe ID format", 400);
  }

  // Execute service
  try {
    const recipe = await getRecipeById(supabase, user.id, idValidation.data);
    return jsonResponse(recipe);
  } catch (error: any) {
    console.error("Error fetching recipe:", error);

    if (error.code === "PGRST116") {
      return errorResponse("NotFound", "Recipe not found", 404);
    }

    return errorResponse(
      "InternalServerError",
      "An unexpected error occurred",
      500
    );
  }
}

/**
 * PUT /api/recipes/:id
 * Update a recipe and its ingredients
 */
export async function PUT(context: APIContext) {
  const supabase = context.locals.supabase;

  // Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return errorResponse("Unauthorized", "Authentication required", 401);
  }

  // Validate recipe ID
  const recipeId = context.params.id;
  const idValidation = uuidSchema.safeParse(recipeId);
  if (!idValidation.success) {
    return errorResponse("ValidationError", "Invalid recipe ID format", 400);
  }

  // Parse request body
  let body;
  try {
    body = await context.request.json();
  } catch (error) {
    return errorResponse("ValidationError", "Invalid JSON in request body", 400);
  }

  // Validate request body
  const validation = updateRecipeSchema.safeParse(body);
  if (!validation.success) {
    return validationErrorResponse(validation.error);
  }

  // Execute service
  try {
    const recipe = await updateRecipe(
      supabase,
      user.id,
      idValidation.data,
      validation.data
    );
    return jsonResponse(recipe);
  } catch (error: any) {
    console.error("Error updating recipe:", error);

    if (error.code === "PGRST116") {
      return errorResponse("NotFound", "Recipe not found", 404);
    }

    return errorResponse(
      "InternalServerError",
      "An unexpected error occurred",
      500
    );
  }
}

/**
 * DELETE /api/recipes/:id
 * Delete a recipe and all related data
 */
export async function DELETE(context: APIContext) {
  const supabase = context.locals.supabase;

  // Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return errorResponse("Unauthorized", "Authentication required", 401);
  }

  // Validate recipe ID
  const recipeId = context.params.id;
  const idValidation = uuidSchema.safeParse(recipeId);
  if (!idValidation.success) {
    return errorResponse("ValidationError", "Invalid recipe ID format", 400);
  }

  // Execute service
  try {
    const result = await deleteRecipe(supabase, user.id, idValidation.data);

    return new Response(JSON.stringify({
      message: "Recipe deleted successfully",
      meal_plan_assignments_deleted: result.meal_plan_assignments_deleted
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("Error deleting recipe:", error);

    if (error.code === "PGRST116") {
      return errorResponse("NotFound", "Recipe not found", 404);
    }

    return errorResponse(
      "InternalServerError",
      "An unexpected error occurred",
      500
    );
  }
}
```

**Implementation Steps:**
1. Create `src/pages/api/recipes/[id].ts`
2. Implement GET handler with UUID validation
3. Implement PUT handler with body + UUID validation
4. Implement DELETE handler with cascade response
5. Add proper error handling for 404 cases
6. Return appropriate response formats

---

## 4. Meal Plan Endpoints

### 4.1 Validation Schema

**File: `src/lib/validation/meal-plan.schema.ts`**

```typescript
import { z } from "zod";
import { dateSchema, isMondayValidator } from "./common.schema";
import { mealTypes } from "@/types";

// Meal type enum schema
export const mealTypeSchema = z.enum(mealTypes);

// Create meal plan assignment schema
export const createMealPlanAssignmentSchema = z.object({
  recipe_id: z.string().uuid("Invalid recipe ID"),

  week_start_date: dateSchema.refine(
    (date) => isMondayValidator(date),
    { message: "week_start_date must be a Monday" }
  ),

  day_of_week: z.number()
    .int("day_of_week must be an integer")
    .min(1, "day_of_week must be between 1 (Monday) and 7 (Sunday)")
    .max(7, "day_of_week must be between 1 (Monday) and 7 (Sunday)"),

  meal_type: mealTypeSchema
});

// Get meal plan query schema
export const getMealPlanQuerySchema = z.object({
  week_start_date: dateSchema.refine(
    (date) => isMondayValidator(date),
    { message: "week_start_date must be a Monday" }
  )
});
```

**Implementation Steps:**
1. Create `src/lib/validation/meal-plan.schema.ts`
2. Define meal type enum from types.ts
3. Create assignment schema with Monday validation
4. Create query schema for GET endpoint
5. Export all schemas

---

### 4.2 Service Layer

**File: `src/lib/services/meal-plan.service.ts`**

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type {
  CreateMealPlanAssignmentCommand,
  MealPlanDto,
  MealPlanAssignmentDto
} from "@/types";

/**
 * Get meal plan for a specific week
 */
export async function getMealPlan(
  supabase: SupabaseClient,
  userId: string,
  weekStartDate: string
): Promise<MealPlanDto> {
  const { data, error } = await supabase
    .from("meal_plan")
    .select(`
      id,
      recipe_id,
      day_of_week,
      meal_type,
      created_at,
      recipes (
        name
      )
    `)
    .eq("week_start_date", weekStartDate)
    .order("day_of_week")
    .order("meal_type");

  if (error) {
    throw error;
  }

  // Transform to DTO with custom meal_type sorting
  const mealTypeOrder = {
    breakfast: 1,
    second_breakfast: 2,
    lunch: 3,
    dinner: 4
  };

  const assignments: MealPlanAssignmentDto[] = (data || [])
    .map(item => ({
      id: item.id,
      recipe_id: item.recipe_id,
      day_of_week: item.day_of_week,
      meal_type: item.meal_type as any,
      recipe_name: item.recipes?.name || "Unknown Recipe",
      created_at: item.created_at
    }))
    .sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) {
        return a.day_of_week - b.day_of_week;
      }
      return mealTypeOrder[a.meal_type] - mealTypeOrder[b.meal_type];
    });

  return {
    week_start_date: weekStartDate,
    assignments
  };
}

/**
 * Create a meal plan assignment
 */
export async function createMealPlanAssignment(
  supabase: SupabaseClient,
  userId: string,
  command: CreateMealPlanAssignmentCommand
): Promise<MealPlanAssignmentDto> {
  // Check if recipe exists and belongs to user
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .select("id, name")
    .eq("id", command.recipe_id)
    .single();

  if (recipeError || !recipe) {
    const error: any = new Error("Recipe not found");
    error.code = "RECIPE_NOT_FOUND";
    throw error;
  }

  // Insert assignment
  const { data, error } = await supabase
    .from("meal_plan")
    .insert({
      user_id: userId,
      recipe_id: command.recipe_id,
      week_start_date: command.week_start_date,
      day_of_week: command.day_of_week,
      meal_type: command.meal_type
    })
    .select()
    .single();

  if (error) {
    // Check for unique constraint violation
    if (error.code === "23505") {
      const conflictError: any = new Error("Recipe already assigned to this meal slot");
      conflictError.code = "CONFLICT";
      throw conflictError;
    }
    throw error;
  }

  return {
    id: data.id,
    recipe_id: data.recipe_id,
    day_of_week: data.day_of_week,
    meal_type: data.meal_type,
    recipe_name: recipe.name,
    created_at: data.created_at
  };
}

/**
 * Delete a meal plan assignment
 */
export async function deleteMealPlanAssignment(
  supabase: SupabaseClient,
  userId: string,
  assignmentId: string
): Promise<void> {
  const { error } = await supabase
    .from("meal_plan")
    .delete()
    .eq("id", assignmentId);

  if (error) {
    throw error;
  }
}
```

**Implementation Steps:**
1. Create `src/lib/services/meal-plan.service.ts`
2. Implement `getMealPlan()` with JOIN recipes
3. Implement custom sorting (day + meal_type order)
4. Implement `createMealPlanAssignment()` with recipe validation
5. Handle UNIQUE constraint violation (409 Conflict)
6. Implement `deleteMealPlanAssignment()`
7. Add proper error handling

---

### 4.3 API Routes

#### 4.3.1 GET /api/meal-plan and POST /api/meal-plan

**File: `src/pages/api/meal-plan/index.ts`**

```typescript
import type { APIContext } from "astro";
import {
  getMealPlanQuerySchema,
  createMealPlanAssignmentSchema
} from "@/lib/validation/meal-plan.schema";
import {
  getMealPlan,
  createMealPlanAssignment
} from "@/lib/services/meal-plan.service";
import {
  jsonResponse,
  errorResponse,
  validationErrorResponse
} from "@/lib/utils/api-response";

export const prerender = false;

/**
 * GET /api/meal-plan
 * Get meal plan for a specific week
 */
export async function GET(context: APIContext) {
  const supabase = context.locals.supabase;

  // Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return errorResponse("Unauthorized", "Authentication required", 401);
  }

  // Parse and validate query parameters
  const url = new URL(context.request.url);
  const queryParams = {
    week_start_date: url.searchParams.get("week_start_date")
  };

  const validation = getMealPlanQuerySchema.safeParse(queryParams);
  if (!validation.success) {
    return validationErrorResponse(validation.error);
  }

  // Execute service
  try {
    const mealPlan = await getMealPlan(
      supabase,
      user.id,
      validation.data.week_start_date
    );

    return jsonResponse(mealPlan);
  } catch (error) {
    console.error("Error fetching meal plan:", error);
    return errorResponse(
      "InternalServerError",
      "An unexpected error occurred",
      500
    );
  }
}

/**
 * POST /api/meal-plan
 * Create a meal plan assignment
 */
export async function POST(context: APIContext) {
  const supabase = context.locals.supabase;

  // Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return errorResponse("Unauthorized", "Authentication required", 401);
  }

  // Parse request body
  let body;
  try {
    body = await context.request.json();
  } catch (error) {
    return errorResponse("ValidationError", "Invalid JSON in request body", 400);
  }

  // Validate request body
  const validation = createMealPlanAssignmentSchema.safeParse(body);
  if (!validation.success) {
    return validationErrorResponse(validation.error);
  }

  // Execute service
  try {
    const assignment = await createMealPlanAssignment(
      supabase,
      user.id,
      validation.data
    );

    return jsonResponse(assignment, 201);
  } catch (error: any) {
    console.error("Error creating meal plan assignment:", error);

    if (error.code === "RECIPE_NOT_FOUND") {
      return errorResponse("NotFound", "Recipe not found", 404);
    }

    if (error.code === "CONFLICT") {
      return errorResponse(
        "Conflict",
        "Recipe already assigned to this meal slot",
        409
      );
    }

    return errorResponse(
      "InternalServerError",
      "An unexpected error occurred",
      500
    );
  }
}
```

**Implementation Steps:**
1. Create `src/pages/api/meal-plan/index.ts`
2. Implement GET handler with Monday validation
3. Implement POST handler with all validations
4. Handle 404 (recipe not found) and 409 (conflict)
5. Return proper response formats

---

#### 4.3.2 DELETE /api/meal-plan/:id

**File: `src/pages/api/meal-plan/[id].ts`**

```typescript
import type { APIContext } from "astro";
import { uuidSchema } from "@/lib/validation/common.schema";
import { deleteMealPlanAssignment } from "@/lib/services/meal-plan.service";
import { errorResponse } from "@/lib/utils/api-response";

export const prerender = false;

/**
 * DELETE /api/meal-plan/:id
 * Delete a meal plan assignment
 */
export async function DELETE(context: APIContext) {
  const supabase = context.locals.supabase;

  // Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return errorResponse("Unauthorized", "Authentication required", 401);
  }

  // Validate assignment ID
  const assignmentId = context.params.id;
  const idValidation = uuidSchema.safeParse(assignmentId);
  if (!idValidation.success) {
    return errorResponse("ValidationError", "Invalid assignment ID format", 400);
  }

  // Execute service
  try {
    await deleteMealPlanAssignment(supabase, user.id, idValidation.data);

    return new Response(JSON.stringify({
      message: "Assignment removed successfully"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("Error deleting meal plan assignment:", error);

    if (error.code === "PGRST116") {
      return errorResponse("NotFound", "Assignment not found", 404);
    }

    return errorResponse(
      "InternalServerError",
      "An unexpected error occurred",
      500
    );
  }
}
```

**Implementation Steps:**
1. Create `src/pages/api/meal-plan/[id].ts`
2. Implement DELETE handler with UUID validation
3. Handle 404 for non-existent assignments
4. Return success message

---

## 5. Shopping Lists Endpoints

### 5.1 Validation Schema

**File: `src/lib/validation/shopping-list.schema.ts`**

```typescript
import { z } from "zod";
import { dateSchema } from "./common.schema";
import { shoppingListItemCategories, mealTypes } from "@/types";

// Shopping list item category schema
export const categorySchema = z.enum(shoppingListItemCategories);

// Shopping list item schema (for generated and saved items)
export const shoppingListItemSchema = z.object({
  ingredient_name: z.string()
    .min(1, "Ingredient name is required")
    .max(100, "Ingredient name must be at most 100 characters"),

  quantity: z.number()
    .positive("Quantity must be positive")
    .optional(),

  unit: z.string()
    .max(50, "Unit must be at most 50 characters")
    .optional(),

  category: categorySchema.default("Inne"),

  sort_order: z.number()
    .int("Sort order must be an integer")
    .min(0, "Sort order must be non-negative")
    .default(0)
});

// Generate from calendar command
export const generateFromCalendarSchema = z.object({
  source: z.literal("calendar"),
  week_start_date: dateSchema,
  selections: z.array(
    z.object({
      day_of_week: z.number().int().min(1).max(7),
      meal_types: z.array(z.enum(mealTypes)).min(1)
    })
  ).min(1, "At least one selection is required")
});

// Generate from recipes command
export const generateFromRecipesSchema = z.object({
  source: z.literal("recipes"),
  recipe_ids: z.array(z.string().uuid())
    .min(1, "At least one recipe ID is required")
    .max(20, "Maximum 20 recipes allowed")
});

// Union schema for generate command
export const generateShoppingListSchema = z.discriminatedUnion("source", [
  generateFromCalendarSchema,
  generateFromRecipesSchema
]);

// Create shopping list schema
export const createShoppingListSchema = z.object({
  name: z.string()
    .max(200, "Name must be at most 200 characters")
    .default("Lista zakupów"),

  week_start_date: dateSchema.optional(),

  items: z.array(shoppingListItemSchema)
    .min(1, "At least one item is required")
    .max(100, "Maximum 100 items allowed")
});

// Update shopping list item schema (partial)
export const updateShoppingListItemSchema = z.object({
  is_checked: z.boolean().optional(),
  category: categorySchema.optional(),
  quantity: z.number().positive().optional(),
  sort_order: z.number().int().min(0).optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update" }
);

// List shopping lists query schema
export const listShoppingListsQuerySchema = z.object({
  sort: z.enum(["created_desc", "created_asc", "name_asc", "name_desc"])
    .optional()
    .default("created_desc"),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});
```

**Implementation Steps:**
1. Create `src/lib/validation/shopping-list.schema.ts`
2. Define item schema with category enum
3. Create discriminated union for generate command
4. Define create and update schemas
5. Add list query params schema
6. Export all schemas

---

### 5.2 AI Categorization Service

**File: `src/lib/services/ai-categorization.service.ts`**

```typescript
import OpenAI from "openai";
import type { ShoppingListItemCategory } from "@/types";

// Initialize OpenAI client (API key from environment)
const openai = new OpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY
});

const VALID_CATEGORIES: ShoppingListItemCategory[] = [
  "Nabiał",
  "Warzywa",
  "Owoce",
  "Mięso",
  "Pieczywo",
  "Przyprawy",
  "Inne"
];

interface IngredientToCategorize {
  index: number;
  name: string;
}

/**
 * Categorize ingredients using OpenAI GPT-4o mini
 */
export async function categorizeIngredientsWithAI(
  ingredients: IngredientToCategorize[]
): Promise<Record<number, ShoppingListItemCategory>> {
  // Prepare prompt
  const ingredientList = ingredients
    .map((ing) => `${ing.index}. ${ing.name}`)
    .join("\n");

  const prompt = `Kategoryzuj następujące składniki do jednej z kategorii: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne.

Zwróć JSON w formacie: {"1": "kategoria", "2": "kategoria", ...}

Składniki:
${ingredientList}

Zwróć TYLKO obiekt JSON, bez dodatkowego tekstu.`;

  try {
    // Call OpenAI with retry logic
    const response = await callOpenAIWithRetry(prompt);

    // Parse and validate response
    const categories = parseAndValidateCategories(response, ingredients.length);

    return categories;
  } catch (error) {
    console.error("AI categorization failed:", error);

    // Fallback: assign "Inne" to all items
    return ingredients.reduce((acc, ing) => {
      acc[ing.index] = "Inne";
      return acc;
    }, {} as Record<number, ShoppingListItemCategory>);
  }
}

/**
 * Call OpenAI API with retry logic (exponential backoff)
 */
async function callOpenAIWithRetry(
  prompt: string,
  maxRetries: number = 2
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Jesteś asystentem kategoryzującym składniki spożywcze do polskich kategorii zakupowych."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0,
        max_tokens: 500,
        timeout: 10000 // 10 seconds
      });

      return completion.choices[0]?.message?.content || "{}";
    } catch (error: any) {
      console.error(`OpenAI API attempt ${attempt + 1} failed:`, error);
      lastError = error;

      // Wait before retry (exponential backoff: 1s, 2s)
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error("OpenAI API failed after retries");
}

/**
 * Parse and validate OpenAI response
 */
function parseAndValidateCategories(
  response: string,
  expectedCount: number
): Record<number, ShoppingListItemCategory> {
  try {
    const parsed = JSON.parse(response);
    const categories: Record<number, ShoppingListItemCategory> = {};

    for (let i = 1; i <= expectedCount; i++) {
      const category = parsed[i.toString()];

      // Validate category
      if (VALID_CATEGORIES.includes(category)) {
        categories[i] = category;
      } else {
        categories[i] = "Inne"; // Fallback for invalid categories
      }
    }

    return categories;
  } catch (error) {
    console.error("Failed to parse OpenAI response:", error);
    throw error;
  }
}
```

**Implementation Steps:**
1. Create `src/lib/services/ai-categorization.service.ts`
2. Initialize OpenAI client with environment variable
3. Implement `categorizeIngredientsWithAI()` main function
4. Implement retry logic with exponential backoff
5. Implement response parsing and validation
6. Add fallback to "Inne" on error
7. Add proper error logging

**Environment Variable:**
```env
OPENAI_API_KEY=sk-...your-key-here
```

---

### 5.3 Shopping Lists Service

**File: `src/lib/services/shopping-lists.service.ts`**

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type {
  GenerateShoppingListCommand,
  GeneratedShoppingListDto,
  CreateShoppingListCommand,
  ShoppingListItemDto,
  ShoppingListDetailDto,
  UpdateShoppingListItemCommand,
  ShoppingListItem,
  MealType
} from "@/types";
import type { Pagination } from "@/types";
import { categorizeIngredientsWithAI } from "./ai-categorization.service";

interface ListShoppingListsFilters {
  sort?: string;
  limit: number;
  offset: number;
}

/**
 * List all shopping lists with pagination
 */
export async function listShoppingLists(
  supabase: SupabaseClient,
  userId: string,
  filters: ListShoppingListsFilters
): Promise<{ lists: ShoppingListItemDto[]; pagination: Pagination }> {
  // Build query
  let query = supabase
    .from("shopping_lists")
    .select("id, name, week_start_date, created_at, updated_at, shopping_list_items(count)", {
      count: "exact"
    });

  // Apply sorting
  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    created_desc: { column: "created_at", ascending: false },
    created_asc: { column: "created_at", ascending: true },
    name_asc: { column: "name", ascending: true },
    name_desc: { column: "name", ascending: false }
  };

  const sortConfig = sortMap[filters.sort || "created_desc"];
  query = query.order(sortConfig.column, { ascending: sortConfig.ascending });

  // Apply pagination
  query = query.range(filters.offset, filters.offset + filters.limit - 1);

  // Execute query
  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  // Transform to DTO
  const lists: ShoppingListItemDto[] = (data || []).map(list => ({
    id: list.id,
    name: list.name,
    week_start_date: list.week_start_date,
    created_at: list.created_at,
    updated_at: list.updated_at,
    item_count: list.shopping_list_items?.[0]?.count || 0
  }));

  const pagination: Pagination = {
    total: count || 0,
    limit: filters.limit,
    offset: filters.offset,
    has_more: (filters.offset + filters.limit) < (count || 0)
  };

  return { lists, pagination };
}

/**
 * Get a single shopping list by ID with items
 */
export async function getShoppingListById(
  supabase: SupabaseClient,
  userId: string,
  listId: string
): Promise<ShoppingListDetailDto> {
  const { data: list, error } = await supabase
    .from("shopping_lists")
    .select(`
      id,
      name,
      week_start_date,
      created_at,
      updated_at,
      user_id,
      shopping_list_items (
        id,
        ingredient_name,
        quantity,
        unit,
        category,
        is_checked,
        sort_order
      )
    `)
    .eq("id", listId)
    .single();

  if (error) {
    throw error;
  }

  // Sort items by category order + sort_order
  const categoryOrder = {
    "Nabiał": 1,
    "Warzywa": 2,
    "Owoce": 3,
    "Mięso": 4,
    "Pieczywo": 5,
    "Przyprawy": 6,
    "Inne": 7
  };

  const sortedItems = (list.shopping_list_items || []).sort((a, b) => {
    const catDiff = categoryOrder[a.category] - categoryOrder[b.category];
    if (catDiff !== 0) return catDiff;
    return a.sort_order - b.sort_order;
  });

  return {
    id: list.id,
    user_id: list.user_id,
    name: list.name,
    week_start_date: list.week_start_date,
    created_at: list.created_at,
    updated_at: list.updated_at,
    items: sortedItems
  };
}

/**
 * Generate shopping list from calendar or recipes
 */
export async function generateShoppingList(
  supabase: SupabaseClient,
  userId: string,
  command: GenerateShoppingListCommand
): Promise<GeneratedShoppingListDto> {
  // Fetch ingredients based on source
  let ingredients;

  if (command.source === "calendar") {
    ingredients = await fetchIngredientsFromCalendar(
      supabase,
      userId,
      command.week_start_date,
      command.selections
    );
  } else {
    ingredients = await fetchIngredientsFromRecipes(
      supabase,
      userId,
      command.recipe_ids
    );
  }

  // Check if any ingredients found
  if (ingredients.length === 0) {
    const error: any = new Error("No recipes found for selected meal plan assignments");
    error.code = "NO_RECIPES_FOUND";
    throw error;
  }

  // Aggregate ingredients
  const aggregatedItems = aggregateIngredients(ingredients);

  // Categorize with AI
  let aiStatus: "success" | "failed" = "success";
  let aiError: string | undefined;

  try {
    const itemsForAI = aggregatedItems.map((item, index) => ({
      index: index + 1,
      name: item.ingredient_name
    }));

    const categories = await categorizeIngredientsWithAI(itemsForAI);

    // Apply categories
    aggregatedItems.forEach((item, index) => {
      item.category = categories[index + 1] || "Inne";
    });
  } catch (error: any) {
    console.error("AI categorization failed, using fallback:", error);
    aiStatus = "failed";
    aiError = error.message || "OpenAI API timeout after retries";

    // All items already have "Inne" as default
  }

  return {
    items: aggregatedItems,
    metadata: {
      total_items: aggregatedItems.length,
      ai_categorization_status: aiStatus,
      ai_error: aiError,
      source_recipes: ingredients.length
    }
  };
}

/**
 * Fetch ingredients from calendar selections
 */
async function fetchIngredientsFromCalendar(
  supabase: SupabaseClient,
  userId: string,
  weekStartDate: string,
  selections: { day_of_week: number; meal_types: MealType[] }[]
): Promise<any[]> {
  const allIngredients: any[] = [];

  for (const selection of selections) {
    for (const mealType of selection.meal_types) {
      // Get recipe_id from meal_plan
      const { data: assignments, error: assignmentError } = await supabase
        .from("meal_plan")
        .select("recipe_id")
        .eq("week_start_date", weekStartDate)
        .eq("day_of_week", selection.day_of_week)
        .eq("meal_type", mealType);

      if (assignmentError) throw assignmentError;

      if (assignments && assignments.length > 0) {
        const recipeId = assignments[0].recipe_id;

        // Fetch ingredients for this recipe
        const { data: ingredients, error: ingredientsError } = await supabase
          .from("ingredients")
          .select("name, quantity, unit")
          .eq("recipe_id", recipeId);

        if (ingredientsError) throw ingredientsError;

        allIngredients.push(...(ingredients || []));
      }
    }
  }

  return allIngredients;
}

/**
 * Fetch ingredients from recipe IDs
 */
async function fetchIngredientsFromRecipes(
  supabase: SupabaseClient,
  userId: string,
  recipeIds: string[]
): Promise<any[]> {
  const { data, error } = await supabase
    .from("ingredients")
    .select("name, quantity, unit")
    .in("recipe_id", recipeIds);

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Aggregate ingredients (normalize + sum quantities)
 */
function aggregateIngredients(ingredients: any[]): any[] {
  const aggregated = new Map<string, any>();

  ingredients.forEach((ing) => {
    const normalizedName = ing.name.trim().toLowerCase();
    const normalizedUnit = ing.unit?.trim().toLowerCase() || "";
    const key = `${normalizedName}|${normalizedUnit}`;

    if (aggregated.has(key)) {
      const existing = aggregated.get(key);

      // Sum quantities if both are numeric
      if (existing.quantity !== null && ing.quantity !== null) {
        existing.quantity += ing.quantity;
      } else {
        // Keep as separate items if one lacks quantity
        const uniqueKey = `${key}|${Math.random()}`;
        aggregated.set(uniqueKey, {
          ingredient_name: ing.name, // Preserve original case
          quantity: ing.quantity,
          unit: ing.unit,
          category: "Inne",
          sort_order: 0
        });
      }
    } else {
      aggregated.set(key, {
        ingredient_name: ing.name, // Preserve original case
        quantity: ing.quantity,
        unit: ing.unit,
        category: "Inne", // Default, will be updated by AI
        sort_order: 0
      });
    }
  });

  return Array.from(aggregated.values());
}

/**
 * Create (save) a shopping list
 */
export async function createShoppingList(
  supabase: SupabaseClient,
  userId: string,
  command: CreateShoppingListCommand
): Promise<ShoppingListItemDto> {
  // Call RPC function for atomic insert
  const { data, error } = await supabase.rpc("generate_shopping_list", {
    p_name: command.name,
    p_week_start_date: command.week_start_date || null,
    p_items: command.items
  });

  if (error) {
    throw error;
  }

  const listId = data;

  // Fetch created list metadata
  const { data: list, error: fetchError } = await supabase
    .from("shopping_lists")
    .select("id, name, week_start_date, created_at, updated_at, shopping_list_items(count)")
    .eq("id", listId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  return {
    id: list.id,
    name: list.name,
    week_start_date: list.week_start_date,
    created_at: list.created_at,
    updated_at: list.updated_at,
    item_count: list.shopping_list_items?.[0]?.count || 0
  };
}

/**
 * Update a shopping list item
 */
export async function updateShoppingListItem(
  supabase: SupabaseClient,
  userId: string,
  listId: string,
  itemId: string,
  updates: UpdateShoppingListItemCommand
): Promise<ShoppingListItem> {
  // Verify list ownership through RLS
  const { data: list } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("id", listId)
    .single();

  if (!list) {
    const error: any = new Error("Shopping list not found");
    error.code = "LIST_NOT_FOUND";
    throw error;
  }

  // Update item
  const { data, error } = await supabase
    .from("shopping_list_items")
    .update(updates)
    .eq("id", itemId)
    .eq("shopping_list_id", listId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Delete a shopping list
 */
export async function deleteShoppingList(
  supabase: SupabaseClient,
  userId: string,
  listId: string
): Promise<void> {
  const { error } = await supabase
    .from("shopping_lists")
    .delete()
    .eq("id", listId);

  if (error) {
    throw error;
  }
}
```

**Implementation Steps:**
1. Create `src/lib/services/shopping-lists.service.ts`
2. Implement `listShoppingLists()` with sorting
3. Implement `getShoppingListById()` with category sorting
4. Implement `generateShoppingList()` with AI integration
5. Implement helper functions: `fetchIngredientsFromCalendar()`, `fetchIngredientsFromRecipes()`, `aggregateIngredients()`
6. Implement `createShoppingList()` using RPC
7. Implement `updateShoppingListItem()` and `deleteShoppingList()`
8. Add comprehensive error handling

---

### 5.4 API Routes

#### 5.4.1 GET /api/shopping-lists and POST /api/shopping-lists

**File: `src/pages/api/shopping-lists/index.ts`**

```typescript
import type { APIContext } from "astro";
import {
  listShoppingListsQuerySchema,
  createShoppingListSchema
} from "@/lib/validation/shopping-list.schema";
import {
  listShoppingLists,
  createShoppingList
} from "@/lib/services/shopping-lists.service";
import {
  paginatedResponse,
  jsonResponse,
  errorResponse,
  validationErrorResponse
} from "@/lib/utils/api-response";

export const prerender = false;

/**
 * GET /api/shopping-lists
 * List all shopping lists with pagination
 */
export async function GET(context: APIContext) {
  const supabase = context.locals.supabase;

  // Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return errorResponse("Unauthorized", "Authentication required", 401);
  }

  // Parse and validate query parameters
  const url = new URL(context.request.url);
  const queryParams = {
    sort: url.searchParams.get("sort") || undefined,
    limit: url.searchParams.get("limit") || undefined,
    offset: url.searchParams.get("offset") || undefined
  };

  const validation = listShoppingListsQuerySchema.safeParse(queryParams);
  if (!validation.success) {
    return validationErrorResponse(validation.error);
  }

  // Execute service
  try {
    const { lists, pagination } = await listShoppingLists(
      supabase,
      user.id,
      validation.data
    );

    return paginatedResponse(lists, pagination);
  } catch (error) {
    console.error("Error listing shopping lists:", error);
    return errorResponse(
      "InternalServerError",
      "An unexpected error occurred",
      500
    );
  }
}

/**
 * POST /api/shopping-lists
 * Save a shopping list
 */
export async function POST(context: APIContext) {
  const supabase = context.locals.supabase;

  // Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return errorResponse("Unauthorized", "Authentication required", 401);
  }

  // Parse request body
  let body;
  try {
    body = await context.request.json();
  } catch (error) {
    return errorResponse("ValidationError", "Invalid JSON in request body", 400);
  }

  // Validate request body
  const validation = createShoppingListSchema.safeParse(body);
  if (!validation.success) {
    return validationErrorResponse(validation.error);
  }

  // Execute service
  try {
    const list = await createShoppingList(supabase, user.id, validation.data);
    return jsonResponse(list, 201);
  } catch (error) {
    console.error("Error creating shopping list:", error);
    return errorResponse(
      "InternalServerError",
      "An unexpected error occurred",
      500
    );
  }
}
```

**Implementation Steps:**
1. Create `src/pages/api/shopping-lists/index.ts`
2. Implement GET handler with query validation
3. Implement POST handler with RPC call
4. Return proper response formats

---

#### 5.4.2 GET /api/shopping-lists/:id and DELETE /api/shopping-lists/:id

**File: `src/pages/api/shopping-lists/[id].ts`**

```typescript
import type { APIContext } from "astro";
import { uuidSchema } from "@/lib/validation/common.schema";
import {
  getShoppingListById,
  deleteShoppingList
} from "@/lib/services/shopping-lists.service";
import {
  jsonResponse,
  errorResponse
} from "@/lib/utils/api-response";

export const prerender = false;

/**
 * GET /api/shopping-lists/:id
 * Get a shopping list with items
 */
export async function GET(context: APIContext) {
  const supabase = context.locals.supabase;

  // Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return errorResponse("Unauthorized", "Authentication required", 401);
  }

  // Validate list ID
  const listId = context.params.id;
  const idValidation = uuidSchema.safeParse(listId);
  if (!idValidation.success) {
    return errorResponse("ValidationError", "Invalid shopping list ID format", 400);
  }

  // Execute service
  try {
    const list = await getShoppingListById(supabase, user.id, idValidation.data);
    return jsonResponse(list);
  } catch (error: any) {
    console.error("Error fetching shopping list:", error);

    if (error.code === "PGRST116") {
      return errorResponse("NotFound", "Shopping list not found", 404);
    }

    return errorResponse(
      "InternalServerError",
      "An unexpected error occurred",
      500
    );
  }
}

/**
 * DELETE /api/shopping-lists/:id
 * Delete a shopping list
 */
export async function DELETE(context: APIContext) {
  const supabase = context.locals.supabase;

  // Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return errorResponse("Unauthorized", "Authentication required", 401);
  }

  // Validate list ID
  const listId = context.params.id;
  const idValidation = uuidSchema.safeParse(listId);
  if (!idValidation.success) {
    return errorResponse("ValidationError", "Invalid shopping list ID format", 400);
  }

  // Execute service
  try {
    await deleteShoppingList(supabase, user.id, idValidation.data);

    return new Response(JSON.stringify({
      message: "Shopping list deleted successfully"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("Error deleting shopping list:", error);

    if (error.code === "PGRST116") {
      return errorResponse("NotFound", "Shopping list not found", 404);
    }

    return errorResponse(
      "InternalServerError",
      "An unexpected error occurred",
      500
    );
  }
}
```

**Implementation Steps:**
1. Create `src/pages/api/shopping-lists/[id].ts`
2. Implement GET with items sorting
3. Implement DELETE with CASCADE
4. Handle 404 errors

---

#### 5.4.3 POST /api/shopping-lists/generate

**File: `src/pages/api/shopping-lists/generate.ts`**

```typescript
import type { APIContext } from "astro";
import { generateShoppingListSchema } from "@/lib/validation/shopping-list.schema";
import { generateShoppingList } from "@/lib/services/shopping-lists.service";
import {
  jsonResponse,
  errorResponse,
  validationErrorResponse
} from "@/lib/utils/api-response";

export const prerender = false;

/**
 * POST /api/shopping-lists/generate
 * Generate shopping list from calendar or recipes
 */
export async function POST(context: APIContext) {
  const supabase = context.locals.supabase;

  // Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return errorResponse("Unauthorized", "Authentication required", 401);
  }

  // Parse request body
  let body;
  try {
    body = await context.request.json();
  } catch (error) {
    return errorResponse("ValidationError", "Invalid JSON in request body", 400);
  }

  // Validate request body (discriminated union)
  const validation = generateShoppingListSchema.safeParse(body);
  if (!validation.success) {
    return validationErrorResponse(validation.error);
  }

  // Execute service
  try {
    const result = await generateShoppingList(supabase, user.id, validation.data);
    return jsonResponse(result);
  } catch (error: any) {
    console.error("Error generating shopping list:", error);

    if (error.code === "NO_RECIPES_FOUND") {
      return errorResponse(
        "ValidationError",
        "No recipes found for selected meal plan assignments",
        400
      );
    }

    return errorResponse(
      "InternalServerError",
      "An unexpected error occurred",
      500
    );
  }
}
```

**Implementation Steps:**
1. Create `src/pages/api/shopping-lists/generate.ts`
2. Implement POST with discriminated union validation
3. Call AI categorization service
4. Handle errors gracefully (partial success with metadata)
5. Return generated items (not saved yet)

---

#### 5.4.4 PATCH /api/shopping-lists/:id/items/:itemId

**File: `src/pages/api/shopping-lists/[id]/items/[itemId].ts`**

```typescript
import type { APIContext } from "astro";
import { uuidSchema } from "@/lib/validation/common.schema";
import { updateShoppingListItemSchema } from "@/lib/validation/shopping-list.schema";
import { updateShoppingListItem } from "@/lib/services/shopping-lists.service";
import {
  jsonResponse,
  errorResponse,
  validationErrorResponse
} from "@/lib/utils/api-response";

export const prerender = false;

/**
 * PATCH /api/shopping-lists/:id/items/:itemId
 * Update a shopping list item
 */
export async function PATCH(context: APIContext) {
  const supabase = context.locals.supabase;

  // Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return errorResponse("Unauthorized", "Authentication required", 401);
  }

  // Validate IDs
  const listId = context.params.id;
  const itemId = context.params.itemId;

  const listIdValidation = uuidSchema.safeParse(listId);
  const itemIdValidation = uuidSchema.safeParse(itemId);

  if (!listIdValidation.success || !itemIdValidation.success) {
    return errorResponse("ValidationError", "Invalid ID format", 400);
  }

  // Parse request body
  let body;
  try {
    body = await context.request.json();
  } catch (error) {
    return errorResponse("ValidationError", "Invalid JSON in request body", 400);
  }

  // Validate request body (partial update)
  const validation = updateShoppingListItemSchema.safeParse(body);
  if (!validation.success) {
    return validationErrorResponse(validation.error);
  }

  // Execute service
  try {
    const item = await updateShoppingListItem(
      supabase,
      user.id,
      listIdValidation.data,
      itemIdValidation.data,
      validation.data
    );

    return jsonResponse(item);
  } catch (error: any) {
    console.error("Error updating shopping list item:", error);

    if (error.code === "LIST_NOT_FOUND" || error.code === "PGRST116") {
      return errorResponse("NotFound", "Shopping list or item not found", 404);
    }

    return errorResponse(
      "InternalServerError",
      "An unexpected error occurred",
      500
    );
  }
}
```

**Implementation Steps:**
1. Create nested route: `src/pages/api/shopping-lists/[id]/items/[itemId].ts`
2. Implement PATCH with partial update validation
3. Whitelist allowed fields (is_checked, category, quantity, sort_order)
4. Handle 404 for missing list or item
5. Return updated item

---

## 6. Implementation Sequence

### Phase 1: Foundation (Week 1)

**Priority: Critical**

1. **Common Components** (Day 1-2)
   - [ ] Create `src/lib/validation/common.schema.ts`
   - [ ] Create `src/lib/utils/api-response.ts`
   - [ ] Verify middleware Supabase injection
   - [ ] Test authentication pattern

2. **Recipes Endpoints** (Day 3-5)
   - [ ] Create `src/lib/validation/recipe.schema.ts`
   - [ ] Create `src/lib/services/recipes.service.ts`
   - [ ] Implement `GET /api/recipes` and `POST /api/recipes`
   - [ ] Implement `GET /api/recipes/:id`
   - [ ] Implement `PUT /api/recipes/:id`
   - [ ] Implement `DELETE /api/recipes/:id`
   - [ ] Write unit tests for service layer
   - [ ] Test all endpoints with Postman/Thunder Client

### Phase 2: Calendar Integration (Week 2)

**Priority: High**

3. **Meal Plan Endpoints** (Day 1-3)
   - [ ] Create `src/lib/validation/meal-plan.schema.ts`
   - [ ] Create `src/lib/services/meal-plan.service.ts`
   - [ ] Implement `GET /api/meal-plan`
   - [ ] Implement `POST /api/meal-plan` with conflict handling
   - [ ] Implement `DELETE /api/meal-plan/:id`
   - [ ] Write unit tests
   - [ ] Test calendar scenarios (full week, duplicates)

4. **Shopping Lists - Basic** (Day 4-5)
   - [ ] Create `src/lib/validation/shopping-list.schema.ts`
   - [ ] Create `src/lib/services/shopping-lists.service.ts`
   - [ ] Implement `GET /api/shopping-lists`
   - [ ] Implement `GET /api/shopping-lists/:id`
   - [ ] Implement `POST /api/shopping-lists` (save)
   - [ ] Implement `DELETE /api/shopping-lists/:id`

### Phase 3: AI Integration (Week 3)

**Priority: High**

5. **AI Categorization** (Day 1-2)
   - [ ] Set up OpenAI API key in environment
   - [ ] Create `src/lib/services/ai-categorization.service.ts`
   - [ ] Implement retry logic with exponential backoff
   - [ ] Test with sample ingredients
   - [ ] Verify fallback to "Inne" on failure

6. **Generate Shopping List** (Day 3-5)
   - [ ] Implement `POST /api/shopping-lists/generate`
   - [ ] Implement `fetchIngredientsFromCalendar()`
   - [ ] Implement `fetchIngredientsFromRecipes()`
   - [ ] Implement `aggregateIngredients()` logic
   - [ ] Integrate AI categorization
   - [ ] Test both calendar and recipes modes
   - [ ] Test error scenarios (no recipes, AI timeout)

7. **Update Items** (Day 5)
   - [ ] Implement `PATCH /api/shopping-lists/:id/items/:itemId`
   - [ ] Test partial updates
   - [ ] Verify immutability (cannot change ingredient_name)

### Phase 4: Testing & Polish (Week 4)

**Priority: Medium**

8. **Integration Testing** (Day 1-2)
   - [ ] Write E2E test: Create recipe → Assign to calendar → Generate list
   - [ ] Write E2E test: Direct recipe selection → Generate list
   - [ ] Test pagination boundaries
   - [ ] Test RLS policies (multi-user scenarios)

9. **Error Handling & Logging** (Day 3)
   - [ ] Add Sentry integration
   - [ ] Test all error paths
   - [ ] Verify error response formats
   - [ ] Add request logging (optional)

10. **Performance Optimization** (Day 4)
    - [ ] Run EXPLAIN ANALYZE on main queries
    - [ ] Verify indexes are used
    - [ ] Test with 100+ recipes
    - [ ] Optimize AI batch size (if needed)

11. **Documentation** (Day 5)
    - [ ] Create Postman collection
    - [ ] Document environment variables
    - [ ] Write API usage examples
    - [ ] Update README with deployment steps

### Dependencies

**Critical Path:**
```
Common Components → Recipes → Meal Plan → Shopping Lists (Basic) → AI Service → Generate Endpoint
```

**Parallel Tracks:**
- Recipes and validation schemas can be done in parallel
- AI service can be developed independently and integrated later
- Testing can run alongside feature development

---

## 7. Testing Strategy

### 7.1 Unit Tests

**Test Framework:** Vitest

**Coverage:**

1. **Validation Schemas** (`*.schema.ts`)
   ```typescript
   describe("createRecipeSchema", () => {
     it("should accept valid recipe data", () => {
       const valid = createRecipeSchema.safeParse({
         name: "Test Recipe",
         instructions: "Mix ingredients...",
         ingredients: [
           { name: "flour", quantity: 500, unit: "g", sort_order: 0 }
         ]
       });
       expect(valid.success).toBe(true);
     });

     it("should reject recipe with too short name", () => {
       const invalid = createRecipeSchema.safeParse({
         name: "AB",
         instructions: "Mix ingredients...",
         ingredients: [{ name: "flour" }]
       });
       expect(invalid.success).toBe(false);
     });
   });
   ```

2. **Service Functions** (`*.service.ts`)
   ```typescript
   describe("aggregateIngredients", () => {
     it("should sum quantities for same ingredient with same unit", () => {
       const input = [
         { name: "mąka", quantity: 200, unit: "g" },
         { name: "Mąka", quantity: 300, unit: "g" }
       ];
       const result = aggregateIngredients(input);
       expect(result).toHaveLength(1);
       expect(result[0].quantity).toBe(500);
     });

     it("should keep separate items if units differ", () => {
       const input = [
         { name: "mleko", quantity: 1, unit: "l" },
         { name: "mleko", quantity: 200, unit: "ml" }
       ];
       const result = aggregateIngredients(input);
       expect(result).toHaveLength(2);
     });
   });
   ```

### 7.2 Integration Tests

**Test Framework:** Vitest + Supabase Test Client

**Setup:**
```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_ANON_KEY
);

// Create test user
const testUser = await supabase.auth.signUp({
  email: "test@example.com",
  password: "testpassword123"
});
```

**Test Scenarios:**

1. **Recipes CRUD**
   - Create recipe with ingredients
   - Fetch recipe by ID
   - Update recipe (replace ingredients)
   - Delete recipe (verify cascade)

2. **Meal Plan Assignment**
   - Assign recipe to calendar
   - Attempt duplicate assignment (expect 409)
   - Delete recipe (verify meal_plan cleanup)

3. **Shopping List Generation**
   - Generate from calendar (full week)
   - Generate from recipes (5 recipes)
   - Verify AI categorization (or fallback)
   - Save generated list

4. **RLS Policy Testing**
   - Create 2 users
   - User A creates recipe
   - User B attempts to access recipe (expect 404)
   - Verify data isolation

### 7.3 API Testing (Manual)

**Tool:** Postman, Thunder Client, or curl

**Test Collection:**

1. **Authentication**
   - Register new user
   - Login
   - Get JWT token

2. **Full User Flow**
   - Create 3 recipes
   - Assign to calendar (Monday lunch, Tuesday dinner, Wednesday breakfast)
   - Generate shopping list from calendar
   - Save list
   - Update item (mark as checked)
   - Fetch list details
   - Delete list

3. **Edge Cases**
   - Empty search results
   - Pagination beyond available data
   - Invalid UUIDs
   - Missing required fields
   - AI timeout simulation (mock)

### 7.4 Performance Testing

**Tool:** Apache Bench (ab) or Artillery

**Scenarios:**

1. **Load Test - List Recipes**
   ```bash
   ab -n 1000 -c 10 -H "Authorization: Bearer <token>" \
     http://localhost:3000/api/recipes
   ```
   - Target: < 100ms p95

2. **Load Test - Generate Shopping List**
   ```bash
   ab -n 100 -c 5 -p generate-payload.json \
     -T "application/json" -H "Authorization: Bearer <token>" \
     http://localhost:3000/api/shopping-lists/generate
   ```
   - Target: < 3s p95 (including AI)

3. **Database Query Analysis**
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM recipes WHERE user_id = 'uuid' ORDER BY created_at DESC LIMIT 20;
   ```
   - Verify index usage

### 7.5 Security Testing

**Checklist:**

- [ ] RLS policies prevent cross-user data access
- [ ] JWT validation rejects invalid tokens
- [ ] SQL injection attempts fail (parameterized queries)
- [ ] XSS attempts are escaped (React auto-escape)
- [ ] OpenAI API key not exposed in client
- [ ] Service role key only in backend
- [ ] Rate limiting works (50 req/s default)

**Tools:**
- Manual testing (Postman with different users)
- OWASP ZAP (optional, for penetration testing)

---

## 8. Deployment Checklist

### 8.1 Environment Setup

**Required Environment Variables:**

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # Backend only, NEVER expose to client

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Optional
SENTRY_DSN=https://...
```

**Vercel Configuration:**
- Add environment variables in Vercel dashboard
- Mark `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` as sensitive
- Set Node.js version: 18+

### 8.2 Database Setup

**Pre-Deployment:**

1. **Run Migrations**
   ```bash
   supabase db push
   ```

2. **Verify RLS Policies**
   ```sql
   -- Check RLS is enabled
   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

   -- List policies
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   ```

3. **Create RPC Function** (if not in migration)
   ```sql
   -- generate_shopping_list() function from db-plan.md
   ```

4. **Verify Indexes**
   ```sql
   SELECT * FROM pg_indexes WHERE schemaname = 'public';
   ```

5. **Generate TypeScript Types**
   ```bash
   npx supabase gen types typescript --project-id your-project-id > src/db/database.types.ts
   ```

### 8.3 Pre-Deployment Tests

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual smoke tests (Postman collection)
- [ ] RLS policies verified (multi-user test)
- [ ] Performance benchmarks met (< 100ms p95 reads, < 3s AI)
- [ ] Error responses follow standard format
- [ ] CORS configured (if needed)
- [ ] Rate limiting enabled

### 8.4 Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "feat: implement all REST API endpoints"
   git push origin main
   ```

2. **Vercel Auto-Deploy**
   - Vercel detects push
   - Runs build
   - Deploys to production

3. **Verify Deployment**
   - Check Vercel logs
   - Test endpoints on production URL
   - Monitor Sentry for errors

4. **Post-Deployment Smoke Test**
   - [ ] Create recipe via API
   - [ ] Generate shopping list
   - [ ] Verify AI categorization works
   - [ ] Check database for data

### 8.5 Monitoring

**Sentry Setup:**
```typescript
// src/lib/sentry.ts
import * as Sentry from "@sentry/astro";

Sentry.init({
  dsn: import.meta.env.SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});
```

**Metrics to Monitor:**
- API response times (p50, p95, p99)
- Error rates per endpoint
- OpenAI API success rate
- Database query performance
- Supabase connection pool usage

**Alerts:**
- Error rate > 1%
- Response time > 500ms (p95)
- OpenAI failures > 10% in 5 minutes
- Database connection pool exhaustion

---

## 9. Security Considerations

### 9.1 Authentication & Authorization

**Pattern:**
```typescript
// Every endpoint starts with this
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) {
  return errorResponse("Unauthorized", "Authentication required", 401);
}
```

**RLS Enforcement:**
- All tables have RLS enabled
- Policies use `auth.uid() = user_id`
- Never pass `user_id` from client (always from JWT)

### 9.2 Input Validation

**Layers:**
1. **Zod Schema** (API layer) - Type validation
2. **Database Constraints** (CHECK, UNIQUE) - Data integrity
3. **RLS Policies** (Authorization) - Access control

**Example:**
```typescript
// Client sends: { name: "  Test  ", quantity: -5 }
// Zod transforms: { name: "Test", quantity: -5 }
// Zod rejects: quantity must be positive → 400 error
```

### 9.3 API Key Security

**CRITICAL:**
- `OPENAI_API_KEY` MUST be server-side only
- NEVER expose in client bundle
- Only use in Astro API routes (prerender=false)
- Rotate keys if exposed

**Verification:**
```bash
# Search for accidental exposure
grep -r "OPENAI_API_KEY" src/components/
grep -r "sk-proj-" src/components/
# Should return nothing
```

### 9.4 SQL Injection Prevention

**Supabase Protection:**
- Parameterized queries (automatic)
- RLS policies (declarative)
- Type-safe client

**Safe:**
```typescript
supabase.from("recipes").select("*").eq("id", recipeId)
```

**Unsafe (NEVER DO):**
```typescript
supabase.rpc("raw_sql", { query: `SELECT * FROM recipes WHERE id = '${recipeId}'` })
```

### 9.5 XSS Prevention

**React Auto-Escape:**
```tsx
// Safe - React escapes automatically
<div>{recipe.name}</div>
<div>{recipe.instructions}</div>
```

**NEVER:**
```tsx
// Dangerous - allows XSS
<div dangerouslySetInnerHTML={{ __html: recipe.instructions }} />
```

### 9.6 Rate Limiting

**Supabase Default:**
- Free tier: 50 req/s
- Pro tier: 200 req/s

**Future Enhancement:**
```typescript
// Custom rate limiting per user (post-MVP)
// src/middleware/rate-limiter.ts
import { RateLimiter } from "limiter";

const limiter = new RateLimiter({ tokensPerInterval: 100, interval: "minute" });
```

---

## 10. Performance Optimization

### 10.1 Database Indexes

**Already Defined:**
- `idx_recipes_user_id`
- `idx_ingredients_recipe_id`
- `idx_meal_plan_user_week`
- `idx_shopping_list_items_category_sort`

**Verification:**
```sql
EXPLAIN ANALYZE SELECT * FROM recipes WHERE user_id = 'uuid' LIMIT 20;
-- Should show: Index Scan using idx_recipes_user_id
```

### 10.2 Query Optimization

**Best Practices:**
- Use `SELECT` with specific columns (not `SELECT *`)
- Limit results (pagination)
- Use compound indexes for multi-column WHERE
- Avoid N+1 queries (use JOIN)

**Example:**
```typescript
// Good - single query with JOIN
supabase.from("recipes").select("*, ingredients(*)").eq("id", recipeId)

// Bad - N+1 problem
const recipe = await supabase.from("recipes").select("*").eq("id", recipeId)
const ingredients = await supabase.from("ingredients").select("*").eq("recipe_id", recipeId)
```

### 10.3 AI Optimization

**Current:**
- Batch all ingredients in single API call
- Timeout: 10s
- Retry: 2x

**Future (Post-MVP):**
- Cache common ingredients (Redis)
  ```typescript
  const cache = {
    "mleko": "Nabiał",
    "jajka": "Nabiał",
    "marchew": "Warzywa",
    // ... top 100 ingredients
  };
  ```
- Reduce API calls by ~30-50%
- Cost savings: $1-2/month per 1000 users

### 10.4 Client-Side Caching

**Recommendation (Frontend):**
```typescript
// Use TanStack Query (React Query)
import { useQuery } from "@tanstack/react-query";

const { data, isLoading } = useQuery({
  queryKey: ["recipes"],
  queryFn: () => fetch("/api/recipes").then(r => r.json()),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

**Benefits:**
- Reduce backend load
- Faster UI
- Optimistic updates

---

## 11. Known Limitations & Future Enhancements

### 11.1 MVP Limitations

**Out of Scope:**
- Unit conversion (g → kg, ml → l)
- Recipe sharing between users
- Recipe images
- Realtime collaboration
- Recipe import (PDF, web scraping)
- Multi-language support (Polish only)
- Advanced meal planning (templates, drag-drop)

### 11.2 Post-MVP Enhancements

**Priority: High**
1. **Ingredient Cache** (`GET /api/ingredients/common`)
   - Pre-categorized frequent ingredients
   - Reduce OpenAI calls by 30-50%

2. **Bulk Operations**
   - `POST /api/recipes/bulk` - Import multiple recipes
   - `DELETE /api/recipes/bulk` - Delete multiple

3. **Advanced Search**
   - Full-text search on ingredients
   - `GET /api/recipes?ingredient=chicken`

**Priority: Medium**
4. **Recipe Sharing (v1.1)**
   - `POST /api/recipes/:id/share` - Generate share link
   - `GET /api/recipes/shared/:token` - View shared recipe

5. **Webhooks**
   - Notify on shopping list creation
   - Integration with shopping platforms

6. **Analytics**
   - Most used recipes
   - Ingredient popularity
   - User behavior metrics

---

## 12. Troubleshooting Guide

### 12.1 Common Errors

**401 Unauthorized:**
- **Cause:** Missing or invalid JWT token
- **Fix:** Verify `Authorization: Bearer <token>` header
- **Test:** `supabase.auth.getUser()` should return user object

**404 Not Found:**
- **Cause:** Resource doesn't exist or RLS blocks access
- **Fix:** Check UUID is correct and resource belongs to user
- **Debug:** Temporarily disable RLS to isolate issue (dev only!)

**409 Conflict:**
- **Cause:** Duplicate meal plan assignment (UNIQUE constraint)
- **Fix:** Check if slot already occupied before insert
- **User Action:** Choose different day/meal or replace existing

**500 Internal Server Error:**
- **Cause:** Database error, OpenAI timeout, or code exception
- **Debug:** Check Sentry logs, Vercel logs, Supabase logs
- **Fix:** Add try-catch blocks, improve error handling

**AI Categorization Failed:**
- **Symptom:** All items have category "Inne"
- **Cause:** OpenAI API timeout or rate limit
- **Fix:** Verify API key, check quota, test with smaller batch
- **Fallback:** Already implemented (returns 200 with metadata)

### 12.2 Debugging Tools

**Supabase Studio:**
- View table data
- Run SQL queries
- Check RLS policies
- Monitor API requests

**Vercel Logs:**
- Real-time function logs
- Error stack traces
- Performance metrics

**Sentry:**
- Error tracking
- User impact analysis
- Performance monitoring

**Postman/Thunder Client:**
- Test endpoints manually
- Debug request/response
- Save test collections

---

## 13. Glossary

**DTO (Data Transfer Object):** Type for API responses (e.g., `RecipeDetailDto`)

**Command Model:** Type for API request bodies (e.g., `CreateRecipeCommand`)

**RLS (Row Level Security):** PostgreSQL feature for authorization at database level

**Snapshot Pattern:** Copying data at creation time (shopping lists don't update when recipes change)

**Discriminated Union:** TypeScript union type with a literal field for type narrowing (e.g., `source: "calendar" | "recipes"`)

**Idempotent:** Operation that produces same result when called multiple times (e.g., PUT)

**Atomic Transaction:** Multiple database operations that succeed or fail together

**Cascade Delete:** Automatic deletion of related rows (e.g., delete recipe → delete ingredients)

---

## Appendix: Quick Reference

### Environment Variables
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... # Backend only
OPENAI_API_KEY=sk-proj-...
SENTRY_DSN=https://... # Optional
```

### API Base URL
- **Development:** `http://localhost:3000/api`
- **Production:** `https://your-domain.vercel.app/api`

### Response Status Codes
- `200` OK (read success)
- `201` Created (create success)
- `400` Bad Request (validation error)
- `401` Unauthorized (auth required)
- `404` Not Found (resource missing)
- `409` Conflict (duplicate)
- `500` Internal Server Error (unexpected)

### Test Users
```typescript
// Create in Supabase dashboard or via API
{
  email: "test1@example.com",
  password: "testpass123"
}
```

---

**Document Version:** 1.0
**Last Updated:** 2025-10-25
**Author:** Claude Code (AI Implementation Architect)
**Status:** ✅ Ready for Implementation

**Next Steps:**
1. Review this plan with tech lead
2. Set up development environment
3. Follow implementation sequence (Phase 1 → Phase 4)
4. Run tests continuously
5. Deploy to staging → production

**Estimated Timeline:** 3-4 weeks for full implementation (1 developer, 6-8 hours/day)

---

## Contact & Support

**Questions?** Review sections:
- [Common Patterns](#13-common-patterns) for code examples
- [Troubleshooting](#12-troubleshooting-guide) for error resolution
- [Testing Strategy](#7-testing-strategy) for quality assurance

**Updates:** This document will be updated as implementation progresses and new patterns emerge.

Good luck with implementation! 🚀