# API Endpoint Implementation Plan: POST /api/shopping-lists/preview

## 1. Przegląd punktu końcowego

Endpoint generuje podgląd listy zakupów z zagregowanymi składnikami i kategoryzacją AI, **bez zapisywania** jej do bazy danych. Obsługuje dwa tryby pracy:

- **Mode 1 (Calendar)**: Generuje listę na podstawie wybranych posiłków z kalendarza tygodniowego
- **Mode 2 (Recipes)**: Generuje listę na podstawie bezpośrednio wybranych przepisów

**Główne funkcje:**

- Pobieranie składników z przepisów (z kalendarza lub bezpośrednio)
- Normalizacja nazw składników (trim, lowercase dla porównań)
- Agregacja identycznych składników (grupowanie po nazwie + jednostce, sumowanie ilości)
- Kategoryzacja AI przez OpenAI GPT-4o mini z mechanizmem retry
- Fallback do kategorii "Inne" w przypadku niepowodzenia AI
- Sortowanie według kategorii (stała kolejność) i alfabetycznie w ramach kategorii
- Zwrócenie podglądu z metadanymi (liczba przepisów, składników, status AI)

**Business value:**

- Użytkownik może zobaczyć podgląd przed zapisaniem
- Pozwala na weryfikację i ewentualną korektę w UI przed utworzeniem listy
- Optymalizacja kosztów AI - kategoryzacja tylko podczas podglądu, nie przy każdej edycji

---

## 2. Szczegóły żądania

### HTTP Method & Path

```
POST /api/shopping-lists/preview
```

### Headers

```
Authorization: Bearer <supabase_jwt_token>
Content-Type: application/json
```

### Request Body

**Mode 1: From Calendar**

```typescript
{
  source: "calendar",
  week_start_date: string, // YYYY-MM-DD format, Monday
  selections: [
    {
      day_of_week: number, // 1-7 (1 = Monday, 7 = Sunday)
      meal_types: MealType[] // Array of: "breakfast" | "second_breakfast" | "lunch" | "dinner"
    }
  ]
}
```

**Mode 2: From Recipes**

```typescript
{
  source: "recipes",
  recipe_ids: string[] // Array of UUID strings
}
```

### Parametry żądania

**Wymagane (wspólne):**

- `source`: String literal "calendar" lub "recipes"

**Wymagane dla Mode 1 (Calendar):**

- `week_start_date`: String w formacie YYYY-MM-DD, musi być poniedziałkiem
- `selections`: Array obiektów CalendarSelectionDto (minimum 1 element)
  - `day_of_week`: Integer 1-7
  - `meal_types`: Array niepustych MealType (minimum 1 element)

**Wymagane dla Mode 2 (Recipes):**

- `recipe_ids`: Array UUID strings (minimum 1 element, maksimum 20)

### Przykład żądania (Calendar)

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
  ]
}
```

### Przykład żądania (Recipes)

```json
{
  "source": "recipes",
  "recipe_ids": ["550e8400-e29b-41d4-a716-446655440000", "550e8400-e29b-41d4-a716-446655440001"]
}
```

---

## 3. Wykorzystywane typy

### DTOs (już zdefiniowane w src/types.ts)

**Request DTOs:**

```typescript
// Union type dla obu trybów
export type ShoppingListPreviewRequestDto =
  | ShoppingListPreviewCalendarRequestDto
  | ShoppingListPreviewRecipesRequestDto;

// Mode 1: Calendar
export interface ShoppingListPreviewCalendarRequestDto {
  source: "calendar";
  week_start_date: string;
  selections: CalendarSelectionDto[];
}

export interface CalendarSelectionDto {
  day_of_week: number;
  meal_types: MealType[];
}

// Mode 2: Recipes
export interface ShoppingListPreviewRecipesRequestDto {
  source: "recipes";
  recipe_ids: string[];
}
```

**Response DTOs:**

```typescript
export interface ShoppingListPreviewResponseDto {
  items: ShoppingListItemPreviewDto[];
  metadata: ShoppingListPreviewMetadataDto;
}

export interface ShoppingListItemPreviewDto {
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  category: IngredientCategory;
  sort_order: number;
}

export interface ShoppingListPreviewMetadataDto {
  source: "calendar" | "recipes";
  week_start_date?: string;
  total_recipes: number;
  total_items: number;
  ai_categorization_status: "success" | "failed";
  ai_error?: string;
  skipped_empty_meals?: number; // Tylko dla mode calendar
}
```

**Helper Types:**

```typescript
export type MealType = "breakfast" | "second_breakfast" | "lunch" | "dinner";

export type IngredientCategory =
  | "Nabiał" // Dairy
  | "Warzywa" // Vegetables
  | "Owoce" // Fruits
  | "Mięso" // Meat/Fish
  | "Pieczywo" // Bread/Pasta
  | "Przyprawy" // Spices
  | "Inne"; // Other (fallback)
