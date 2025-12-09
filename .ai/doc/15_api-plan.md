# REST API Plan - ShopMate MVP

**Date:** 2025-10-26
**Version:** 1.0
**Status:** Ready for Implementation

---

## 1. Resources

| Resource                | Database Table        | Description                                              |
| ----------------------- | --------------------- | -------------------------------------------------------- |
| **Recipes**             | `recipes`             | User's recipe collection with name and instructions      |
| **Ingredients**         | `ingredients`         | Recipe ingredients with quantity, unit, and name         |
| **Meal Plan**           | `meal_plan`           | Weekly calendar assignments of recipes to days and meals |
| **Shopping Lists**      | `shopping_lists`      | Saved shopping lists (snapshot pattern)                  |
| **Shopping List Items** | `shopping_list_items` | Individual items in shopping lists with AI categories    |

**Note:** Authentication is handled by Supabase Auth directly from the client. No custom auth endpoints are needed.

---

## 2. Endpoints

### 2.1 Recipes

#### Create Recipe

**Method:** `POST`
**Path:** `/api/recipes`
**Description:** Create a new recipe with ingredients

**Request Body:**

```json
{
  "name": "Spaghetti Carbonara",
  "instructions": "1. Boil pasta...\n2. Cook bacon...",
  "ingredients": [
    {
      "name": "spaghetti",
      "quantity": 500,
      "unit": "g",
      "sort_order": 0
    },
    {
      "name": "bacon",
      "quantity": 200,
      "unit": "g",
      "sort_order": 1
    },
    {
      "name": "parmesan cheese",
      "quantity": 100,
      "unit": "g",
      "sort_order": 2
    },
    {
      "name": "eggs",
      "quantity": 3,
      "unit": "pcs",
      "sort_order": 3
    },
    {
      "name": "salt",
      "quantity": null,
      "unit": null,
      "sort_order": 4
    }
  ]
}
```

**Response (201 Created):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Spaghetti Carbonara",
  "instructions": "1. Boil pasta...\n2. Cook bacon...",
  "created_at": "2025-01-26T10:00:00Z",
  "updated_at": "2025-01-26T10:00:00Z",
  "ingredients": [
    {
      "id": "650e8400-e29b-41d4-a716-446655440001",
      "recipe_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "spaghetti",
      "quantity": 500,
      "unit": "g",
      "sort_order": 0
    }
    // ... other ingredients
  ]
}
```

**Error Responses:**

- `400 Bad Request` - Validation error
  ```json
  {
    "error": "Validation failed",
    "details": {
      "name": ["Name must be between 3 and 100 characters"],
      "instructions": ["Instructions must be between 10 and 5000 characters"],
      "ingredients": ["At least 1 ingredient required, maximum 50"]
    }
  }
  ```
- `401 Unauthorized` - User not authenticated
  ```json
  {
    "error": "Authentication required"
  }
  ```

---

#### List Recipes

**Method:** `GET`
**Path:** `/api/recipes`
**Description:** Get user's recipes with optional search and sorting

**Query Parameters:**

- `search` (optional): Case-insensitive substring match on recipe name
- `sort` (optional): `name_asc` | `name_desc` | `created_asc` | `created_desc` (default: `created_desc`)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Example Request:**

```
GET /api/recipes?search=pasta&sort=name_asc&page=1&limit=20
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Spaghetti Carbonara",
      "ingredients_count": 5,
      "created_at": "2025-01-26T10:00:00Z",
      "updated_at": "2025-01-26T10:00:00Z"
    }
    // ... more recipes
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

**Error Responses:**

- `401 Unauthorized` - User not authenticated

---

#### Get Recipe

