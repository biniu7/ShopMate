# REST API Plan - ShopMate MVP

**Version:** 1.0
**Date:** 2025-10-25
**Status:** Ready for Implementation

---

## 1. Resources

The API exposes the following main resources, each corresponding to database tables:

| Resource | Database Table | Description |
|----------|----------------|-------------|
| **Recipes** | `recipes` | User's collection of cooking recipes with ingredients |
| **Ingredients** | `ingredients` | Recipe ingredients (accessed through recipes) |
| **Meal Plan** | `meal_plan` | Weekly calendar assignments (recipe → day + meal type) |
| **Shopping Lists** | `shopping_lists` | Saved shopping lists (snapshot pattern) |
| **Shopping List Items** | `shopping_list_items` | Individual items in shopping lists with AI categories |

**Note:** Authentication is handled by Supabase Auth directly from the client. No custom auth endpoints are needed.

---

## 2. Endpoints

### 2.1 Recipes

#### **GET /api/recipes**

List all recipes for the authenticated user with search, filtering, and pagination.

**Query Parameters:**
- `search` (string, optional): Case-insensitive substring search on recipe name
- `sort` (string, optional): Sort order. Values: `name_asc`, `name_desc`, `created_asc`, `created_desc`. Default: `created_desc`
- `limit` (integer, optional): Number of results per page. Default: `20`, Max: `100`
- `offset` (integer, optional): Pagination offset. Default: `0`

**Request Headers:**
- `Authorization: Bearer <supabase_jwt_token>` (required)

**Response 200 OK:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Spaghetti Carbonara",
      "instructions": "Cook pasta, mix with eggs and bacon...",
      "ingredient_count": 8,
      "created_at": "2025-01-20T10:30:00Z",
      "updated_at": "2025-01-20T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

**Response 401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

---

#### **GET /api/recipes/:id**

Get a single recipe with all ingredients.

**Path Parameters:**
- `id` (uuid, required): Recipe ID

**Request Headers:**
- `Authorization: Bearer <supabase_jwt_token>` (required)

**Response 200 OK:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Spaghetti Carbonara",
    "instructions": "1. Cook pasta...\n2. Mix eggs...",
    "created_at": "2025-01-20T10:30:00Z",
    "updated_at": "2025-01-20T10:30:00Z",
    "ingredients": [
      {
        "id": "uuid",
        "name": "spaghetti",
        "quantity": 500,
        "unit": "g",
        "sort_order": 0
      },
      {
        "id": "uuid",
        "name": "eggs",
        "quantity": 3,
        "unit": "pcs",
        "sort_order": 1
      }
    ],
    "meal_plan_assignments": 2
  }
}
```

**Response 404 Not Found:**
```json
{
  "error": "NotFound",
  "message": "Recipe not found"
}
```

---

#### **POST /api/recipes**

Create a new recipe with ingredients.

**Request Headers:**
- `Authorization: Bearer <supabase_jwt_token>` (required)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "name": "Spaghetti Carbonara",
  "instructions": "1. Cook pasta according to package...",
  "ingredients": [
    {
      "name": "spaghetti",
      "quantity": 500,
      "unit": "g",
      "sort_order": 0
    },
    {
      "name": "eggs",
      "quantity": 3,
      "unit": "pcs",
      "sort_order": 1
    },
    {
      "name": "salt",
      "sort_order": 2
    }
  ]
}
```

**Validation Rules:**
- `name`: string, 3-100 characters, required
- `instructions`: string, 10-5000 characters, required
- `ingredients`: array, min 1 item, max 50 items, required
  - `name`: string, 1-100 characters, required
  - `quantity`: number, positive, optional
  - `unit`: string, max 50 characters, optional
  - `sort_order`: integer, >= 0, default 0