```

### Typy wewnętrzne (do utworzenia w serwisie)

**Intermediate types (używane podczas przetwarzania):**

```typescript
// Składnik przed agregacją
interface RawIngredient {
  name: string;
  quantity: number | null;
  unit: string | null;
  recipe_id: string;
}

// Klucz agregacji
interface AggregationKey {
  normalizedName: string; // lowercase, trimmed
  unit: string | null; // null traktowane jako osobna grupa
}

// Zagregowany składnik (przed kategoryzacją)
interface AggregatedIngredient {
  originalName: string; // Oryginalna forma (case preserved)
  normalizedName: string; // Do porównań
  quantity: number | null;
  unit: string | null;
}

// Wynik kategoryzacji AI
interface CategorizationResult {
  success: boolean;
  categories: Map<string, IngredientCategory>; // normalizedName -> category
  error?: string;
}
```

---

## 4. Szczegóły odpowiedzi

### Success Response (200 OK)

**Headers:**

```
Content-Type: application/json
```

**Body:**

```typescript
{
  items: ShoppingListItemPreviewDto[],
  metadata: ShoppingListPreviewMetadataDto
}
```

**Przykład odpowiedzi (sukces AI):**

```json
{
  "items": [
    {
      "ingredient_name": "jajka",
      "quantity": 12,
      "unit": "szt",
      "category": "Nabiał",
      "sort_order": 0
    },
    {
      "ingredient_name": "parmesan",
      "quantity": 300,
      "unit": "g",
      "category": "Nabiał",
      "sort_order": 1
    },
    {
      "ingredient_name": "pomidory",
      "quantity": 500,
      "unit": "g",
      "category": "Warzywa",
      "sort_order": 0
    },
    {
      "ingredient_name": "boczek",
      "quantity": 600,
      "unit": "g",
      "category": "Mięso",
      "sort_order": 0
    },
    {
      "ingredient_name": "spaghetti",
      "quantity": 1500,
      "unit": "g",
      "category": "Pieczywo",
      "sort_order": 0
    },
    {
      "ingredient_name": "sól",
      "quantity": null,
      "unit": null,
      "category": "Przyprawy",
      "sort_order": 0
    },
    {
      "ingredient_name": "pieprz",
      "quantity": null,
      "unit": null,
      "category": "Przyprawy",
      "sort_order": 1
    }
  ],
  "metadata": {
    "source": "calendar",
    "week_start_date": "2025-01-20",
    "total_recipes": 5,
    "total_items": 7,
    "ai_categorization_status": "success",
    "skipped_empty_meals": 2
  }
}
```

### Partial Success Response (200 OK, AI failed)

W przypadku niepowodzenia AI, endpoint **nie zwraca błędu 422**, tylko zwraca 200 OK z:

- Wszystkimi składnikami w kategorii "Inne"
- metadata.ai_categorization_status = "failed"
- metadata.ai_error z opisem błędu

```json
{
  "items": [
    {
      "ingredient_name": "jajka",
      "quantity": 12,
      "unit": "szt",
      "category": "Inne",
      "sort_order": 0
    }
    // ... wszystkie z category: "Inne"
  ],
  "metadata": {
    "source": "calendar",
    "week_start_date": "2025-01-20",
    "total_recipes": 5,
    "total_items": 23,
    "ai_categorization_status": "failed",
    "ai_error": "OpenAI timeout after 2 retries"
  }
}
```

### Error Responses

**400 Bad Request - Validation Error**

```json
{
  "error": "Validation failed",
  "details": {
    "source": ["Expected 'calendar' or 'recipes'"],
    "week_start_date": ["Invalid date format, expected YYYY-MM-DD"]
  }
}
```

**400 Bad Request - No Recipes Selected**

```json
{
  "error": "No recipes selected or all selected meals are empty"
}
```

**401 Unauthorized - Not Authenticated**

```json
{
  "error": "Unauthorized"
}
```

**500 Internal Server Error**

```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

### Status Codes

| Code | Scenario                    | Response Body                                                          |
| ---- | --------------------------- | ---------------------------------------------------------------------- |
| 200  | Success (AI worked)         | Full response z kategoriami                                            |
| 200  | Partial success (AI failed) | Response z category="Inne", metadata.ai_categorization_status="failed" |
| 400  | Invalid input               | Validation error details                                               |
| 400  | No recipes found            | Error message                                                          |
| 401  | Not authenticated           | Error message                                                          |
| 500  | Unexpected error            | Generic error message                                                  |

---

## 5. Przepływ danych

### High-level Flow Diagram