**Method:** `GET`
**Path:** `/api/recipes/:id`
**Description:** Get single recipe with all ingredients

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Spaghetti Carbonara",
  "instructions": "1. Boil pasta...\n2. Cook bacon...",
  "created_at": "2025-01-26T10:00:00Z",
  "updated_at": "2025-01-26T10:00:00Z",
  "ingredients": [
    {
      "id": "650e8400-e29b-41d4-a716-446655440001",
      "recipe_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "spaghetti",
      "quantity": 500,
      "unit": "g",
      "sort_order": 0
    }
    // ... other ingredients sorted by sort_order
  ],
  "meal_plan_assignments": 3
}
```

**Error Responses:**

- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Recipe not found or doesn't belong to user
  ```json
  {
    "error": "Recipe not found"
  }
  ```

---

#### Update Recipe

**Method:** `PUT`
**Path:** `/api/recipes/:id`
**Description:** Update recipe and ingredients (full replacement)

**Request Body:**

```json
{
  "name": "Spaghetti Carbonara (Updated)",
  "instructions": "1. Boil pasta al dente...\n2. Cook bacon crispy...",
  "ingredients": [
    {
      "name": "spaghetti",
      "quantity": 600,
      "unit": "g",
      "sort_order": 0
    }
    // ... other ingredients
  ]
}
```

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Spaghetti Carbonara (Updated)",
  "instructions": "1. Boil pasta al dente...\n2. Cook bacon crispy...",
  "created_at": "2025-01-26T10:00:00Z",
  "updated_at": "2025-01-26T11:30:00Z",
  "ingredients": [
    // ... new ingredients with new IDs
  ]
}
```

**Error Responses:**

- `400 Bad Request` - Validation error
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Recipe not found or doesn't belong to user

**Note:** Changes propagate to meal plan assignments (live update), but NOT to previously saved shopping lists (snapshot pattern).

---

#### Delete Recipe

**Method:** `DELETE`
**Path:** `/api/recipes/:id`
**Description:** Delete recipe, ingredients, and meal plan assignments (CASCADE)

**Response (200 OK):**

```json
{
  "message": "Recipe deleted successfully",
  "deleted_meal_plan_assignments": 3
}
```

**Error Responses:**

- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Recipe not found or doesn't belong to user

---

### 2.2 Meal Plan (Weekly Calendar)

#### Get Week Calendar

**Method:** `GET`
**Path:** `/api/meal-plan`
**Description:** Get meal plan assignments for a specific week

**Query Parameters:**

- `week_start_date` (required): ISO date string for Monday of the week (YYYY-MM-DD)

**Example Request:**

```
GET /api/meal-plan?week_start_date=2025-01-20
```

**Response (200 OK):**

```json
{
  "week_start_date": "2025-01-20",
  "week_end_date": "2025-01-26",
  "assignments": [
    {
      "id": "750e8400-e29b-41d4-a716-446655440000",
      "day_of_week": 1,
      "meal_type": "breakfast",
      "recipe_id": "550e8400-e29b-41d4-a716-446655440000",
      "recipe_name": "Scrambled Eggs",
      "created_at": "2025-01-20T08:00:00Z"
    },
    {
      "id": "750e8400-e29b-41d4-a716-446655440001",
      "day_of_week": 1,
      "meal_type": "lunch",
      "recipe_id": "550e8400-e29b-41d4-a716-446655440001",
      "recipe_name": "Spaghetti Carbonara",
      "created_at": "2025-01-20T09:00:00Z"
    }
    // ... more assignments for the week
  ]
}
```

**Error Responses:**

- `400 Bad Request` - Invalid date format
  ```json
  {
    "error": "Invalid week_start_date format. Expected YYYY-MM-DD"
  }
  ```
- `401 Unauthorized` - User not authenticated

---

#### Create Meal Plan Assignment

**Method:** `POST`
**Path:** `/api/meal-plan`
**Description:** Assign recipe to a specific day and meal type

**Request Body:**

```json
{
  "recipe_id": "550e8400-e29b-41d4-a716-446655440000",
  "week_start_date": "2025-01-20",
  "day_of_week": 3,
  "meal_type": "lunch"
}
```

**Response (201 Created):**

```json
{
  "id": "750e8400-e29b-41d4-a716-446655440002",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "recipe_id": "550e8400-e29b-41d4-a716-446655440000",
  "recipe_name": "Spaghetti Carbonara",
  "week_start_date": "2025-01-20",
  "day_of_week": 3,
  "meal_type": "lunch",
  "created_at": "2025-01-26T12:00:00Z"
}
```

**Error Responses:**

- `400 Bad Request` - Validation error or duplicate assignment
  ```json
  {
    "error": "Validation failed",
    "details": {
      "day_of_week": ["Must be between 1 and 7"],
      "meal_type": ["Must be one of: breakfast, second_breakfast, lunch, dinner"]
    }
  }
  ```
  ```json
  {
    "error": "This meal slot is already assigned. Remove existing assignment first."
  }
  ```
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Recipe not found or doesn't belong to user