**Response 201 Created:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Spaghetti Carbonara",
    "instructions": "1. Cook pasta according to package...",
    "created_at": "2025-01-20T10:30:00Z",
    "updated_at": "2025-01-20T10:30:00Z",
    "ingredients": [
      {
        "id": "uuid",
        "name": "spaghetti",
        "quantity": 500,
        "unit": "g",
        "sort_order": 0
      }
    ]
  }
}
```

**Response 400 Bad Request:**
```json
{
  "error": "ValidationError",
  "message": "Invalid request data",
  "details": {
    "name": ["String must contain at least 3 character(s)"],
    "ingredients": ["Array must contain at least 1 element(s)"]
  }
}
```

---

#### **PUT /api/recipes/:id**

Update an existing recipe and its ingredients.

**Path Parameters:**
- `id` (uuid, required): Recipe ID

**Request Headers:**
- `Authorization: Bearer <supabase_jwt_token>` (required)
- `Content-Type: application/json`

**Request Body:**
Same structure as POST /api/recipes

**Business Logic:**
- Recipe updates propagate to all meal plan assignments (they reference recipe_id)
- Previously saved shopping lists remain unchanged (snapshot pattern)
- All existing ingredients are replaced with the new ingredient list
- Database trigger automatically updates `updated_at` timestamp

**Response 200 OK:**
Same structure as GET /api/recipes/:id

**Response 404 Not Found:**
```json
{
  "error": "NotFound",
  "message": "Recipe not found"
}
```

---

#### **DELETE /api/recipes/:id**

Delete a recipe, all its ingredients, and all meal plan assignments (cascade).

**Path Parameters:**
- `id` (uuid, required): Recipe ID

**Request Headers:**
- `Authorization: Bearer <supabase_jwt_token>` (required)

**Response 200 OK:**
```json
{
  "message": "Recipe deleted successfully",
  "meal_plan_assignments_deleted": 3
}
```

**Response 404 Not Found:**
```json
{
  "error": "NotFound",
  "message": "Recipe not found"
}
```

---

### 2.2 Meal Plan

#### **GET /api/meal-plan**

Get meal plan for a specific week.

**Query Parameters:**
- `week_start_date` (string, required): Monday of the week in YYYY-MM-DD format

**Request Headers:**
- `Authorization: Bearer <supabase_jwt_token>` (required)

**Response 200 OK:**
```json
{
  "data": {
    "week_start_date": "2025-01-20",
    "assignments": [
      {
        "id": "uuid",
        "recipe_id": "uuid",
        "recipe_name": "Spaghetti Carbonara",
        "day_of_week": 1,
        "meal_type": "lunch",
        "created_at": "2025-01-15T08:00:00Z"
      },
      {
        "id": "uuid",
        "recipe_id": "uuid",
        "recipe_name": "Scrambled Eggs",
        "day_of_week": 1,
        "meal_type": "breakfast",
        "created_at": "2025-01-15T08:05:00Z"
      }
    ]
  }
}
```

**Response 400 Bad Request:**
```json
{
  "error": "ValidationError",
  "message": "Invalid week_start_date. Must be a Monday in YYYY-MM-DD format"
}
```

---

#### **POST /api/meal-plan**

Assign a recipe to a specific day and meal type.

**Request Headers:**
- `Authorization: Bearer <supabase_jwt_token>` (required)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "recipe_id": "uuid",
  "week_start_date": "2025-01-20",
  "day_of_week": 3,
  "meal_type": "lunch"
}
```

**Validation Rules:**
- `recipe_id`: uuid, required (must exist and belong to user)
- `week_start_date`: date string (YYYY-MM-DD), required, must be Monday
- `day_of_week`: integer, 1-7 (1=Monday, 7=Sunday), required
- `meal_type`: enum ['breakfast', 'second_breakfast', 'lunch', 'dinner'], required

**Business Logic:**
- UNIQUE constraint prevents duplicate assignments (same user, week, day, meal)
- If duplicate attempt: return 409 Conflict

**Response 201 Created:**
```json
{
  "data": {
    "id": "uuid",
    "recipe_id": "uuid",
    "recipe_name": "Spaghetti Carbonara",
    "week_start_date": "2025-01-20",
    "day_of_week": 3,
    "meal_type": "lunch",
    "created_at": "2025-01-20T12:00:00Z"
  }
}
```

**Response 409 Conflict:**
```json
{
  "error": "Conflict",
  "message": "Recipe already assigned to this meal slot"
}
```

**Response 404 Not Found:**
```json
{
  "error": "NotFound",
  "message": "Recipe not found"
}
```

---

#### **DELETE /api/meal-plan/:id**

Remove a recipe assignment from the calendar.

**Path Parameters:**
- `id` (uuid, required): Meal plan assignment ID

**Request Headers:**
- `Authorization: Bearer <supabase_jwt_token>` (required)

**Response 200 OK:**
```json
{
  "message": "Assignment removed successfully"
}
```

**Response 404 Not Found:**
```json
{
  "error": "NotFound",
  "message": "Assignment not found"
}
```

---

### 2.3 Shopping Lists

#### **GET /api/shopping-lists**

List all saved shopping lists for the authenticated user.

**Query Parameters:**
- `sort` (string, optional): Sort order. Values: `created_desc` (default), `created_asc`, `name_asc`, `name_desc`
- `limit` (integer, optional): Number of results. Default: `20`, Max: `100`
- `offset` (integer, optional): Pagination offset. Default: `0`