```
┌─────────────────┐
│   Client POST   │
│   /preview      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ 1. Authentication Check │ ◄── Supabase Auth
│    (middleware)         │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 2. Input Validation     │ ◄── Zod Schema
│    (request body)       │
└────────┬────────────────┘
         │
         ▼
    ┌────┴────┐
    │ source? │
    └────┬────┘
         │
    ┌────┴────────────────────────────┐
    │                                  │
    ▼                                  ▼
┌────────────────┐            ┌──────────────────┐
│ Mode: Calendar │            │  Mode: Recipes   │
└───────┬────────┘            └────────┬─────────┘
        │                              │
        ▼                              ▼
┌────────────────────┐        ┌──────────────────┐
│ Fetch meal_plan    │        │ Validate UUIDs   │
│ for week + day +   │        │ Fetch recipes    │
│ meal_type combos   │        │ by IDs (with RLS)│
└───────┬────────────┘        └────────┬─────────┘
        │                              │
        └───────────┬──────────────────┘
                    │
                    ▼
        ┌─────────────────────────┐
        │ 3. Fetch Ingredients    │ ◄── Supabase Query
        │    (JOIN recipes)       │     (RLS ensures user_id)
        └────────┬────────────────┘
                 │
                 ▼
        ┌─────────────────────────┐
        │ 4. Normalize Names      │
        │    (trim, lowercase)    │
        └────────┬────────────────┘
                 │
                 ▼
        ┌─────────────────────────┐
        │ 5. Aggregate by         │
        │    (name + unit)        │
        │    Sum quantities       │
        └────────┬────────────────┘
                 │
                 ▼
        ┌─────────────────────────┐
        │ 6. AI Categorization    │ ◄── OpenAI API
        │    with Retry Logic     │     (10s timeout, 2 retries)
        │    Fallback: "Inne"     │
        └────────┬────────────────┘
                 │
                 ▼
        ┌─────────────────────────┐
        │ 7. Sort Results         │
        │    By category order    │
        │    Then alphabetically  │
        └────────┬────────────────┘
                 │
                 ▼
        ┌─────────────────────────┐
        │ 8. Build Response       │
        │    with Metadata        │
        └────────┬────────────────┘
                 │
                 ▼
        ┌─────────────────────────┐
        │   Return 200 OK         │
        └─────────────────────────┘
```

### Detailed Steps

#### Step 1: Authentication Check

```typescript
const {
  data: { user },
  error,
} = await supabase.auth.getUser();
if (error || !user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
```

#### Step 2: Input Validation

```typescript
// Zod schema (utworzyć w src/lib/validation/shopping-list.schema.ts)
const validation = shoppingListPreviewRequestSchema.safeParse(await request.json());
if (!validation.success) {
  return new Response(
    JSON.stringify({
      error: "Validation failed",
      details: validation.error.flatten().fieldErrors,
    }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}
```

#### Step 3: Fetch Ingredients (Mode-dependent)

**Mode 1: Calendar**

```typescript
// Pseudocode
const recipeIds = await fetchRecipeIdsFromMealPlan(
  user.id,
  week_start_date,
  selections // [{day_of_week, meal_types}]
);

if (recipeIds.length === 0) {
  return 400 "No recipes selected or all selected meals are empty";
}

const ingredients = await fetchIngredientsByRecipeIds(recipeIds);
```

**Mode 2: Recipes**

```typescript
// Weryfikacja że recipe_ids należą do użytkownika (RLS)
const ingredients = await fetchIngredientsByRecipeIds(recipe_ids);

if (ingredients.length === 0) {
  return 400 "No recipes found";
}
```

#### Step 4-5: Normalization & Aggregation

```typescript
// Service method: aggregateIngredients()
const aggregated = aggregateIngredients(rawIngredients);
// Returns: AggregatedIngredient[]
```

#### Step 6: AI Categorization

```typescript
// Service method: categorizeIngredientsWithRetry()
const categorizationResult = await categorizeIngredientsWithRetry(aggregated.map((i) => i.normalizedName));

// If failed: all items get category "Inne"
// Metadata includes: ai_categorization_status, ai_error
```

#### Step 7-8: Sort & Build Response

```typescript
const sortedItems = sortIngredientsByCategory(mergeCategories(aggregated, categorizationResult));

const metadata = buildMetadata(/* ... */);

return { items: sortedItems, metadata };
```

### Database Queries

**Query 1: Fetch recipe IDs from meal plan (Calendar mode)**

```sql
SELECT DISTINCT recipe_id
FROM meal_plan
WHERE user_id = $1
  AND week_start_date = $2
  AND (day_of_week, meal_type) IN (
    -- Dynamic list from selections
    (1, 'breakfast'), (1, 'lunch'), (2, 'breakfast'), ...
  );
```

**Query 2: Fetch ingredients by recipe IDs**

```sql
SELECT
  i.name,
  i.quantity,
  i.unit,
  i.recipe_id
FROM ingredients i
INNER JOIN recipes r ON r.id = i.recipe_id
WHERE r.user_id = $1
  AND i.recipe_id = ANY($2) -- Array of recipe UUIDs
ORDER BY i.recipe_id, i.sort_order;
```

**Query 3: Count recipes (for metadata)**

```sql
SELECT COUNT(DISTINCT recipe_id) FROM <subset>
```

### External API Calls

**OpenAI API (via categorizeIngredientsWithRetry)**

