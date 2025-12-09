# API Endpoint Implementation Plan: POST /api/recipes - Create Recipe

**Date:** 2025-10-26
**Version:** 1.0
**Status:** Ready for Implementation

---

## 1. Endpoint Overview

The POST /api/recipes endpoint allows authenticated users to create a new recipe with associated ingredients. This is a
core feature of the ShopMate application, enabling users to build their recipe collection which will later be used for
meal planning and shopping list generation.

**Key Characteristics:**

- Authenticated endpoint (requires valid Supabase session)
- Creates a recipe record and multiple ingredient records in a transaction
- Returns the complete recipe with nested ingredients on success
- Validates input according to business rules and database constraints
- Uses Row Level Security (RLS) to ensure data isolation

**Business Context:**

- Part of Recipe CRUD operations (FR-001 from PRD)
- Foundation for meal planning and shopping list features
- User must be able to add 1-50 ingredients per recipe
- Recipe names don't need to be unique (user can have duplicates)

---

## 2. Request Details

### HTTP Method

**POST**

### URL Structure

```
/api/recipes
```

### Headers

```
Content-Type: application/json
Cookie: sb-<project-ref>-auth-token (Supabase session cookie)
```

### Parameters

**Path Parameters:** None

**Query Parameters:** None

**Request Body (Required):**

| Field          | Type   | Required | Constraints        | Description              |
| -------------- | ------ | -------- | ------------------ | ------------------------ |
| `name`         | string | Yes      | 3-100 characters   | Recipe name              |
| `instructions` | string | Yes      | 10-5000 characters | Preparation instructions |
| `ingredients`  | array  | Yes      | 1-50 items         | List of ingredients      |

**Ingredient Object Structure:**

| Field        | Type           | Required | Constraints               | Description               |
| ------------ | -------------- | -------- | ------------------------- | ------------------------- |
| `name`       | string         | Yes      | 1-100 characters          | Ingredient name           |
| `quantity`   | number \| null | No       | Positive number or null   | Amount of ingredient      |
| `unit`       | string \| null | No       | Max 50 characters or null | Unit of measurement       |
| `sort_order` | number         | Yes      | Non-negative integer      | Display order (0-indexed) |

**Example Request:**

```json
{
  "name": "Spaghetti Carbonara",
  "instructions": "1. Boil pasta in salted water until al dente.\n2. Fry bacon until crispy.\n3. Mix eggs with parmesan.\n4. Combine all ingredients while pasta is hot.",
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

---

## 3. Types Used

### Command Models (Input)

```typescript
// From src/types.ts

CreateRecipeDto;
{
  name: string;
  instructions: string;
  ingredients: IngredientInputDto[];
}

IngredientInputDto;
{
  name: string;
  quantity: number | null;
  unit: string | null;
  sort_order: number;
}
```

### Response DTOs (Output)

```typescript
// Success Response
RecipeResponseDto;
extends
Recipe;
{
  id: string;
  user_id: string;
  name: string;
  instructions: string;
  created_at: string;
  updated_at: string;
  ingredients: IngredientResponseDto[];
  meal_plan_assignments ? : number; // Will be 0 for newly created recipe
}

IngredientResponseDto = Ingredient;
{
  id: string;
  recipe_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  sort_order: number;
}
```

### Error DTOs

```typescript
// Validation Error Response
ValidationErrorResponseDto;
{
  error: string;
  details: ValidationErrorDetails; // Record<string, string[]>
}

// Generic Error Response
ErrorResponseDto;
{
  error: string;
  message ? : string;
}
```

### Database Types

```typescript
// From database.types.ts (used internally in service)
RecipeInsert = Database["public"]["Tables"]["recipes"]["Insert"];
IngredientInsert = Database["public"]["Tables"]["ingredients"]["Insert"];
```

---

## 4. Response Details

### Success Response (201 Created)

**Status Code:** 201 Created

**Headers:**

```
Content-Type: application/json
```

**Body Structure:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Spaghetti Carbonara",
  "instructions": "1. Boil pasta in salted water...",
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
    },
    {
      "id": "650e8400-e29b-41d4-a716-446655440002",
      "recipe_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "bacon",
      "quantity": 200,
      "unit": "g",
      "sort_order": 1
    }
    // ... other ingredients
  ]
}
```