**Request Headers:**
- `Authorization: Bearer <supabase_jwt_token>` (required)

**Response 200 OK:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Lista zakupów - Week 20-26 Jan",
      "week_start_date": "2025-01-20",
      "item_count": 23,
      "created_at": "2025-01-20T15:30:00Z",
      "updated_at": "2025-01-20T15:30:00Z"
    }
  ],
  "pagination": {
    "total": 12,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

---

#### **GET /api/shopping-lists/:id**

Get a single shopping list with all items grouped by category.

**Path Parameters:**
- `id` (uuid, required): Shopping list ID

**Request Headers:**
- `Authorization: Bearer <supabase_jwt_token>` (required)

**Response 200 OK:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Lista zakupów - Week 20-26 Jan",
    "week_start_date": "2025-01-20",
    "created_at": "2025-01-20T15:30:00Z",
    "updated_at": "2025-01-20T15:30:00Z",
    "items": [
      {
        "id": "uuid",
        "ingredient_name": "mleko",
        "quantity": 2,
        "unit": "l",
        "category": "Nabiał",
        "is_checked": false,
        "sort_order": 0
      },
      {
        "id": "uuid",
        "ingredient_name": "marchew",
        "quantity": 500,
        "unit": "g",
        "category": "Warzywa",
        "is_checked": false,
        "sort_order": 0
      }
    ]
  }
}
```

**Response 404 Not Found:**
```json
{
  "error": "NotFound",
  "message": "Shopping list not found"
}
```

---

#### **POST /api/shopping-lists/generate**

Generate a shopping list from selected meal plan assignments or recipes with AI categorization.

**Request Headers:**
- `Authorization: Bearer <supabase_jwt_token>` (required)
- `Content-Type: application/json`

**Request Body (Option 1 - From Calendar):**
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
      "meal_types": ["breakfast", "lunch", "dinner"]
    }
  ]
}
```

**Request Body (Option 2 - From Recipes):**
```json
{
  "source": "recipes",
  "recipe_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Business Logic:**
1. Fetch ingredients from selected recipes/meal plan assignments
2. Normalize ingredient names (trim, case-insensitive comparison)
3. Aggregate identical ingredients (same name + unit):
   - Sum numeric quantities: "200g flour" + "300g flour" = "500g flour"
   - Keep separate if no quantity or different units
4. Call OpenAI GPT-4o mini for categorization:
   - Prompt: Numbered ingredient list → JSON {index: category}
   - Timeout: 10 seconds
   - Retry: 2 attempts with exponential backoff (1s, 2s)
   - Categories: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne
   - Fallback: All items → "Inne" on API failure
5. Return aggregated and categorized list (not saved yet)

**Response 200 OK:**
```json
{
  "data": {
    "items": [
      {
        "ingredient_name": "mleko",
        "quantity": 2,
        "unit": "l",
        "category": "Nabiał",
        "sort_order": 0
      },
      {
        "ingredient_name": "marchew",
        "quantity": 500,
        "unit": "g",
        "category": "Warzywa",
        "sort_order": 0
      },
      {
        "ingredient_name": "sól",
        "category": "Przyprawy",
        "sort_order": 0
      }
    ],
    "metadata": {
      "total_items": 23,
      "ai_categorization_status": "success",
      "source_recipes": 5
    }
  }
}
```

**Response 400 Bad Request:**
```json
{
  "error": "ValidationError",
  "message": "No recipes found for selected meal plan assignments"
}
```

**Response 500 Internal Server Error (with partial success):**
```json
{
  "data": {
    "items": [
      {
        "ingredient_name": "mleko",
        "quantity": 2,
        "unit": "l",
        "category": "Inne",
        "sort_order": 0
      }
    ],
    "metadata": {
      "total_items": 23,
      "ai_categorization_status": "failed",
      "ai_error": "OpenAI API timeout after 2 retries",
      "source_recipes": 5
    }
  }
}
```

---

#### **POST /api/shopping-lists**

Save a generated shopping list as a snapshot.

**Request Headers:**
- `Authorization: Bearer <supabase_jwt_token>` (required)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "name": "Lista zakupów - Week 20-26 Jan",
  "week_start_date": "2025-01-20",
  "items": [
    {
      "ingredient_name": "mleko",
      "quantity": 2,
      "unit": "l",
      "category": "Nabiał",
      "sort_order": 0
    }
  ]
}
```