**Validation:**

- `day_of_week`: 1-7 (1 = Monday, 7 = Sunday)
- `meal_type`: `breakfast` | `second_breakfast` | `lunch` | `dinner`
- `week_start_date`: ISO date string (YYYY-MM-DD), must be Monday
- UNIQUE constraint: one recipe per (user_id, week_start_date, day_of_week, meal_type)

---

#### Delete Meal Plan Assignment

**Method:** `DELETE`
**Path:** `/api/meal-plan/:id`
**Description:** Remove recipe from calendar (does NOT delete recipe itself)

**Response (200 OK):**

```json
{
  "message": "Assignment removed successfully"
}
```

**Error Responses:**

- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Assignment not found or doesn't belong to user

---

### 2.3 Shopping Lists

#### Preview Shopping List

**Method:** `POST`
**Path:** `/api/shopping-lists/preview`
**Description:** Generate shopping list preview with aggregated ingredients and AI categorization

**Request Body (Mode 1: From Calendar):**

```json
{
  "source": "calendar",
  "week_start_date": "2025-01-20",
  "selections": [
    {
      "day_of_week": 1,
      "meal_types": ["breakfast", "lunch"]
    },
    {
      "day_of_week": 2,
      "meal_types": ["breakfast", "second_breakfast", "lunch", "dinner"]
    }
    // ... more days
  ]
}
```

**Request Body (Mode 2: From Recipes):**

```json
{
  "source": "recipes",
  "recipe_ids": ["550e8400-e29b-41d4-a716-446655440000", "550e8400-e29b-41d4-a716-446655440001"]
}
```

**Response (200 OK):**

```json
{
  "items": [
    {
      "ingredient_name": "spaghetti",
      "quantity": 1500,
      "unit": "g",
      "category": "Pieczywo",
      "sort_order": 0
    },
    {
      "ingredient_name": "bacon",
      "quantity": 600,
      "unit": "g",
      "category": "Mięso",
      "sort_order": 0
    },
    {
      "ingredient_name": "parmesan cheese",
      "quantity": 300,
      "unit": "g",
      "category": "Nabiał",
      "sort_order": 0
    },
    {
      "ingredient_name": "eggs",
      "quantity": 9,
      "unit": "pcs",
      "category": "Nabiał",
      "sort_order": 1
    },
    {
      "ingredient_name": "salt",
      "quantity": null,
      "unit": null,
      "category": "Przyprawy",
      "sort_order": 0
    }
  ],
  "metadata": {
    "source": "calendar",
    "week_start_date": "2025-01-20",
    "total_recipes": 5,
    "total_items": 23,
    "ai_categorization_status": "success",
    "skipped_empty_meals": 2
  }
}
```

**Error Responses:**

- `400 Bad Request` - Validation error or no recipes selected
  ```json
  {
    "error": "No recipes selected or all selected meals are empty"
  }
  ```
- `401 Unauthorized` - User not authenticated
- `422 Unprocessable Entity` - AI categorization failed (partial response with fallback)
  ```json
  {
    "items": [
      {
        "ingredient_name": "spaghetti",
        "quantity": 1500,
        "unit": "g",
        "category": "Inne",
        "sort_order": 0
      }
      // ... all items with category "Inne"
    ],
    "metadata": {
      "ai_categorization_status": "failed",
      "ai_error": "OpenAI timeout after 2 retries"
    }
  }
  ```

**Business Logic:**

1. Fetch ingredients from selected recipes/meals
2. Normalize ingredient names: trim, lowercase for comparison
3. Aggregate identical ingredients: group by (name + unit), sum quantities
4. AI categorization via OpenAI GPT-4o mini:
   - Batch request with all ingredients
   - Timeout: 10s, Retry: 2 times with exponential backoff (1s, 2s)
   - Fallback: All items → category "Inne" if AI fails
5. Sort items by category (fixed order), then alphabetically within category
6. Return preview (NOT saved yet)

**Categories (Polish):**

- Nabiał (Dairy)
- Warzywa (Vegetables)
- Owoce (Fruits)
- Mięso (Meat/Fish)
- Pieczywo (Bread/Pasta)
- Przyprawy (Spices)
- Inne (Other - fallback)

---

#### Save Shopping List