```typescript
// Request
POST https://api.openai.com/v1/chat/completions
{
  model: "gpt-4o-mini",
  temperature: 0,
  max_tokens: 500,
  messages: [
    {
      role: "system",
      content: "Kategoryzuj składniki do kategorii: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne. Zwróć JSON: {\"1\": \"kategoria\", \"2\": \"kategoria\", ...}"
    },
    {
      role: "user",
      content: "1. jajka\n2. parmesan\n3. pomidory\n..."
    }
  ]
}

// Response (expected)
{
  "choices": [{
    "message": {
      "content": "{\"1\":\"Nabiał\",\"2\":\"Nabiał\",\"3\":\"Warzywa\",...}"
    }
  }]
}

// Retry logic:
// - Attempt 1: 10s timeout
// - Wait 1s
// - Attempt 2: 10s timeout
// - Wait 2s
// - Attempt 3: 10s timeout
// - If all fail: fallback to "Inne" for all
```

---

## 6. Względy bezpieczeństwa

### Authentication

- **Wymagane**: Użytkownik musi być zalogowany (JWT token w Authorization header)
- **Implementacja**: Middleware Astro sprawdza `supabase.auth.getUser()`
- **Failure**: 401 Unauthorized jeśli token nieważny lub wygasł

### Authorization (RLS)

- **Row Level Security**: Zapewnia że użytkownik widzi tylko własne przepisy
- **Implementacja**: RLS policies na tabelach `recipes`, `meal_plan`, `ingredients`

  ```sql
  -- Policy na recipes
  CREATE POLICY "Users can view own recipes"
  ON recipes FOR SELECT
  USING (user_id = auth.uid());

  -- Policy na ingredients (via recipe ownership)
  CREATE POLICY "Users can view ingredients of own recipes"
  ON ingredients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = ingredients.recipe_id
        AND recipes.user_id = auth.uid()
    )
  );
  ```

- **Defense**: Nawet jeśli użytkownik spróbuje wysłać cudzę recipe_ids, RLS zwróci 0 wyników

### Input Validation & Sanitization

**Zod Schema (src/lib/validation/shopping-list.schema.ts)**

```typescript
const calendarSelectionSchema = z.object({
  day_of_week: z.number().int().min(1).max(7),
  meal_types: z
    .array(z.enum(["breakfast", "second_breakfast", "lunch", "dinner"]))
    .min(1)
    .max(4),
});

const shoppingListPreviewCalendarRequestSchema = z.object({
  source: z.literal("calendar"),
  week_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  selections: z.array(calendarSelectionSchema).min(1).max(28), // 7 days × 4 meals
});

const shoppingListPreviewRecipesRequestSchema = z.object({
  source: z.literal("recipes"),
  recipe_ids: z.array(z.string().uuid()).min(1).max(20),
});

export const shoppingListPreviewRequestSchema = z.discriminatedUnion("source", [
  shoppingListPreviewCalendarRequestSchema,
  shoppingListPreviewRecipesRequestSchema,
]);
```

**Sanitization:**

- Trim whitespace z ingredient names
- Lowercase dla normalizacji (tylko do agregacji, oryginał zachowany)
- Prevent SQL injection: używamy parametryzowanych zapytań Supabase
- Prevent XSS: React automatic escaping w UI

### Rate Limiting

**OpenAI API:**

- Implementacja w ai-categorization.service.ts
- Max 100 składników per request (walidacja w serwisie)
- Timeout 10s per attempt
- Max 3 attempts (exponential backoff: 1s, 2s)
- Fallback do "Inne" chroni przed total failure

**Application-level (future):**

- Rozważyć rate limiting na endpoint (np. 10 requests/min per user)
- Implementacja przez Vercel Edge Middleware lub Supabase Functions

### Secrets Management

**Environment Variables:**

```
OPENAI_API_KEY=sk-... (NEVER exposed to client)
SUPABASE_URL=https://...
SUPABASE_KEY=eyJ... (anon key, OK in client)
SUPABASE_SERVICE_KEY=eyJ... (NEVER exposed to client)
```

**Astro configuration:**

- API calls do OpenAI wykonywane server-side (prerender=false)
- `import.meta.env.OPENAI_API_KEY` dostępne tylko w server context
- Vercel encrypts env variables

### Data Privacy (GDPR)

- **User data isolation**: RLS ensures separation
- **No logging of ingredient names**: Error logs nie zawierają PII
- **OpenAI policy**: API calls nie są używane do treningu (zgodnie z OpenAI API Terms)
- **Data retention**: Preview nie zapisuje danych (stateless)

---

## 7. Obsługa błędów

### Error Scenarios