**Validation Rules:**
- `name`: string, max 200 characters, default "Lista zakupów"
- `week_start_date`: date (YYYY-MM-DD), optional
- `items`: array, min 1 item, max 100 items, required
  - `ingredient_name`: string, 1-100 characters, required
  - `quantity`: number, positive, optional
  - `unit`: string, max 50 characters, optional
  - `category`: enum (7 categories), default "Inne"
  - `is_checked`: boolean, default false
  - `sort_order`: integer, >= 0, default 0

**Business Logic:**
- Uses database RPC function `generate_shopping_list()` for atomic insert
- Snapshot pattern: No FK to ingredients (data copied at save time)
- Future recipe edits don't affect this saved list

**Response 201 Created:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Lista zakupów - Week 20-26 Jan",
    "week_start_date": "2025-01-20",
    "item_count": 23,
    "created_at": "2025-01-20T15:30:00Z",
    "updated_at": "2025-01-20T15:30:00Z"
  }
}
```

**Response 400 Bad Request:**
```json
{
  "error": "ValidationError",
  "message": "Invalid request data",
  "details": {
    "items": ["Array must contain at least 1 element(s)"]
  }
}
```

---

#### **PATCH /api/shopping-lists/:id/items/:itemId**

Update a single item in a shopping list (e.g., toggle is_checked, change category).

**Path Parameters:**
- `id` (uuid, required): Shopping list ID
- `itemId` (uuid, required): Item ID

**Request Headers:**
- `Authorization: Bearer <supabase_jwt_token>` (required)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "is_checked": true
}
```

**Allowed Updates:**
- `is_checked`: boolean
- `category`: enum (7 categories)
- `quantity`: number, positive, optional
- `sort_order`: integer, >= 0

**Response 200 OK:**
```json
{
  "data": {
    "id": "uuid",
    "ingredient_name": "mleko",
    "quantity": 2,
    "unit": "l",
    "category": "Nabiał",
    "is_checked": true,
    "sort_order": 0
  }
}
```

---

#### **DELETE /api/shopping-lists/:id**

Delete a shopping list and all its items (cascade).

**Path Parameters:**
- `id` (uuid, required): Shopping list ID

**Request Headers:**
- `Authorization: Bearer <supabase_jwt_token>` (required)

**Response 200 OK:**
```json
{
  "message": "Shopping list deleted successfully"
}
```

**Response 404 Not Found:**
```json
{
  "error": "NotFound",
  "message": "Shopping list not found"
}
```

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

**Provider:** Supabase Auth

**Implementation:**
- Client-side authentication using Supabase JavaScript client
- No custom auth endpoints needed (handled by Supabase directly)
- Session stored in httpOnly cookies (immune to XSS attacks)
- JWT tokens with automatic refresh

**Authentication Flow:**

1. **Registration:**
   - Client calls `supabase.auth.signUp({ email, password })`
   - Supabase creates user in `auth.users` table
   - Returns session with JWT access token
   - Client stores session in cookies

2. **Login:**
   - Client calls `supabase.auth.signInWithPassword({ email, password })`
   - Supabase validates credentials
   - Returns session with JWT access token

3. **Logout:**
   - Client calls `supabase.auth.signOut()`
   - Supabase invalidates session
   - Client clears cookies

4. **Password Reset:**
   - Client calls `supabase.auth.resetPasswordForEmail(email)`
   - Supabase sends magic link via email
   - User clicks link and sets new password

### 3.2 Authorization

**Mechanism:** Row Level Security (RLS) in PostgreSQL

**How it works:**
- All database tables have RLS enabled
- Policies use `auth.uid()` to get current user ID from JWT
- Automatic filtering: Users can only access their own data
- Policies applied at database level (impossible to bypass)

**RLS Policies:**

```sql
-- Example: recipes table
CREATE POLICY recipes_select ON recipes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Example: ingredients table (through recipe ownership)
CREATE POLICY ingredients_select ON ingredients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = ingredients.recipe_id
        AND recipes.user_id = auth.uid()
    )
  );
```

**API Implementation:**
- All `/api/*` endpoints require `Authorization: Bearer <token>` header
- Middleware extracts JWT and verifies with Supabase
- Supabase client automatically includes `auth.uid()` in database queries
- RLS policies enforce data isolation at database level

**Security Benefits:**
- No manual filtering needed in application code
- Impossible to access other users' data (even with SQL injection)
- Consistent authorization across all database operations
- GDPR compliant (perfect data isolation)

---

## 4. Validation and Business Logic

### 4.1 Validation Rules per Resource

#### Recipes