**Method:** `POST`
**Path:** `/api/shopping-lists`
**Description:** Save shopping list as immutable snapshot (after user edits preview)

**Request Body:**

```json
{
  "name": "Lista zakupów - Tydzień 20-26 stycznia",
  "week_start_date": "2025-01-20",
  "items": [
    {
      "ingredient_name": "spaghetti",
      "quantity": 1500,
      "unit": "g",
      "category": "Pieczywo",
      "sort_order": 0
    }
    // ... edited items from preview
  ]
}
```

**Response (201 Created):**

```json
{
  "id": "850e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Lista zakupów - Tydzień 20-26 stycznia",
  "week_start_date": "2025-01-20",
  "created_at": "2025-01-26T14:00:00Z",
  "updated_at": "2025-01-26T14:00:00Z",
  "items": [
    {
      "id": "950e8400-e29b-41d4-a716-446655440000",
      "shopping_list_id": "850e8400-e29b-41d4-a716-446655440000",
      "ingredient_name": "spaghetti",
      "quantity": 1500,
      "unit": "g",
      "category": "Pieczywo",
      "is_checked": false,
      "sort_order": 0
    }
    // ... all items
  ]
}
```

**Error Responses:**

- `400 Bad Request` - Validation error
  ```json
  {
    "error": "Validation failed",
    "details": {
      "name": ["Name must not exceed 200 characters"],
      "items": ["Maximum 100 items allowed"]
    }
  }
  ```
- `401 Unauthorized` - User not authenticated

**Validation:**

- `name`: max 200 chars, default "Lista zakupów"
- `week_start_date`: nullable (NULL if generated from "From Recipes" mode)
- `items`: max 100 items
- Item `ingredient_name`: 1-100 chars
- Item `quantity`: NULL OR > 0
- Item `category`: must be one of 7 valid categories

**Note:** This creates an immutable snapshot. Future recipe edits do NOT update this saved list.

---

#### List Shopping Lists