| Scenario                             | HTTP Status | Response                                                                                             | Handling                            |
| ------------------------------------ | ----------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------- |
| User not authenticated               | 401         | `{ error: "Unauthorized" }`                                                                          | Redirect to login                   |
| Invalid JSON body                    | 400         | `{ error: "Invalid JSON" }`                                                                          | Return early with error             |
| Validation failure (Zod)             | 400         | `{ error: "Validation failed", details: {...} }`                                                     | Return validation errors            |
| Invalid source field                 | 400         | `{ error: "Validation failed", details: { source: [...] } }`                                         | Zod discriminated union             |
| Empty recipe_ids array               | 400         | `{ error: "Validation failed", details: { recipe_ids: ["Array must contain at least 1 element"] } }` | Zod min(1)                          |
| No recipes found (RLS)               | 400         | `{ error: "No recipes selected or all selected meals are empty" }`                                   | Check after DB query                |
| Invalid week_start_date (not Monday) | 400         | `{ error: "Validation failed", details: { week_start_date: ["Must be a Monday"] } }`                 | Zod custom validation               |
| AI timeout (all retries)             | 200         | Response with category="Inne", metadata.ai_categorization_status="failed"                            | Fallback, log error to Sentry       |
| OpenAI API error (quota, 5xx)        | 200         | Same as AI timeout                                                                                   | Fallback, log error                 |
| Database connection error            | 500         | `{ error: "Internal server error" }`                                                                 | Log to Sentry, return generic error |
| Unexpected error                     | 500         | `{ error: "Internal server error" }`                                                                 | Catch-all try-catch, log to Sentry  |

### Error Handling Strategy

**1. Early Returns (Guard Clauses)**

```typescript
// Auth check
if (error || !user) return 401;

// Validation
if (!validation.success) return 400;

// Empty results
if (recipeIds.length === 0) return 400;
```

**2. Try-Catch Blocks**

```typescript
export async function POST(context) {
  try {
    // Main logic
  } catch (error) {
    console.error("[POST /api/shopping-lists/preview] Unexpected error:", error);

    // Log to Sentry (if configured)
    if (import.meta.env.SENTRY_DSN) {
      Sentry.captureException(error);
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
```

**3. AI Fallback (Graceful Degradation)**

```typescript
// w ai-categorization.service.ts
async function categorizeIngredientsWithRetry(ingredients: string[]): Promise<CategorizationResult> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await callOpenAI(ingredients, { timeout: 10000 });
      return { success: true, categories: result };
    } catch (error) {
      if (attempt < 3) {
        await sleep(Math.pow(2, attempt - 1) * 1000); // 1s, 2s
        continue;
      }
      // Final attempt failed - fallback
      console.error("[AI Categorization] All retries failed:", error);
      return {
        success: false,
        categories: new Map(ingredients.map((i) => [i, "Inne"])),
        error: error.message,
      };
    }
  }
}
```

**4. User-Friendly Messages**

```typescript
// NIE:
{ error: "ECONNREFUSED" }

// TAK:
{ error: "No recipes selected or all selected meals are empty" }
{ error: "Validation failed", details: { ... } }
```

**5. Logging Strategy**

**Console Logs (development):**

```typescript
console.log("[Preview] Fetching ingredients for recipes:", recipeIds);
console.log("[Preview] Aggregated", aggregated.length, "unique ingredients");
```

**Sentry (production errors only):**

```typescript
// Only log unexpected errors, NOT business logic errors
if (unexpectedError) {
  Sentry.captureException(error, {
    tags: { endpoint: "POST /api/shopping-lists/preview" },
    extra: { user_id: user.id, source: requestBody.source },
  });
}
```

**Nie logować:**

- Validation errors (expected)
- 401 Unauthorized (expected)
- User-initiated errors (np. no recipes selected)

---

## 8. Wydajność

### Performance Considerations

**1. Database Queries**

**Bottleneck**: N+1 problem przy pobieraniu ingredients

- **Problem**: Zapytanie dla każdego recipe_id osobno
- **Solution**: Użyć JOIN lub `recipe_id = ANY($1)` dla batch fetch
- **Expected latency**: <100ms dla 20 recipes × 50 ingredients

**Optimization**:

```sql
-- ✅ GOOD: Single query
SELECT i.* FROM ingredients i
WHERE recipe_id = ANY($1);

-- ❌ BAD: N queries
SELECT * FROM ingredients WHERE recipe_id = $1; -- × N times
```

**Indexes (already exist):**

```sql
CREATE INDEX idx_ingredients_recipe_id ON ingredients(recipe_id);
CREATE INDEX idx_meal_plan_user_week ON meal_plan(user_id, week_start_date);
```

**2. AI Categorization**

**Bottleneck**: OpenAI API call (10s timeout)

- **Expected latency**: 2-5s dla 50 składników
- **Worst case**: 30s (3 attempts × 10s)
- **Mitigation**:
  - Batch all ingredients w jednym request (nie N requests)
  - Max 100 składników per request (limit w serwisie)
  - Graceful degradation (fallback do "Inne")

**Cost optimization**:

```typescript
// ✅ GOOD: 1 API call dla wszystkich składników
categorizeIngredients(["jajka", "parmesan", "pomidory", ...]); // 1 request

// ❌ BAD: N API calls
for (const ingredient of ingredients) {
  categorizeIngredient(ingredient); // N requests
}
```