**Field Validations:**
- `name`:
  - Type: string
  - Required: yes
  - Min length: 3 characters
  - Max length: 100 characters
  - Trim whitespace

- `instructions`:
  - Type: string
  - Required: yes
  - Min length: 10 characters
  - Max length: 5000 characters
  - Preserve newlines and formatting

- `ingredients`:
  - Type: array
  - Required: yes
  - Min items: 1
  - Max items: 50
  - Each ingredient:
    - `name`: string, 1-100 chars, required, trim
    - `quantity`: number, positive, optional
    - `unit`: string, max 50 chars, optional, trim
    - `sort_order`: integer, >= 0, default 0

**Business Rules:**
- Recipe name doesn't need to be unique (user can have multiple recipes with same name)
- Editing a recipe updates `updated_at` automatically (database trigger)
- Deleting a recipe cascades to ingredients and meal_plan assignments
- Recipe updates propagate to meal plan (they reference recipe_id)
- Previously saved shopping lists remain unchanged (snapshot pattern)

#### Meal Plan

**Field Validations:**
- `recipe_id`:
  - Type: uuid
  - Required: yes
  - Must exist in recipes table
  - Must belong to current user (RLS enforced)

- `week_start_date`:
  - Type: date string (YYYY-MM-DD)
  - Required: yes
  - Must be a Monday
  - Regex: `^\d{4}-\d{2}-\d{2}$`

- `day_of_week`:
  - Type: integer
  - Required: yes
  - Min: 1 (Monday)
  - Max: 7 (Sunday)

- `meal_type`:
  - Type: enum
  - Required: yes
  - Values: `breakfast`, `second_breakfast`, `lunch`, `dinner`

**Business Rules:**
- UNIQUE constraint: One recipe per (user, week, day, meal_type) combination
- Duplicate assignment attempt returns 409 Conflict
- Deleting a recipe cascades to all its meal plan assignments
- Assignment deletion is fast (no confirmation dialog in UI per PRD)

#### Shopping Lists

**Field Validations:**
- `name`:
  - Type: string
  - Required: no
  - Default: "Lista zakupów"
  - Max length: 200 characters

- `week_start_date`:
  - Type: date string (YYYY-MM-DD)
  - Required: no (null for "From Recipes" mode)
  - Regex: `^\d{4}-\d{2}-\d{2}$`

- `items`:
  - Type: array
  - Required: yes (for POST /api/shopping-lists)
  - Min items: 1
  - Max items: 100
  - Each item:
    - `ingredient_name`: string, 1-100 chars, required
    - `quantity`: number, positive, optional
    - `unit`: string, max 50 chars, optional
    - `category`: enum (7 values), default "Inne"
    - `is_checked`: boolean, default false
    - `sort_order`: integer, >= 0, default 0

**Business Rules:**
- Shopping lists are immutable snapshots (no FK to recipes/ingredients)
- Items preserve original ingredient names (case-sensitive for display)
- Category order is always fixed: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne
- Only `is_checked`, `category`, `quantity`, and `sort_order` can be updated after creation
- Deleting a list cascades to all items

### 4.2 Business Logic Implementation

#### 1. Ingredient Aggregation

**Location:** POST /api/shopping-lists/generate

**Algorithm:**
```
1. Fetch all ingredients from selected recipes/meal plan
2. For each ingredient:
   a. Normalize: trim(name), lowercase for comparison
   b. Normalize: trim(unit), lowercase for comparison
   c. Key = (normalized_name, normalized_unit)
3. Group by key:
   a. If quantities are numeric and units match: sum them
   b. If no quantity or units differ: keep as separate items
4. Preserve original casing for display (use first occurrence)
```

**Example:**
```
Input:
  - "200g mąki"
  - "300G Mąki"
  - "sól do smaku"

Output:
  - "500g mąki" (aggregated, preserved first casing)
  - "sól do smaku" (no quantity, not aggregated)
```

#### 2. AI Categorization

**Location:** POST /api/shopping-lists/generate

**Provider:** OpenAI API (GPT-4o mini)

**Prompt Template:**
```
Categorize the following ingredients into one of these categories:
Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne.

Return a JSON object mapping each index to a category.

Ingredients:
1. mleko
2. marchew
3. kurczak
4. sól

Expected format:
{"1": "Nabiał", "2": "Warzywa", "3": "Mięso", "4": "Przyprawy"}
```

**Configuration:**
- Model: gpt-4o-mini
- Temperature: 0 (deterministic)
- Max tokens: 500
- Timeout: 10 seconds
- Retry: 2 attempts with exponential backoff (1s, 2s)