**Method:** `GET`
**Path:** `/api/shopping-lists`
**Description:** Get user's saved shopping lists (history)

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "850e8400-e29b-41d4-a716-446655440000",
      "name": "Lista zakupów - Tydzień 20-26 stycznia",
      "week_start_date": "2025-01-20",
      "items_count": 23,
      "created_at": "2025-01-26T14:00:00Z"
    }
    // ... more lists sorted by created_at DESC
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "total_pages": 1
  }
}
```

**Error Responses:**

- `401 Unauthorized` - User not authenticated

---

#### Get Shopping List

**Method:** `GET`
**Path:** `/api/shopping-lists/:id`
**Description:** Get single shopping list with all items

**Response (200 OK):**

```json
{
  "id": "850e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Lista zakupów - Tydzień 20-26 stycznia",
  "week_start_date": "2025-01-20",
  "created_at": "2025-01-26T14:00:00Z",
  "updated_at": "2025-01-26T14:00:00Z",
  "items": [
    {
      "id": "950e8400-e29b-41d4-a716-446655440000",
      "shopping_list_id": "850e8400-e29b-41d4-a716-446655440000",
      "ingredient_name": "spaghetti",
      "quantity": 1500,
      "unit": "g",
      "category": "Pieczywo",
      "is_checked": false,
      "sort_order": 0
    }
    // ... all items grouped by category in fixed order
  ]
}
```

**Items sorted by:**

1. Category (fixed order: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne)
2. `sort_order` within category
3. Alphabetically by `ingredient_name` (case-insensitive)

**Error Responses:**

- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Shopping list not found or doesn't belong to user

---

#### Update Shopping List Item (Check/Uncheck)

**Method:** `PATCH`
**Path:** `/api/shopping-lists/:list_id/items/:item_id`
**Description:** Toggle item checked status (mark as purchased)

**Request Body:**

```json
{
  "is_checked": true
}
```

**Response (200 OK):**

```json
{
  "id": "950e8400-e29b-41d4-a716-446655440000",
  "shopping_list_id": "850e8400-e29b-41d4-a716-446655440000",
  "ingredient_name": "spaghetti",
  "quantity": 1500,
  "unit": "g",
  "category": "Pieczywo",
  "is_checked": true,
  "sort_order": 0
}
```

**Error Responses:**

- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Item or list not found or doesn't belong to user

**Note:** This is the ONLY mutation allowed on saved shopping lists (snapshot pattern). Updating `is_checked` does NOT violate immutability.

---

#### Delete Shopping List

**Method:** `DELETE`
**Path:** `/api/shopping-lists/:id`
**Description:** Delete shopping list and all items (CASCADE)

**Response (200 OK):**

```json
{
  "message": "Shopping list deleted successfully"
}
```

**Error Responses:**

- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Shopping list not found or doesn't belong to user

---

### 2.4 Optional Analytics Endpoints

#### Track Export Event

**Method:** `POST`
**Path:** `/api/analytics/export`
**Description:** Track PDF/TXT export for analytics (optional, client-side export)

**Request Body:**

```json
{
  "shopping_list_id": "850e8400-e29b-41d4-a716-446655440000",
  "format": "pdf"
}
```

**Response (204 No Content):**

- No response body

**Error Responses:**

- `401 Unauthorized` - User not authenticated

**Note:** This is optional. PDF/TXT generation happens client-side with @react-pdf/renderer. This endpoint is only for tracking.

---

## 3. Authentication and Authorization

### Authentication Mechanism

**Provider:** Supabase Auth
**Method:** JWT-based session with httpOnly cookies

**Flow:**

1. User registers/logs in via Supabase Auth SDK (client-side)
2. Supabase returns JWT access token + refresh token
3. Tokens stored in httpOnly cookies (secure, immune to XSS)
4. Every API request includes cookies automatically
5. Middleware validates JWT on server-side via `context.locals.supabase.auth.getUser()`

**Implementation Details:**

**Middleware (Astro):**

```typescript
// src/middleware/index.ts
import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client";

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseClient;
  return next();
});
```

**Protected API Endpoint Example:**

```typescript
// src/pages/api/recipes.ts
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
  // Check authentication
  const {
    data: { user },
    error,
  } = await locals.supabase.auth.getUser();

  if (error || !user) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // User is authenticated, proceed with query
  const { data: recipes } = await locals.supabase.from("recipes").select("*");

  return new Response(JSON.stringify({ data: recipes }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
```

### Authorization Strategy

**Method:** Row Level Security (RLS) at PostgreSQL level

**Key Principles:**

1. All tables have RLS enabled
2. Users access only their own data via `auth.uid() = user_id`
3. Ingredients and shopping list items accessed via parent resource ownership
4. RLS policies enforce authorization automatically (no app-level checks needed)

**RLS Policies (Summary):**

**recipes:**

```sql
-- Users see only their own recipes
CREATE POLICY recipes_select ON recipes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY recipes_insert ON recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY recipes_update ON recipes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY recipes_delete ON recipes
  FOR DELETE USING (auth.uid() = user_id);
```

**ingredients:**

```sql
-- Users access ingredients only from their own recipes
CREATE POLICY ingredients_all ON ingredients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = ingredients.recipe_id
        AND recipes.user_id = auth.uid()
    )
  );
```

**meal_plan:**

```sql
-- Users access only their own meal plans
CREATE POLICY meal_plan_all ON meal_plan
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**shopping_lists:**

```sql
-- Users access only their own shopping lists
CREATE POLICY shopping_lists_all ON shopping_lists
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**shopping_list_items:**

```sql
-- Users access items only from their own shopping lists
CREATE POLICY shopping_list_items_all ON shopping_list_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_list_items.shopping_list_id
        AND shopping_lists.user_id = auth.uid()
    )
  );
```

**Security Guarantees:**

- **Data Isolation:** User A cannot access User B's data (enforced at database level)
- **GDPR Compliance:** CASCADE DELETE ensures complete data removal on account deletion
- **SQL Injection Protection:** Supabase client uses parameterized queries
- **No Authorization Code:** RLS eliminates need for app-level permission checks

---

## 4. Validation and Business Logic

### 4.1 Validation Rules

All endpoints use **Zod schemas** for validation. Below are the validation rules per resource:

#### Recipe Validation

```typescript
import { z } from "zod";

const IngredientSchema = z.object({
  name: z.string().min(1).max(100),
  quantity: z.number().positive().nullable(),
  unit: z.string().max(50).nullable(),
  sort_order: z.number().int().min(0).default(0),
});