**3. Aggregation Logic**

**Complexity**: O(n log n) gdzie n = liczba składników

- **Normalization**: O(n) - trim + lowercase
- **Grouping**: O(n) - Map lookups
- **Sorting**: O(n log n) - category order + alphabetical
- **Expected**: <10ms dla 100 składników

**4. Memory Usage**

**Estimate dla 20 recipes × 50 ingredients = 1000 items:**

- Raw ingredients: ~100 KB (JSON)
- Aggregated: ~50 KB (deduplicated)
- OpenAI response: ~20 KB (JSON mapping)
- **Total**: <200 KB per request (negligible)

**5. Caching (Future Optimization)**

**Not implemented in MVP, but consider for scale:**

```typescript
// Redis cache dla common ingredients
const categoryCache = await redis.get(`ingredient:category:${normalizedName}`);
if (categoryCache) {
  return categoryCache; // Skip AI call
}

// Cache dla 7 days
await redis.setex(`ingredient:category:${normalizedName}`, 604800, category);
```

**Cache hit rate estimate**: 30-50% (common ingredients like "jajka", "mleko")

### Performance Targets (MVP)

| Metric               | Target   | Notes                                |
| -------------------- | -------- | ------------------------------------ |
| **p50 latency**      | <3s      | Typical case (AI success, ~20 items) |
| **p95 latency**      | <8s      | AI retry scenario                    |
| **p99 latency**      | <30s     | Worst case (3 AI retries)            |
| **Throughput**       | 10 req/s | Limited by OpenAI API rate limits    |
| **Concurrent users** | 100      | Supabase free tier: 50 req/s         |

### Monitoring

**Metrics to track (Sentry Performance):**

- Average response time
- AI categorization success rate
- AI retry rate
- Database query duration
- Error rate by type (401, 400, 500)

**Alerts:**

- p95 latency >10s
- AI failure rate >10%
- Error rate >5%

---

## 9. Etapy wdrożenia

### Krok 1: Utworzenie Zod Schema (Validation)

**File**: `src/lib/validation/shopping-list.schema.ts`

**Tasks:**

1. Zaimportować Zod i typy z `src/types.ts`
2. Utworzyć `calendarSelectionSchema`:
   - `day_of_week`: integer 1-7
   - `meal_types`: array enum MealType, min 1, max 4
3. Utworzyć `shoppingListPreviewCalendarRequestSchema`:
   - `source`: literal "calendar"
   - `week_start_date`: string regex `/^\d{4}-\d{2}-\d{2}$/`
   - Custom validation: week_start_date musi być poniedziałkiem
   - `selections`: array calendarSelectionSchema, min 1, max 28
4. Utworzyć `shoppingListPreviewRecipesRequestSchema`:
   - `source`: literal "recipes"
   - `recipe_ids`: array UUID string, min 1, max 20
5. Eksportować union type `shoppingListPreviewRequestSchema` z discriminated union na `source`

**Estimated time**: 30 minut

---

### Krok 2: Utworzenie AI Categorization Service

**File**: `src/lib/services/ai-categorization.service.ts`

**Tasks:**

1. Utworzyć interface `CategorizationResult`:
   ```typescript
   interface CategorizationResult {
     success: boolean;
     categories: Map<string, IngredientCategory>;
     error?: string;
   }
   ```
2. Implementować `categorizeIngredientsWithRetry(ingredients: string[]): Promise<CategorizationResult>`
   - Walidacja: max 100 ingredients
   - OpenAI config: model "gpt-4o-mini", temp 0, max_tokens 500
   - System prompt: "Kategoryzuj składniki do kategorii: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne. Zwróć JSON: {\"1\": \"kategoria\", ...}"
   - User prompt: numerowana lista składników
   - Timeout: 10s
   - Retry logic: 3 attempts z exponential backoff (1s, 2s)
   - Parse response JSON
   - Validate categories (tylko dozwolone wartości)
   - Fallback: wszystkie → "Inne" jeśli failure
3. Helper function `sleep(ms: number): Promise<void>`
4. Error logging do console (Sentry opcjonalnie)

**Dependencies**:

```typescript
import OpenAI from "openai";
import type { IngredientCategory } from "@/types";
```

**Estimated time**: 2 godziny

---

### Krok 3: Utworzenie Shopping List Preview Service

**File**: `src/lib/services/shopping-list-preview.service.ts`

**Tasks:**

1. Importy: Supabase client type, DTOs, AI service
2. Interface `RawIngredient`:
   ```typescript
   interface RawIngredient {
     name: string;
     quantity: number | null;
     unit: string | null;
     recipe_id: string;
   }
   ```
3. Interface `AggregatedIngredient`:
   ```typescript
   interface AggregatedIngredient {
     originalName: string;
     normalizedName: string;
     quantity: number | null;
     unit: string | null;
   }
   ```
4. Implementować `fetchRecipeIdsFromCalendar()`:
   - Parametry: supabase, user_id, week_start_date, selections
   - Query: meal_plan table z warunkiem (day_of_week, meal_type) IN (...)
   - Return: recipe_ids[]