**Error Handling:**
- Timeout or API error: All items → category "Inne"
- Invalid category returned: Fallback to "Inne"
- Partial success: Use returned categories, fallback "Inne" for missing
- Log errors to Sentry for monitoring

**Cost Estimation:**
- ~$0.0001 per request (50 ingredients average)
- 10,000 users × 4 lists/month = $4/month

#### 3. Snapshot Pattern

**Affected Resources:** Shopping Lists

**Implementation:**
- `shopping_lists` and `shopping_list_items` have NO foreign keys to `recipes` or `ingredients`
- Data is copied at generation time (ingredient names, quantities, units, categories)
- Editing original recipes does NOT update saved shopping lists
- This ensures lists remain stable and predictable

**Benefits:**
- Simple implementation (no versioning needed)
- Predictable behavior (lists don't change unexpectedly)
- Performance (no joins needed to display lists)

**Trade-offs:**
- Data duplication (acceptable for MVP)
- No automatic updates if recipes change (by design)

#### 4. Cascade Deletion

**Handled by:** PostgreSQL ON DELETE CASCADE

**Scenarios:**

1. **Delete User Account:**
   - Cascade: recipes → ingredients, meal_plan, shopping_lists → shopping_list_items
   - GDPR compliant (complete data removal)

2. **Delete Recipe:**
   - Cascade: ingredients, meal_plan assignments
   - Shopping lists unaffected (snapshot pattern, no FK)
   - API returns count of deleted meal_plan assignments

3. **Delete Shopping List:**
   - Cascade: shopping_list_items
   - No effect on recipes or meal plan

---

## 5. Error Responses

### Standard Error Format

All error responses follow this structure:

```json
{
  "error": "ErrorType",
  "message": "Human-readable error description",
  "details": {
    "field_name": ["Error detail 1", "Error detail 2"]
  }
}
```

### HTTP Status Codes

| Code | Error Type | Usage |
|------|------------|-------|
| **400** | Bad Request | Invalid request data, validation errors |
| **401** | Unauthorized | Missing or invalid authentication token |
| **403** | Forbidden | Authenticated but not authorized (rare with RLS) |
| **404** | Not Found | Resource doesn't exist or doesn't belong to user |
| **409** | Conflict | Duplicate resource (e.g., meal plan assignment) |
| **429** | Too Many Requests | Rate limit exceeded (Supabase default: 100 req/min) |
| **500** | Internal Server Error | Unexpected server error, logged to Sentry |
| **503** | Service Unavailable | Temporary outage (database, OpenAI API) |

### Common Error Examples

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Authentication required. Please log in."
}
```

**400 Validation Error:**
```json
{
  "error": "ValidationError",
  "message": "Invalid request data",
  "details": {
    "name": ["String must contain at least 3 character(s)"],
    "ingredients": [
      "Array must contain at least 1 element(s)",
      "Array must contain at most 50 element(s)"
    ],
    "ingredients.0.quantity": ["Number must be greater than 0"]
  }
}
```

**404 Not Found:**
```json
{
  "error": "NotFound",
  "message": "Recipe not found or you don't have access to it"
}
```

**409 Conflict:**
```json
{
  "error": "Conflict",
  "message": "A recipe is already assigned to this meal slot",
  "details": {
    "existing_assignment_id": "uuid",
    "existing_recipe_name": "Spaghetti Carbonara"
  }
}
```

**429 Rate Limit:**
```json
{
  "error": "TooManyRequests",
  "message": "Rate limit exceeded. Please try again in 60 seconds.",
  "retry_after": 60
}
```

**500 Internal Error:**
```json
{
  "error": "InternalServerError",
  "message": "An unexpected error occurred. Our team has been notified.",
  "incident_id": "uuid"
}
```

**503 OpenAI Service Unavailable:**
```json
{
  "error": "ServiceUnavailable",
  "message": "AI categorization service is temporarily unavailable. All items have been categorized as 'Inne'. You can manually update categories.",
  "service": "OpenAI API",
  "fallback_applied": true
}
```

---

## 6. Rate Limiting

### Supabase Default Limits

| Tier | Requests per Second | Notes |
|------|---------------------|-------|
| **Free** | 50 req/s | Sufficient for MVP testing |
| **Pro** | 200 req/s | Sufficient for 1,000-10,000 users |
| **Team** | 500 req/s | Sufficient for 50,000+ users |

### Custom Rate Limits (Future)

For production, consider implementing additional rate limiting:

- **Per User:**
  - Recipe creation: 10 per minute
  - Shopping list generation: 5 per minute (AI cost control)
  - General API: 100 requests per minute

- **Implementation:**
  - Use Supabase Edge Functions with Deno KV for rate limiting
  - Or middleware in Astro API routes with Redis

---

## 7. Performance Considerations

### Database Optimization

1. **Indexes** (from database plan):
   - `idx_recipes_user_id` - Fast recipe filtering
   - `idx_ingredients_recipe_id` - Fast ingredient joins
   - `idx_meal_plan_user_week` - Compound index for calendar queries
   - `idx_shopping_list_items_category_sort` - Fast grouping for display

2. **Query Optimization:**
   - Use compound indexes for multi-column WHERE clauses
   - Limit result sets (default 20 items per page)
   - Use `SELECT` with specific columns (avoid `SELECT *`)

3. **Connection Pooling:**
   - Supabase uses PgBouncer automatically
   - Handles concurrent connections efficiently

### API Response Times

**Target Performance (p95):**
- GET endpoints: < 100ms
- POST/PUT endpoints: < 200ms
- Shopping list generation: < 3 seconds (including AI)

**Optimization Strategies:**
- Client-side caching with TanStack Query (stale-while-revalidate)
- Optimistic UI updates (immediate feedback, rollback on error)
- Pagination for large lists
- Lazy loading for ingredient details

### AI Categorization Performance

**Expected Timing:**
- API call: 1-3 seconds (batch of 50 ingredients)
- With retries: max 10 seconds (timeout)
- Fallback: immediate (category = "Inne")

**Optimization Ideas (Post-MVP):**
- Cache common ingredients (e.g., "mleko" → "Nabiał")
- Reduce API calls by ~30-50%
- Local mapping for frequent items

---

## 8. Security Considerations

### Input Validation

**All endpoints:**
- Zod schema validation on all request bodies
- SQL injection prevention (Supabase uses parameterized queries)
- XSS prevention (React automatic escaping)
- Sanitize string inputs (trim, length limits)

### Authentication Security

**JWT Tokens:**
- Signed by Supabase (RS256 algorithm)
- Short expiration (1 hour)
- Automatic refresh mechanism
- Stored in httpOnly cookies (XSS-safe)

**Password Requirements:**
- Minimum 8 characters
- Enforced by Supabase Auth
- Bcrypt hashing (automatic)

### Authorization Security

**Row Level Security:**
- All tables have RLS enabled
- Policies use `auth.uid()` from JWT
- Impossible to access other users' data
- Enforced at database level (bypassing app layer won't work)

### API Key Security

**OpenAI API Key:**
- MUST be stored server-side only (environment variable)
- NEVER exposed to browser/client
- API calls made from backend (Supabase Edge Functions or API routes)
- Flow: Client → Backend API → OpenAI

**Supabase Keys:**
- `anon` key: Public, safe to expose (RLS protects data)
- `service_role` key: NEVER exposed to client, backend only

### Data Privacy

**GDPR Compliance:**
- User data isolated via RLS
- CASCADE DELETE on user account removal
- All user data deleted automatically
- Hosted in EU region (Supabase setting)

**OpenAI Data Handling:**
- Ingredient names sent to OpenAI for categorization
- OpenAI API calls NOT used for training (per OpenAI policy)
- Data Processing Agreement available from OpenAI
- Acceptable risk for MVP (ingredient names are not sensitive)

---

## 9. API Versioning

### Current Version

**Version:** v1 (implicit)
**Base Path:** `/api/`

### Future Versioning Strategy

When breaking changes are needed:

**Option 1: URL versioning**
```
/api/v1/recipes
/api/v2/recipes
```

**Option 2: Header versioning**
```
GET /api/recipes
Accept: application/vnd.shopmate.v2+json
```

**Recommendation:** URL versioning (simpler for MVP)

---

## 10. API Documentation

### Auto-Generated Docs (Future)

**Tools to consider:**
- Swagger/OpenAPI specification
- Postman collection
- Redoc or Scalar for documentation UI

### Example Request Collection

**Postman Collection Structure:**
```
ShopMate API
├── Authentication (Supabase direct)
│   ├── Register
│   ├── Login
│   └── Logout
├── Recipes
│   ├── List Recipes
│   ├── Get Recipe
│   ├── Create Recipe
│   ├── Update Recipe
│   └── Delete Recipe
├── Meal Plan
│   ├── Get Week
│   ├── Assign Recipe
│   └── Remove Assignment
└── Shopping Lists
    ├── List Shopping Lists
    ├── Get Shopping List
    ├── Generate Shopping List
    ├── Save Shopping List
    ├── Update Item
    └── Delete Shopping List