const RecipeSchema = z.object({
  name: z.string().min(3).max(100),
  instructions: z.string().min(10).max(5000),
  ingredients: z.array(IngredientSchema).min(1).max(50),
});
```

**Rules:**

- `name`: 3-100 characters, required
- `instructions`: 10-5000 characters, required
- `ingredients`: minimum 1, maximum 50 items
- Ingredient `name`: 1-100 characters, required
- Ingredient `quantity`: positive number or null
- Ingredient `unit`: max 50 characters or null
- Ingredient `sort_order`: non-negative integer, default 0

#### Meal Plan Validation

```typescript
const MealPlanSchema = z.object({
  recipe_id: z.string().uuid(),
  week_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  day_of_week: z.number().int().min(1).max(7),
  meal_type: z.enum(["breakfast", "second_breakfast", "lunch", "dinner"]),
});
```

**Rules:**

- `recipe_id`: valid UUID
- `week_start_date`: ISO date format (YYYY-MM-DD), must be Monday
- `day_of_week`: 1-7 (1 = Monday, 7 = Sunday)
- `meal_type`: one of 4 valid types
- UNIQUE constraint: (user_id, week_start_date, day_of_week, meal_type)

#### Shopping List Validation

```typescript
const ShoppingListItemSchema = z.object({
  ingredient_name: z.string().min(1).max(100),
  quantity: z.number().positive().nullable(),
  unit: z.string().max(50).nullable(),
  category: z.enum(["Nabiał", "Warzywa", "Owoce", "Mięso", "Pieczywo", "Przyprawy", "Inne"]).default("Inne"),
  sort_order: z.number().int().min(0).default(0),
});