### Error Responses

#### 400 Bad Request - Validation Error

**Scenario:** Invalid input data (fails Zod validation)

**Response:**

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

**Common Validation Failures:**

- Recipe name too short (<3 chars) or too long (>100 chars)
- Instructions too short (<10 chars) or too long (>5000 chars)
- No ingredients provided (empty array)
- Too many ingredients (>50)
- Ingredient name empty or too long (>100 chars)
- Invalid quantity (negative number)
- Invalid unit (>50 chars)
- Invalid sort_order (negative number)
- Missing required fields

#### 401 Unauthorized

**Scenario:** User not authenticated (no valid session)

**Response:**

```json
{
  "error": "Authentication required"
}
```

#### 500 Internal Server Error

**Scenario:** Unexpected server error (database failure, etc.)

**Response:**

```json
{
  "error": "Internal server error",
  "message": "Something went wrong. Our team has been notified."
}
```

**Note:** Internal error details are logged to Sentry but never exposed to client.

---

## 5. Data Flow

### High-Level Flow Diagram

```
Client Request
    ↓
[1] Astro Middleware (adds supabase to context.locals)
    ↓
[2] POST Handler (src/pages/api/recipes/index.ts)
    ↓
[3] Authentication Check (context.locals.supabase.auth.getUser())
    ↓ (if authenticated)
[4] Input Validation (Zod schema)
    ↓ (if valid)
[5] Service Layer (src/lib/services/recipe.service.ts)
    ↓
[6] Database Operations (Supabase client)
    ├─ INSERT recipe (returns recipe_id)
    └─ BULK INSERT ingredients (with recipe_id)
    ↓
[7] Fetch Complete Recipe (with ingredients)
    ↓
[8] Return Response (201 Created with RecipeResponseDto)
```

### Detailed Step-by-Step Flow

#### Step 1: Request Reception

- Astro receives POST request at /api/recipes
- Middleware executes: `context.locals.supabase = supabaseClient`
- Request routed to POST handler in `src/pages/api/recipes/index.ts`

#### Step 2: Authentication

```typescript
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
```

- Extract user from Supabase session
- If no valid session → 401 response
- If valid → proceed with user.id

#### Step 3: Input Parsing & Validation

```typescript
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

const validatedData = validation.data;
```

- Parse JSON body
- Validate with Zod schema
- If invalid → 400 response with detailed errors
- If valid → proceed with validated data

#### Step 4: Business Logic (Service Layer)

```typescript
const recipe = await createRecipe(locals.supabase, user.id, validatedData);
```

Service performs:

1. **Insert Recipe:**

   ```typescript
   const { data: recipeData, error: recipeError } = await supabase
     .from("recipes")
     .insert({
       user_id: userId,
       name: validatedData.name,
       instructions: validatedData.instructions,
     })
     .select()
     .single();
   ```

2. **Insert Ingredients (Bulk):**

   ```typescript
   const ingredientsToInsert = validatedData.ingredients.map((ing) => ({
     recipe_id: recipeData.id,
     name: ing.name,
     quantity: ing.quantity,
     unit: ing.unit,
     sort_order: ing.sort_order,
   }));

   const { error: ingredientsError } = await supabase.from("ingredients").insert(ingredientsToInsert);
   ```

3. **Fetch Complete Recipe:**
   ```typescript
   const { data: completeRecipe } = await supabase
     .from("recipes")
     .select(
       `
       *,
       ingredients (*)
     `
     )
     .eq("id", recipeData.id)
     .single();
   ```

#### Step 5: Response Formation

```typescript
return new Response(JSON.stringify(completeRecipe), {
  status: 201,
  headers: { "Content-Type": "application/json" },
});
```

### Database Interaction Details

**Tables Involved:**

1. `recipes` - Main recipe table
2. `ingredients` - Related ingredients table

**RLS Policies Applied:**

- `recipes_insert`: Ensures `user_id` matches `auth.uid()`
- `ingredients_insert`: Ensures ingredient's recipe belongs to user

**Transaction Considerations:**

- Supabase operations are not in explicit transaction
- If ingredients insert fails after recipe insert, we have orphaned recipe
- **Mitigation:** Use PostgreSQL transaction or handle cleanup in service