5. Implementować `fetchIngredientsByRecipeIds()`:
   - Parametry: supabase, user_id, recipe_ids
   - Query: ingredients JOIN recipes WHERE recipe_id = ANY($1) AND user_id = $2
   - Return: RawIngredient[]
6. Implementować `aggregateIngredients()`:
   - Parametry: rawIngredients
   - Logic:
     - Normalizacja: trim + lowercase (dla klucza)
     - Grupowanie: Map<normalizedName+unit, AggregatedIngredient>
     - Agregacja quantity: sumowanie jeśli typeof number, null jeśli mixed
   - Return: AggregatedIngredient[]
7. Implementować `sortIngredientsByCategory()`:
   - Parametry: items z category
   - Logic:
     - Stała kolejność kategorii: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne
     - Sort alfabetycznie w ramach kategorii
     - Assign sort_order w ramach kategorii
   - Return: ShoppingListItemPreviewDto[]
8. Implementować główną funkcję `generateShoppingListPreview()`:
   - Parametry: supabase, user_id, request (ShoppingListPreviewRequestDto)
   - Logic:
     - If source="calendar": fetchRecipeIdsFromCalendar()
     - If source="recipes": use request.recipe_ids
     - fetchIngredientsByRecipeIds()
     - Check if empty → throw error "No recipes found"
     - aggregateIngredients()
     - categorizeIngredientsWithRetry()
     - sortIngredientsByCategory()
     - Build metadata
   - Return: ShoppingListPreviewResponseDto

**Estimated time**: 3 godziny

---

### Krok 4: Utworzenie API Endpoint

**File**: `src/pages/api/shopping-lists/preview.ts`

**Tasks:**

1. Dodać `export const prerender = false;`
2. Importy:
   - Supabase client z `context.locals.supabase`
   - Validation schema
   - Service funkcja `generateShoppingListPreview`
   - Types
3. Implementować `POST()` handler:

   ```typescript
   export async function POST(context: APIContext) {
     try {
       // Step 1: Auth check
       const {
         data: { user },
         error: authError,
       } = await context.locals.supabase.auth.getUser();
       if (authError || !user) {
         return new Response(JSON.stringify({ error: "Unauthorized" }), {
           status: 401,
           headers: { "Content-Type": "application/json" },
         });
       }

       // Step 2: Parse & validate request body
       const body = await context.request.json();
       const validation = shoppingListPreviewRequestSchema.safeParse(body);
       if (!validation.success) {
         return new Response(
           JSON.stringify({
             error: "Validation failed",
             details: validation.error.flatten().fieldErrors,
           }),
           { status: 400, headers: { "Content-Type": "application/json" } }
         );
       }

       // Step 3: Generate preview
       const preview = await generateShoppingListPreview(context.locals.supabase, user.id, validation.data);

       // Step 4: Return 200 OK
       return new Response(JSON.stringify(preview), { status: 200, headers: { "Content-Type": "application/json" } });
     } catch (error) {
       // Business logic errors (thrown from service)
       if (error.message === "No recipes found") {
         return new Response(JSON.stringify({ error: "No recipes selected or all selected meals are empty" }), {
           status: 400,
           headers: { "Content-Type": "application/json" },
         });
       }

       // Unexpected errors
       console.error("[POST /api/shopping-lists/preview]", error);
       return new Response(JSON.stringify({ error: "Internal server error" }), {
         status: 500,
         headers: { "Content-Type": "application/json" },
       });
     }
   }
   ```

**Estimated time**: 1 godzina

---

### Krok 5: Testing (Manual & Unit Tests)

**5.1 Unit Tests dla Service**

**File**: `src/lib/services/__tests__/shopping-list-preview.service.test.ts`

**Test cases**:

1. `aggregateIngredients()`:
   - Identyczne składniki (same name + unit) → sumowanie quantity
   - Różne units → osobne pozycje
   - Null quantity → pozostaje null
   - Mixed null + number → null (nie można sumować)
   - Case sensitivity → normalizacja
2. `sortIngredientsByCategory()`:
   - Kategorie w stałej kolejności
   - Alfabetycznie w ramach kategorii
   - sort_order przypisany poprawnie

**5.2 Manual Testing z Postman/Bruno**

**Test scenarios**:

1. **Happy path - Calendar mode**
   - Request: valid calendar selections
   - Expected: 200 OK, items z kategoriami, metadata.ai_categorization_status="success"

2. **Happy path - Recipes mode**
   - Request: valid recipe_ids (własne)
   - Expected: 200 OK, items z kategoriami

3. **Auth failure**
   - Request: brak Authorization header
   - Expected: 401 Unauthorized

4. **Validation errors**
   - Request: invalid source value
   - Expected: 400 Bad Request z details

5. **Empty results**
   - Request: calendar selections bez assigned recipes
   - Expected: 400 "No recipes selected..."