const ShoppingListSchema = z.object({
  name: z.string().max(200).default("Lista zakupów"),
  week_start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  items: z.array(ShoppingListItemSchema).max(100),
});
```

**Rules:**

- `name`: max 200 characters, default "Lista zakupów"
- `week_start_date`: ISO date or null (null if "From Recipes" mode)
- `items`: maximum 100 items
- Item `ingredient_name`: 1-100 characters
- Item `quantity`: positive number or null
- Item `category`: one of 7 valid categories, default "Inne"

### 4.2 Business Logic Implementation

#### Recipe Management

**Create/Update Recipe:**

1. Validate request body with RecipeSchema (Zod)
2. Insert recipe into `recipes` table
3. Bulk insert ingredients into `ingredients` table
4. Return recipe with nested ingredients
5. For update: DELETE existing ingredients, INSERT new ones (full replacement)

**Delete Recipe:**

1. Check if recipe exists and belongs to user (RLS handles this)
2. Count meal plan assignments for user feedback
3. DELETE recipe (CASCADE deletes ingredients and meal plan assignments)
4. Return deletion confirmation with assignment count

#### Meal Plan Calendar

**Get Week Calendar:**

1. Validate `week_start_date` (must be Monday)
2. Query `meal_plan` JOIN `recipes` WHERE week_start_date = param
3. Return assignments sorted by day_of_week, then meal_type order
4. Frontend receives 0-28 assignments (28 = full week)

**Create Assignment:**

1. Validate request (recipe exists, valid day/meal)
2. Check UNIQUE constraint (no duplicate assignment)
3. INSERT meal_plan record
4. Return assignment with recipe name

**Delete Assignment:**

1. Verify assignment belongs to user (RLS)
2. DELETE assignment (recipe remains in user's collection)

#### Shopping List Generation

**Preview (POST /api/shopping-lists/preview):**

1. **Fetch Ingredients:**
   - If source = "calendar": Get recipes from selected day/meal combinations
   - If source = "recipes": Get recipes from recipe_ids
   - Join with ingredients table

2. **Aggregate:**
   - Normalize: `ingredient_name.trim().toLowerCase()` for comparison
   - Group by: (normalized_name, unit) - case-insensitive
   - Sum quantities where both ingredients have numeric quantities
   - Keep original name casing from first occurrence

3. **AI Categorization:**
   - Prepare batch request with all unique ingredient names
   - Call OpenAI GPT-4o mini with prompt:

     ```
     Categorize the following ingredients into categories:
     Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne

     Return JSON: {"1": "category", "2": "category", ...}

     Ingredients:
     1. spaghetti
     2. bacon
     3. parmesan cheese
     ...
     ```

   - Timeout: 10 seconds
   - Retry: 2 times with exponential backoff (1s, 2s)
   - Fallback: If AI fails, set all categories to "Inne"

4. **Sort:**
   - Primary: Category (fixed order: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne)
   - Secondary: Alphabetically by ingredient_name (case-insensitive)

5. **Return Preview:**
   - Items array with categorized ingredients
   - Metadata (source, total_recipes, ai_status, etc.)
   - Frontend allows editing before save

**Save (POST /api/shopping-lists):**

1. Validate ShoppingListSchema
2. Use RPC function `generate_shopping_list()` for atomic transaction:
   ```sql
   SELECT generate_shopping_list(
     p_name := 'Lista zakupów - Tydzień 20-26 stycznia',
     p_week_start_date := '2025-01-20',
     p_items := '[{"ingredient_name": "spaghetti", ...}]'::jsonb
   );
   ```
3. Function performs:
   - INSERT shopping_lists
   - Bulk INSERT shopping_list_items
   - Returns shopping_list_id
4. Fetch and return complete saved list with items

**Update Item (PATCH /api/shopping-lists/:list_id/items/:item_id):**

1. Validate request (only `is_checked` field allowed)
2. UPDATE shopping_list_items SET is_checked = value
3. Update parent `shopping_lists.updated_at` trigger fires automatically
4. Return updated item

#### Error Handling

**Validation Errors (400):**

```json
{
  "error": "Validation failed",
  "details": {
    "field_name": ["Error message 1", "Error message 2"]
  }
}
```

**Authentication Errors (401):**

```json
{
  "error": "Authentication required"
}
```

**Not Found (404):**

```json
{
  "error": "Resource not found"
}
```

**AI Categorization Failure (422):**

```json
{
  "items": [...],
  "metadata": {
    "ai_categorization_status": "failed",
    "ai_error": "OpenAI timeout after 2 retries"
  }
}
```

- All items have category "Inne"
- User can manually edit categories in preview

**Server Errors (500):**

```json
{
  "error": "Internal server error",
  "message": "Something went wrong. Our team has been notified."
}
```

- Log error to Sentry
- Return generic message to user
- Never expose internal details

#### Rate Limiting

**Supabase Default:**

- 100 requests/minute per user
- Applied automatically by Supabase
- Returns 429 Too Many Requests if exceeded

**OpenAI API:**

- Subject to OpenAI account limits
- Implement timeout (10s) to prevent hanging requests
- Graceful fallback to "Inne" category

#### Performance Optimizations

**Database:**

- Indexes on user_id, recipe_id, week_start_date, shopping_list_id
- Compound index on (user_id, week_start_date) for calendar queries
- Connection pooling via PgBouncer (Supabase automatic)

**API:**

- Pagination: default 20 items, max 100
- Select only needed columns (avoid SELECT \*)
- Use JOIN for related data (reduce N+1 queries)

**Caching (Future):**

- Cache common ingredient categories (e.g., "eggs" → "Nabiał")
- Reduce OpenAI API calls by ~30-50%
- Implement with Redis or in-memory cache

---

## 5. Implementation Notes

### 5.1 Astro API Routes

All endpoints are implemented as Astro API routes in `src/pages/api/` with `prerender = false`.

**Example Structure:**

```
src/pages/api/
├── recipes/
│   ├── index.ts          # GET /api/recipes (list), POST /api/recipes (create)
│   └── [id].ts           # GET /api/recipes/:id, PUT /api/recipes/:id, DELETE /api/recipes/:id
├── meal-plan/
│   ├── index.ts          # GET /api/meal-plan (get week), POST /api/meal-plan (assign)
│   └── [id].ts           # DELETE /api/meal-plan/:id
├── shopping-lists/
│   ├── preview.ts        # POST /api/shopping-lists/preview
│   ├── index.ts          # GET /api/shopping-lists (list), POST /api/shopping-lists (save)
│   ├── [id].ts           # GET /api/shopping-lists/:id, DELETE /api/shopping-lists/:id
│   └── [list_id]/items/[item_id].ts  # PATCH item
└── analytics/
    └── export.ts         # POST /api/analytics/export
```

**Endpoint Pattern:**

```typescript
// src/pages/api/recipes/index.ts
export const prerender = false;

import type { APIRoute } from "astro";
import { RecipeSchema } from "@/lib/validation/recipe.schema";