**Indexes Used:**

- `idx_recipes_user_id` - For filtering recipes by user
- `idx_ingredients_recipe_id` - For fetching recipe's ingredients

---

## 6. Security Considerations

### Authentication

**Mechanism:** Supabase Auth with JWT session cookies

**Implementation:**

```typescript
const {
  data: { user },
  error,
} = await locals.supabase.auth.getUser();
```

**Security Guarantees:**

- Only authenticated users can create recipes
- JWT tokens are httpOnly cookies (immune to XSS)
- Tokens auto-refresh via Supabase SDK
- Invalid/expired tokens rejected automatically

### Authorization

**Mechanism:** Row Level Security (RLS) at PostgreSQL level

**RLS Policies:**

```sql
CREATE
POLICY recipes_insert ON recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

**Security Guarantees:**

- User can only create recipes for themselves (user_id = auth.uid())
- Even if client manipulates request, RLS prevents unauthorized inserts
- Database-level enforcement (cannot bypass)

### Input Validation

**Mechanism:** Zod schema validation

**Validation Rules:**

```typescript
const IngredientInputSchema = z.object({
  name: z.string().min(1).max(100),
  quantity: z.number().positive().nullable(),
  unit: z.string().max(50).nullable(),
  sort_order: z.number().int().min(0),
});

const RecipeSchema = z.object({
  name: z.string().min(3).max(100),
  instructions: z.string().min(10).max(5000),
  ingredients: z.array(IngredientInputSchema).min(1).max(50),
});
```

**Protection Against:**

- **XSS:** React auto-escapes output, validation prevents malicious scripts
- **SQL Injection:** Supabase uses parameterized queries
- **Buffer Overflow:** String length limits prevent excessive memory usage
- **Business Logic Bypass:** Min/max constraints enforce business rules

### Data Sanitization

**Input:**

- Zod validates types and formats
- Strings are trimmed and length-checked
- No HTML sanitization needed (React escapes on render)

**Output:**

- Database returns typed data (no raw SQL)
- JSON serialization handles special characters
- No user-generated content in headers

### Rate Limiting

**Supabase Default:** 100 requests/minute per user

**Additional Measures:**

- Monitor via Supabase Dashboard
- Can implement custom rate limiting if needed
- Consider CAPTCHA for public endpoints (not applicable here - authenticated)

### Sensitive Data

**API Keys:**

- `SUPABASE_URL` and `SUPABASE_KEY` in environment variables
- Anon key exposed to client (safe, RLS protects data)
- Service role key NEVER exposed (server-side only)

**User Data:**

- Recipe content is user-private (RLS enforced)
- No PII in recipes/ingredients
- GDPR compliance via CASCADE DELETE on user deletion

---

## 7. Error Handling

### Error Categories & Handling Strategy

#### 1. Authentication Errors (401)

**Cause:** User not authenticated or invalid session

**Detection:**

```typescript
const {
  data: { user },
  error,
} = await locals.supabase.auth.getUser();
if (error || !user) {
  // Handle authentication error
}
```

**Response:**

```json
{
  "error": "Authentication required"
}
```

**Client Action:** Redirect to login page

**Logging:** No logging needed (expected behavior)

---

#### 2. Validation Errors (400)

**Causes:**

- Recipe name too short/long
- Instructions too short/long
- No ingredients
- Too many ingredients (>50)
- Invalid ingredient data
- Missing required fields
- Type mismatches

**Detection:**

```typescript
const validation = RecipeSchema.safeParse(body);
if (!validation.success) {
  // Handle validation error
}
```

**Response:**

```json
{
  "error": "Validation failed",
  "details": {
    "name": ["Name must be between 3 and 100 characters"],
    "ingredients": ["At least 1 ingredient required"],
    "ingredients.0.name": ["Ingredient name is required"]
  }
}
```

**Client Action:** Display inline errors in form

**Logging:** No logging needed (user error)

**Examples of Validation Errors:**

| Input Error                   | Validation Message                                    |
| ----------------------------- | ----------------------------------------------------- |
| `name: "AB"`                  | "Name must be between 3 and 100 characters"           |
| `instructions: "Too short"`   | "Instructions must be between 10 and 5000 characters" |
| `ingredients: []`             | "At least 1 ingredient required"                      |
| `ingredients: [... 51 items]` | "Maximum 50 ingredients allowed"                      |
| `quantity: -5`                | "Quantity must be a positive number"                  |
| `unit: "very very long..."`   | "Unit must not exceed 50 characters"                  |

---

#### 3. Database Errors (500)

**Causes:**

- Supabase connection failure
- PostgreSQL errors
- RLS policy violations (should not happen with correct validation)
- Transaction failures
- Timeout errors

**Detection:**

```typescript
const { data, error } = await supabase.from('recipes').insert(...);