6. **AI failure simulation**
   - Mock OpenAI timeout
   - Expected: 200 OK, wszystkie items z category="Inne", metadata.ai_categorization_status="failed"

7. **RLS protection**
   - Request: recipe_ids należące do innego usera
   - Expected: 400 "No recipes found" (RLS odfiltruje)

**Estimated time**: 2 godziny

---

### Krok 6: Documentation & Code Review

**Tasks**:

1. Dodać JSDoc comments do wszystkich exported functions
2. Dodać przykłady usage w komentarzach
3. Zaktualizować README.md (jeśli istnieje) z nowym endpointem
4. Code review checklist:
   - ✅ RLS policies działają poprawnie
   - ✅ Validation comprehensive
   - ✅ Error handling graceful
   - ✅ No API keys in client code
   - ✅ Performance targets met
   - ✅ TypeScript strict mode pass
   - ✅ Linter pass (`npm run lint`)

**Estimated time**: 1 godzina

---

### Krok 7: Deployment & Monitoring

**Tasks**:

1. Merge do branch głównego (przez PR)
2. Deploy na Vercel (automatic via GitHub Actions)
3. Verify environment variables:
   - `OPENAI_API_KEY` set in Vercel dashboard
   - `SUPABASE_URL` i `SUPABASE_KEY` set
4. Smoke test na produkcji (1-2 requesty)
5. Monitor Sentry dla błędów (first 24h)
6. Check performance metrics w Vercel Analytics

**Estimated time**: 30 minut

---

## 10. Total Estimated Time

| Krok               | Estimated Time |
| ------------------ | -------------- |
| 1. Zod Schema      | 30 min         |
| 2. AI Service      | 2h             |
| 3. Preview Service | 3h             |
| 4. API Endpoint    | 1h             |
| 5. Testing         | 2h             |
| 6. Documentation   | 1h             |
| 7. Deployment      | 30 min         |
| **TOTAL**          | **10 hours**   |

**Buffer dla nieprzewidzianych problemów**: +2h
**Final estimate**: **12 hours** (1.5 dnia dla 1 developera)

---

## 11. Checklist przed wdrożeniem

**Pre-implementation:**

- [ ] RLS policies na recipes, ingredients, meal_plan zweryfikowane
- [ ] OpenAI API key dodany do Vercel environment variables
- [ ] Rate limits OpenAI sprawdzone (tier/quota)

**During implementation:**

- [ ] Zod schema validates all edge cases
- [ ] AI retry logic implementowany poprawnie
- [ ] Aggregation logic obsługuje null quantities
- [ ] Sort order poprawny (kategorie + alphabetical)
- [ ] Error messages user-friendly
- [ ] Logging nie zawiera PII (ingredient names OK, ale nie user_id w public logs)

**Post-implementation:**

- [ ] Manual tests pass (wszystkie scenariusze)
- [ ] Linter pass (`npm run lint`)
- [ ] TypeScript compile pass (`npm run build`)
- [ ] Performance targets met (p95 <8s)
- [ ] Sentry configured dla error tracking
- [ ] Documentation complete (JSDoc + README)

---

## 12. Potential Risks & Mitigations

| Risk                             | Impact       | Probability | Mitigation                                          |
| -------------------------------- | ------------ | ----------- | --------------------------------------------------- |
| OpenAI quota exceeded            | High         | Low         | Fallback do "Inne", monitor usage                   |
| OpenAI timeout frequent          | Medium       | Medium      | 3 retries + exponential backoff                     |
| RLS misconfiguration (data leak) | **CRITICAL** | Low         | Code review + penetration testing                   |
| Large ingredient lists (>100)    | Medium       | Low         | Validation cap at 100, batch into chunks if needed  |
| AI returns invalid categories    | Low          | Low         | Validate categories against allowed list            |
| Database query slow (>1s)        | Medium       | Low         | Indexes already exist, monitor query performance    |
| Memory issue (large lists)       | Low          | Very Low    | Pagination future consideration, 1000 items = 200KB |

---

## 13. Future Enhancements (Post-MVP)

**Not in scope for initial implementation, but consider:**

1. **Caching**: Redis cache dla common ingredients (e.g., "jajka" → "Nabiał")
   - Cache hit rate: 30-50%
   - Reduce OpenAI costs by 30%

2. **Batch optimization**: Jeśli user generuje wiele list, batch API calls

3. **Progressive enhancement**: Show instant preview z "Inne", aktualizuj async po AI response

4. **User feedback loop**: Pozwól user korygować kategorie → trenuj custom model

5. **Analytics**: Track najpopularniejsze składniki → pre-categorize w bazie

6. **Webhook dla długich requestów**: Jeśli >50 składników, async processing + webhook notification

---

**Koniec dokumentu**

Ten plan jest gotowy do implementacji. Każdy krok jest precyzyjnie opisany z kodem przykładowym, typami, queries, i checklistami. Zespół developerski powinien być w stanie zaimplementować endpoint w ~12 godzin z tym planem.