```

---

## 11. Testing Strategy

### Unit Tests

**Coverage:**
- Validation schemas (Zod)
- Business logic functions (aggregation, normalization)
- Error handling

**Tools:**
- Vitest
- Zod schema testing

### Integration Tests

**Coverage:**
- API endpoints with authenticated requests
- Database operations with RLS
- OpenAI API integration (mocked)

**Tools:**
- Vitest + Supertest
- Supabase test client
- MSW for API mocking

### End-to-End Tests

**Coverage:**
- Critical user flows:
  - Create recipe → Assign to calendar → Generate shopping list → Export
  - Register → Add recipes → Create first shopping list

**Tools:**
- Playwright or Cypress

### Security Testing

**Coverage:**
- RLS policy testing (attempt to access other users' data)
- Authentication bypass attempts
- SQL injection prevention
- XSS prevention

**Manual Testing:**
- Penetration testing checklist
- Code review of RLS policies

---

## 12. Monitoring and Logging

### Error Tracking

**Tool:** Sentry

**Monitored:**
- 500 Internal Server Errors
- Unhandled exceptions
- OpenAI API failures
- Database query errors

**Alerts:**
- Critical errors: Immediate Slack/email notification
- Error rate threshold: > 1% of requests

### Performance Monitoring

**Tool:** Vercel Analytics / Plausible

**Metrics:**
- API response times (p50, p95, p99)
- Database query performance
- OpenAI API latency
- Error rates per endpoint

**Web Vitals:**
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

### Logging

**Structured Logging:**
```json
{
  "timestamp": "2025-01-20T15:30:00Z",
  "level": "info",
  "endpoint": "POST /api/recipes",
  "user_id": "uuid",
  "duration_ms": 145,
  "status": 201
}
```

**Log Levels:**
- `error`: Critical failures
- `warn`: Non-critical issues (AI fallback, validation errors)
- `info`: Successful operations
- `debug`: Detailed debugging info (development only)

---

## 13. Deployment Checklist

### Before First Deploy

- [ ] All RLS policies created and tested
- [ ] Database migrations applied (Supabase)
- [ ] Environment variables configured (Vercel/Netlify)
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (backend only)
  - [ ] `OPENAI_API_KEY` (backend only)
- [ ] API endpoints return correct response formats
- [ ] Validation schemas in place (Zod)
- [ ] Error handling implemented
- [ ] CORS configured (if needed)
- [ ] Rate limiting enabled (Supabase default)

### Testing in Production

- [ ] Smoke tests on production API
- [ ] RLS policies verified (cannot access other users' data)
- [ ] OpenAI API integration working
- [ ] Sentry error tracking active
- [ ] Performance monitoring active

---

## 14. Future Enhancements (Post-MVP)

### API Improvements

1. **Ingredient Cache:**
   - Endpoint: `GET /api/ingredients/common`
   - Pre-categorized frequent ingredients
   - Reduce OpenAI API calls by 30-50%

2. **Bulk Operations:**
   - `POST /api/recipes/bulk` - Import multiple recipes
   - `DELETE /api/recipes/bulk` - Delete multiple recipes

3. **Recipe Sharing (v1.1):**
   - `POST /api/recipes/:id/share` - Generate share link
   - `GET /api/recipes/shared/:token` - View shared recipe

4. **Advanced Search:**
   - Full-text search on ingredients
   - Filter by ingredient: `GET /api/recipes?ingredient=chicken`

5. **Webhooks:**
   - Notify external services on shopping list creation
   - Integration with shopping platforms (Frisco, Carrefour)

---

## Conclusion

This REST API plan provides a comprehensive foundation for the ShopMate MVP. The design prioritizes:

- **Simplicity:** Minimal endpoints, clear responsibilities
- **Security:** RLS-first approach, Supabase Auth integration
- **Performance:** Optimized queries, pagination, caching strategies
- **Reliability:** Error handling, retries, fallbacks (especially for AI)
- **Scalability:** Database indexes, connection pooling, rate limiting

The API is ready for implementation with Astro API routes (prerender=false) and Supabase client integration.

**Next Steps:**
1. Implement Zod validation schemas (`src/lib/validation/`)
2. Create API route handlers (`src/pages/api/`)
3. Set up Supabase Edge Functions for OpenAI integration
4. Implement error handling middleware
5. Write integration tests
6. Deploy to staging environment
7. Conduct security audit (RLS policies)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-25
**Author:** Claude Code (AI REST API Architect)
**Status:** ✅ Ready for Implementation