if (error) {
  console.error('Database error:', error);
  // Log to Sentry
  // Return 500
}
```

**Response:**

```json
{
  "error": "Internal server error",
  "message": "Something went wrong. Our team has been notified."
}
```

**Client Action:** Show generic error message, suggest retry

**Logging:**

```typescript
console.error("Recipe creation failed:", {
  error: error.message,
  code: error.code,
  user_id: user.id,
  timestamp: new Date().toISOString(),
});

// Sentry logging
Sentry.captureException(error, {
  tags: { endpoint: "POST /api/recipes" },
  user: { id: user.id },
});
```

**Common Database Errors:**

| Error Code         | Cause                       | Mitigation                         |
| ------------------ | --------------------------- | ---------------------------------- |
| `23505`            | Unique constraint violation | Check for duplicates before insert |
| `23503`            | Foreign key violation       | Validate user_id exists            |
| `23514`            | Check constraint violation  | Ensure data meets DB constraints   |
| `PGRST116`         | RLS violation               | Verify auth.uid() matches user_id  |
| Connection timeout | Network/DB overload         | Retry with exponential backoff     |

---

#### 4. Unexpected Errors (500)

**Causes:**

- Unhandled exceptions
- Memory errors
- Parse errors
- Type errors (should be caught by TypeScript)

**Detection:**

```typescript
try {
  // ... endpoint logic
} catch (error) {
  console.error("Unexpected error:", error);
  // Log to Sentry
  return new Response(
    JSON.stringify({
      error: "Internal server error",
      message: "Something went wrong. Our team has been notified.",
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

**Response:** Same as database errors (500)

**Logging:** Full stack trace to Sentry

---

### Error Handling Flow Chart

```
Request Received
    ↓
Authentication Check
    ├─ No User → 401 Error
    └─ Valid User
        ↓
    Parse JSON
        ├─ Parse Error → 400 Error
        └─ Success
            ↓
        Zod Validation
            ├─ Invalid → 400 Error (with details)
            └─ Valid
                ↓
            Database Operations
                ├─ Error → 500 Error (log to Sentry)
                └─ Success → 201 Response
```

---

### Logging Strategy

**Development (console.error):**

```typescript
console.error("Recipe creation failed:", {
  error: error.message,
  user_id: user.id,
  recipe_name: validatedData.name,
});
```

**Production (Sentry):**

```typescript
Sentry.captureException(error, {
  tags: {
    endpoint: "POST /api/recipes",
    operation: "create_recipe",
  },
  user: {
    id: user.id,
  },
  extra: {
    recipe_name: validatedData.name,
    ingredients_count: validatedData.ingredients.length,
  },
});
```

**What NOT to Log:**

- Validation errors (user mistakes, not system issues)
- 401 errors (expected for unauthenticated requests)
- Full request body (may contain sensitive data)

**What TO Log:**

- Database errors
- Unexpected exceptions
- RLS violations (indicates potential security issue)
- Performance issues (slow queries)

---

## 8. Performance Considerations

### Potential Bottlenecks

#### 1. Bulk Ingredient Insert

**Issue:** Inserting 50 ingredients individually = 50 round trips to database

**Current Mitigation:** Use Supabase bulk insert

```typescript
await supabase.from("ingredients").insert(ingredientsArray);
```

**Performance Impact:**

- Bulk insert: ~50-100ms for 50 ingredients
- Individual inserts: ~2-3 seconds for 50 ingredients

**Optimization:** Already optimized with bulk insert

---

#### 2. Recipe Fetch with Ingredients

**Issue:** Fetching recipe + ingredients requires JOIN or multiple queries

**Current Implementation:** Single query with JOIN

```typescript
const { data } = await supabase
  .from("recipes")
  .select(
    `
    *,
    ingredients (*)
  `
  )
  .eq("id", recipeId)
  .single();
```

**Performance Impact:**

- Single query: ~20-50ms
- Separate queries: ~40-100ms

**Optimization:** Already optimized with JOIN

---

#### 3. RLS Policy Evaluation

**Issue:** Each query evaluates RLS policies (adds overhead)

**Performance Impact:**

- RLS overhead: ~10-30% slower than queries without RLS
- For MVP scale (1k-10k users): acceptable
- For 100k+ users: consider app-level authorization

**Optimization (Future):**

- Cache user permissions
- Use service role key for trusted operations (carefully!)
- Move to app-level auth if RLS becomes bottleneck

---

### Database Query Optimization

#### Indexes Used

```sql
-- Automatic index on primary key
CREATE INDEX recipes_pkey ON recipes (id);

-- User filtering (already exists from schema)
CREATE INDEX idx_recipes_user_id ON recipes (user_id);

-- Ingredient lookup (already exists)
CREATE INDEX idx_ingredients_recipe_id ON ingredients (recipe_id);
```

**Query Plan Analysis:**

```sql
EXPLAIN
ANALYZE
SELECT *
FROM recipes
WHERE id = $1;
-- Uses: recipes_pkey (Index Scan) - Fast O(log n)

EXPLAIN
ANALYZE
SELECT *
FROM ingredients
WHERE recipe_id = $1;
-- Uses: idx_ingredients_recipe_id (Index Scan) - Fast O(log n)
```

**Performance Targets:**

- Recipe insert: <100ms (p95)
- Ingredients bulk insert: <200ms (p95)
- Complete recipe fetch: <50ms (p95)
- **Total endpoint latency: <400ms (p95)**

---

### Caching Strategies

#### Not Applicable for POST Endpoint

- POST requests are not cacheable (side effects)
- Each request creates new data
- No benefit from HTTP caching headers

#### Future Considerations (for GET endpoints)

- Cache user's recipe list
- Cache recipe details
- Invalidate on POST/PUT/DELETE

---

### Connection Pooling

**Supabase Automatic:**

- Uses PgBouncer for connection pooling
- Max connections per user: configurable (default 100)
- Connection reuse reduces overhead

**No Action Required:** Handled by Supabase

---

### Payload Size Limits

**Request Size:**

- Recipe name: max 100 bytes
- Instructions: max 5000 bytes
- Ingredients: 50 × ~200 bytes = ~10KB
- **Total payload: ~15KB** (well within limits)

**Response Size:**

- Recipe: ~200 bytes
- Ingredients: 50 × ~300 bytes = ~15KB
- **Total response: ~15KB**

**Optimization:** Already efficient, no compression needed for small payloads

---

### Concurrency

**Scenario:** Multiple users creating recipes simultaneously

**Handling:**

- Each user's request is independent (no shared state)
- RLS ensures data isolation
- PostgreSQL handles concurrent inserts well
- No explicit locking needed

**Expected Performance:**

- 100 concurrent requests: <500ms p95
- 1000 concurrent requests: <1s p95 (with proper Supabase tier)

---

### Performance Monitoring

**Metrics to Track:**

1. **Response Time:**
   - p50, p95, p99 latencies
   - Target: p95 <400ms

2. **Error Rate:**
   - 4xx errors (validation failures)
   - 5xx errors (server issues)
   - Target: 5xx <0.1%

3. **Database Performance:**
   - Query execution time
   - Connection pool usage
   - Index hit rate

**Tools:**

- Vercel Analytics (automatic)
- Supabase Dashboard (query performance)
- Sentry (error tracking + performance monitoring)

**Alerts:**

- p95 latency >1s
- 5xx error rate >1%
- Database connection pool >80% utilization

---

## 9. Implementation Steps

### Step 1: Create Zod Validation Schema

**File:** `src/lib/validation/recipe.schema.ts`

```typescript
import { z } from "zod";

export const IngredientInputSchema = z.object({
  name: z.string().min(1, "Ingredient name is required").max(100, "Ingredient name must not exceed 100 characters"),

  quantity: z.number().positive("Quantity must be a positive number").nullable(),

  unit: z.string().max(50, "Unit must not exceed 50 characters").nullable(),

  sort_order: z.number().int("Sort order must be an integer").min(0, "Sort order must be non-negative").default(0),
});

export const RecipeSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name must not exceed 100 characters").trim(),

  instructions: z
    .string()
    .min(10, "Instructions must be at least 10 characters")
    .max(5000, "Instructions must not exceed 5000 characters")
    .trim(),

  ingredients: z
    .array(IngredientInputSchema)
    .min(1, "At least 1 ingredient required")
    .max(50, "Maximum 50 ingredients allowed"),
});

export type RecipeSchemaType = z.infer<typeof RecipeSchema>;
export type IngredientInputSchemaType = z.infer<typeof IngredientInputSchema>;
```

**Validation:**

- Run `npm run lint` to check for TypeScript errors
- Test schema with sample data:
  ```typescript
  const result = RecipeSchema.safeParse(sampleData);
  console.log(result.success ? "Valid" : result.error);
  ```

---

### Step 2: Create Recipe Service

**File:** `src/lib/services/recipe.service.ts`

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { CreateRecipeDto, RecipeResponseDto } from "@/types";

type SupabaseClientType = SupabaseClient<Database>;

/**
 * Creates a new recipe with ingredients
 *
 * @param supabase - Authenticated Supabase client
 * @param userId - User ID from auth session
 * @param recipeData - Validated recipe data
 * @returns Complete recipe with ingredients
 * @throws Error if database operation fails
 */
export async function createRecipe(
  supabase: SupabaseClientType,
  userId: string,
  recipeData: CreateRecipeDto
): Promise<RecipeResponseDto> {
  // Step 1: Insert recipe
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      user_id: userId,
      name: recipeData.name,
      instructions: recipeData.instructions,
    })
    .select()
    .single();

  if (recipeError) {
    console.error("Failed to create recipe:", recipeError);
    throw new Error("Failed to create recipe");
  }

  // Step 2: Prepare ingredients for bulk insert
  const ingredientsToInsert = recipeData.ingredients.map((ingredient) => ({
    recipe_id: recipe.id,
    name: ingredient.name,
    quantity: ingredient.quantity,
    unit: ingredient.unit,
    sort_order: ingredient.sort_order,
  }));

  // Step 3: Bulk insert ingredients
  const { error: ingredientsError } = await supabase.from("ingredients").insert(ingredientsToInsert);

  if (ingredientsError) {
    console.error("Failed to create ingredients:", ingredientsError);

    // Cleanup: Delete the orphaned recipe
    await supabase.from("recipes").delete().eq("id", recipe.id);

    throw new Error("Failed to create ingredients");
  }

  // Step 4: Fetch complete recipe with ingredients
  const { data: completeRecipe, error: fetchError } = await supabase
    .from("recipes")
    .select(
      `
      *,
      ingredients (*)
    `
    )
    .eq("id", recipe.id)
    .single();

  if (fetchError || !completeRecipe) {
    console.error("Failed to fetch created recipe:", fetchError);
    throw new Error("Failed to fetch created recipe");
  }

  // Step 5: Sort ingredients by sort_order
  const sortedIngredients = [...completeRecipe.ingredients].sort((a, b) => a.sort_order - b.sort_order);

  return {
    ...completeRecipe,
    ingredients: sortedIngredients,
    meal_plan_assignments: 0, // Newly created recipe has no assignments
  };
}
```

**Testing:**

- Unit test with mocked Supabase client
- Test error scenarios (recipe insert fails, ingredients insert fails)
- Verify cleanup on error (orphaned recipe deleted)

---

### Step 3: Implement API Endpoint

**File:** `src/pages/api/recipes/index.ts`

```typescript
export const prerender = false;

import type { APIRoute } from "astro";
import { RecipeSchema } from "@/lib/validation/recipe.schema";
import { createRecipe } from "@/lib/services/recipe.service";

export const POST: APIRoute = async ({ request, locals }) => {
  // Step 1: Authentication check
  const {
    data: { user },
    error: authError,
  } = await locals.supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Step 2: Parse request body
    const body = await request.json();

    // Step 3: Validate with Zod
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

    // Step 4: Create recipe via service
    const recipe = await createRecipe(locals.supabase, user.id, validation.data);

    // Step 5: Return success response
    return new Response(JSON.stringify(recipe), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 6: Error handling
    console.error("Recipe creation error:", error);

    // TODO: Add Sentry logging
    // Sentry.captureException(error, {
    //   tags: { endpoint: 'POST /api/recipes' },
    //   user: { id: user.id }
    // });

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Something went wrong. Our team has been notified.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

**Checklist:**

- [ ] File created at correct path
- [ ] `prerender = false` export added
- [ ] Imports are correct
- [ ] Error handling is comprehensive
- [ ] Response headers set correctly

---

### Step 4: Test the Endpoint

#### Manual Testing with cURL

**Test 1: Successful Creation**

```bash
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-xxx-auth-token=..." \
  -d '{
    "name": "Test Recipe",
    "instructions": "Test instructions that are long enough to pass validation",
    "ingredients": [
      {
        "name": "test ingredient",
        "quantity": 100,
        "unit": "g",
        "sort_order": 0
      }
    ]
  }'
```

**Expected:** 201 response with recipe object

**Test 2: Validation Error (name too short)**

```bash
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-xxx-auth-token=..." \
  -d '{
    "name": "AB",
    "instructions": "Test instructions",
    "ingredients": [...]
  }'
```

**Expected:** 400 response with validation details

**Test 3: Unauthorized**

```bash
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**Expected:** 401 response

**Test 4: Maximum Ingredients (50)**

```bash
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-xxx-auth-token=..." \
  -d '{
    "name": "Test Recipe",
    "instructions": "Test instructions",
    "ingredients": [/* 50 ingredients */]
  }'
```

**Expected:** 201 response

**Test 5: Too Many Ingredients (51)**

```bash
# Same as above but with 51 ingredients
```

**Expected:** 400 response with "Maximum 50 ingredients allowed"

---

#### Integration Testing (Optional)

**File:** `src/tests/api/recipes.test.ts`

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { createRecipe } from "@/lib/services/recipe.service";

describe("POST /api/recipes", () => {
  let supabase: any; // Mock Supabase client
  let userId: string;

  beforeEach(() => {
    // Setup mock Supabase client
    userId = "test-user-id";
  });

  it("should create recipe with ingredients", async () => {
    const recipeData = {
      name: "Test Recipe",
      instructions: "Test instructions for recipe",
      ingredients: [
        {
          name: "ingredient 1",
          quantity: 100,
          unit: "g",
          sort_order: 0,
        },
      ],
    };

    const result = await createRecipe(supabase, userId, recipeData);

    expect(result).toHaveProperty("id");
    expect(result.name).toBe("Test Recipe");
    expect(result.ingredients).toHaveLength(1);
  });

  it("should handle validation errors", async () => {
    const invalidData = {
      name: "AB", // Too short
      instructions: "Short", // Too short
      ingredients: [],
    };

    // Test validation
    // expect(RecipeSchema.safeParse(invalidData).success).toBe(false);
  });

  // More tests...
});
```

---

### Step 5: Verify Database State

After successful creation, verify in Supabase Dashboard:

**Check recipes table:**

```sql
SELECT *
FROM recipes
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC LIMIT 1;
```

**Check ingredients table:**

```sql
SELECT *
FROM ingredients
WHERE recipe_id = 'recipe-id-from-above'
ORDER BY sort_order;
```

**Verify RLS:**

```sql
-- As different user, should return empty
SELECT *
FROM recipes
WHERE id = 'recipe-id';
```

---

### Step 6: Monitor and Debug

#### Enable Detailed Logging

**Development:**

```typescript
console.log("Request body:", JSON.stringify(body, null, 2));
console.log("Validation result:", validation.success);
console.log("User ID:", user.id);
console.log("Created recipe ID:", recipe.id);
```

**Production:**

- Use Sentry for error tracking
- Monitor Supabase Dashboard for slow queries
- Check Vercel Analytics for endpoint performance

#### Common Issues & Solutions

| Issue            | Symptom                     | Solution                                      |
| ---------------- | --------------------------- | --------------------------------------------- |
| 401 error        | "Authentication required"   | Check cookie is sent, verify session is valid |
| 400 error        | Validation fails            | Review Zod schema, check input format         |
| 500 error        | Internal server error       | Check Supabase logs, verify RLS policies      |
| Orphaned recipes | Recipes without ingredients | Fix transaction handling in service           |
| Slow response    | >1s latency                 | Check database indexes, optimize query        |

---

### Step 7: Documentation

#### Update API Documentation

- Add example requests/responses to API docs
- Document error scenarios
- Include cURL examples

#### Code Comments

- Add JSDoc comments to service functions
- Document complex validation logic
- Explain RLS policy assumptions

#### Changelog

```markdown
## [Version] - [Date]

### Added

- POST /api/recipes endpoint for creating recipes
- Recipe validation schema with Zod
- Recipe service for database operations
- Comprehensive error handling and logging
```

---

### Step 8: Code Review Checklist

Before submitting for review:

**Functionality:**

- [ ] Endpoint creates recipe with ingredients correctly
- [ ] Authentication is enforced
- [ ] Validation catches all invalid inputs
- [ ] Error responses are user-friendly
- [ ] Success response matches specification

**Code Quality:**

- [ ] No TypeScript errors (`npm run lint`)
- [ ] Code follows project conventions
- [ ] No console.log statements (use console.error for errors)
- [ ] Functions are properly typed
- [ ] Comments explain complex logic

**Security:**

- [ ] RLS policies prevent unauthorized access
- [ ] Input validation prevents injection
- [ ] No sensitive data in logs
- [ ] Error messages don't leak internal details

**Performance:**

- [ ] Bulk insert used for ingredients
- [ ] Single query for fetching complete recipe
- [ ] No N+1 query problems
- [ ] Response time <400ms (p95)

**Testing:**

- [ ] Manual testing with cURL completed
- [ ] All error scenarios tested
- [ ] Edge cases verified (0 ingredients, 50 ingredients, etc.)
- [ ] Database state verified in Supabase Dashboard

**Documentation:**

- [ ] Code comments added
- [ ] API docs updated
- [ ] Implementation plan followed

---

## 10. Success Criteria

The endpoint implementation is considered successful when:

### Functional Requirements Met

- ✅ Authenticated users can create recipes with 1-50 ingredients
- ✅ Recipe name, instructions, and ingredient details are correctly stored
- ✅ Response includes complete recipe with nested ingredients
- ✅ Ingredients are returned sorted by sort_order
- ✅ Unauthenticated requests are rejected with 401
- ✅ Invalid input is rejected with 400 and detailed error messages

### Performance Requirements Met

- ✅ p95 response time <400ms
- ✅ Bulk insert used for ingredients (not individual inserts)
- ✅ Single query fetches complete recipe

### Security Requirements Met

- ✅ Only authenticated users can create recipes
- ✅ Users can only create recipes for themselves (RLS enforced)
- ✅ Input validation prevents injection attacks
- ✅ Error messages don't expose sensitive information

### Code Quality Requirements Met

- ✅ TypeScript compiles without errors
- ✅ ESLint passes with no warnings
- ✅ Code follows project structure and conventions
- ✅ Proper error handling with logging
- ✅ Service layer abstracts business logic

### Testing Requirements Met

- ✅ All test scenarios pass (successful creation, validation errors, auth errors)
- ✅ Edge cases verified (min/max ingredients, null values, etc.)
- ✅ Database state correct after creation
- ✅ Manual testing with cURL successful

---

## 11. Rollback Plan

If critical issues are discovered after deployment:

### Immediate Actions

1. Disable endpoint via feature flag (if available)
2. Or revert deployment to previous version
3. Notify stakeholders

### Investigation

1. Check Sentry for error logs
2. Review Supabase logs for database errors
3. Verify RLS policies are correct
4. Test locally with production data (if safe)

### Fix & Redeploy

1. Identify root cause
2. Implement fix
3. Test thoroughly
4. Deploy with monitoring
5. Verify fix in production

### Data Cleanup (if needed)

1. Identify affected recipes
2. Create cleanup script
3. Test script on staging
4. Execute on production with backup

---

**Document Version:** 1.0
**Last Updated:** 2025-10-26
**Author:** Claude Code (API Implementation Architect)
**Status:** ✅ Ready for Implementation