export const GET: APIRoute = async ({ locals, url }) => {
  // Auth check
  const {
    data: { user },
    error,
  } = await locals.supabase.auth.getUser();
  if (error || !user) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Query params
  const search = url.searchParams.get("search");
  const sort = url.searchParams.get("sort") || "created_desc";

  // Business logic
  let query = locals.supabase.from("recipes").select("*");

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  // ... sorting, pagination, etc.

  const { data, error: dbError } = await query;

  if (dbError) {
    console.error("Database error:", dbError);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  // Auth check
  const {
    data: { user },
    error,
  } = await locals.supabase.auth.getUser();
  if (error || !user) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse and validate
  const body = await request.json();
  const validation = RecipeSchema.safeParse(body);

  if (!validation.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Business logic (create recipe)
  // ...

  return new Response(JSON.stringify(result), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
```

### 5.2 Service Layer

Business logic is extracted to service functions in `src/lib/services/`:

```
src/lib/services/
├── recipe.service.ts
├── meal-plan.service.ts
├── shopping-list.service.ts
└── ai-categorization.service.ts
```

**Example Service:**

```typescript
// src/lib/services/ai-categorization.service.ts
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY,
});

export async function categorizeIngredientsWithRetry(ingredients: string[]): Promise<Record<string, string>> {
  const maxRetries = 2;
  const backoffMs = [1000, 2000];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await openai.chat.completions.create(
        {
          model: "gpt-4o-mini",
          temperature: 0,
          max_tokens: 500,
          messages: [
            {
              role: "system",
              content:
                "Categorize ingredients into: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne. Return JSON object mapping index to category.",
            },
            {
              role: "user",
              content: ingredients.map((ing, i) => `${i + 1}. ${ing}`).join("\n"),
            },
          ],
        },
        {
          timeout: 10000, // 10 seconds
        }
      );

      const result = JSON.parse(response.choices[0].message.content);
      return result;
    } catch (error) {
      console.error(`AI categorization attempt ${attempt + 1} failed:`, error);

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, backoffMs[attempt]));
      } else {
        // Final fallback: all items to "Inne"
        return Object.fromEntries(ingredients.map((_, i) => [(i + 1).toString(), "Inne"]));
      }
    }
  }
}
```

### 5.3 Frontend Integration

**TanStack Query (React Query) Example:**

```typescript
// src/components/hooks/useRecipes.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useRecipes(search?: string, sort?: string) {
  return useQuery({
    queryKey: ["recipes", search, sort],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (sort) params.set("sort", sort);

      const response = await fetch(`/api/recipes?${params}`);
      if (!response.ok) throw new Error("Failed to fetch recipes");
      return response.json();
    },
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipe: CreateRecipeDto) => {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipe),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create recipe");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}
```

### 5.4 Testing Checklist

**Unit Tests:**

- [ ] Zod validation schemas
- [ ] Service functions (AI categorization, aggregation logic)
- [ ] Date utilities (week start calculation)

**Integration Tests:**

- [ ] All API endpoints with valid/invalid inputs
- [ ] RLS policies (user A cannot access user B's data)
- [ ] CASCADE DELETE behavior
- [ ] AI categorization with mocked OpenAI responses

**E2E Tests:**

- [ ] Complete user flow: Register → Add recipe → Assign to calendar → Generate list → Export PDF
- [ ] Error scenarios: Network failures, AI timeout, validation errors

**Security Tests:**

- [ ] RLS bypass attempts
- [ ] SQL injection attempts (Supabase should handle)
- [ ] XSS in recipe names/instructions
- [ ] API key exposure check

---

## 6. Deployment Considerations

**Environment Variables:**

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Server-side only!

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxx

# Sentry (optional)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

**Vercel Deployment:**

1. Connect GitHub repository
2. Set environment variables in Vercel dashboard
3. Automatic deployments on push to main
4. Preview deployments for PRs

**Database Migrations:**

- Use `supabase/migrations/` for version-controlled schema changes
- Run migrations with `supabase db push` or via CI/CD

**Monitoring:**

- Sentry for error tracking
- Vercel Analytics for performance
- Supabase Dashboard for database metrics

---

**Document Version:** 1.0
**Last Updated:** 2025-10-26
**Author:** Claude Code (AI API Architect)
**Status:** ✅ Ready for Implementation
