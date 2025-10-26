# API Endpoint Implementation Plan: GET /api/recipes

**Version:** 1.0
**Date:** 2025-10-25
**Endpoint:** `GET /api/recipes`
**Status:** Ready for Implementation

---

## 1. Przegląd punktu końcowego

### Cel
Pobranie paginowanej i filtrowanej listy przepisów kulinarnych należących do zalogowanego użytkownika. Endpoint umożliwia wyszukiwanie po nazwie przepisu oraz sortowanie według różnych kryteriów.

### Funkcjonalność
- **Filtrowanie**: Case-insensitive wyszukiwanie substring w nazwie przepisu
- **Sortowanie**: Po nazwie lub dacie utworzenia (rosnąco/malejąco)
- **Paginacja**: Limit/offset z metadata (total, has_more)
- **Agregacja**: Liczba składników dla każdego przepisu
- **Bezpieczeństwo**: Automatyczna izolacja danych przez RLS policies

### Business Context
Ten endpoint służy jako główny widok listy przepisów użytkownika, wykorzystywany w:
- Stronie głównej z listą przepisów
- Wyszukiwarce przepisów
- Wybieraniu przepisów do kalendarza
- Wybieraniu przepisów do generowania listy zakupów

---

## 2. Szczegóły żądania

### Metoda HTTP
```
GET /api/recipes
```

### Struktura URL
```
/api/recipes?search={query}&sort={order}&limit={number}&offset={number}
```

### Request Headers
```http
Authorization: Bearer <supabase_jwt_token>  (REQUIRED)
```

### Query Parameters

| Parameter | Type | Required | Default | Validation | Description |
|-----------|------|----------|---------|------------|-------------|
| `search` | string | No | - | max 100 characters | Case-insensitive substring search on recipe name |
| `sort` | string | No | `created_desc` | enum: `name_asc`, `name_desc`, `created_asc`, `created_desc` | Sort order |
| `limit` | integer | No | `20` | min: 1, max: 100 | Number of results per page |
| `offset` | integer | No | `0` | min: 0 | Pagination offset |

### Przykłady żądań

**Podstawowe zapytanie:**
```http
GET /api/recipes
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Wyszukiwanie z sortowaniem:**
```http
GET /api/recipes?search=pasta&sort=name_asc&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Paginacja - druga strona:**
```http
GET /api/recipes?limit=20&offset=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## 3. Wykorzystywane typy

### DTOs (z `src/types.ts`)

```typescript
/**
 * DTO dla pojedynczego przepisu na liście
 */
export type RecipeListItemDto = Pick<
  Recipe,
  "id" | "name" | "instructions" | "created_at" | "updated_at"
> & {
  ingredient_count: number;
};

/**
 * Metadata paginacji
 */
export interface Pagination {
  total: number;        // Całkowita liczba wyników
  limit: number;        // Wyników na stronę
  offset: number;       // Obecne przesunięcie
  has_more: boolean;    // Czy są kolejne strony
}

/**
 * Wrapper dla odpowiedzi z paginacją
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}
```

### Validation Schema (nowy - `src/lib/validation/recipes.schema.ts`)

```typescript
import { z } from "zod";

/**
 * Schema walidacji query params dla GET /api/recipes
 */
export const getRecipesQuerySchema = z.object({
  search: z.string().max(100).optional(),
  sort: z
    .enum(["name_asc", "name_desc", "created_asc", "created_desc"])
    .default("created_desc"),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type GetRecipesQuery = z.infer<typeof getRecipesQuerySchema>;
```

---

## 4. Szczegóły odpowiedzi

### Response 200 OK

**Content-Type:** `application/json`

**Body:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Spaghetti Carbonara",
      "instructions": "Cook pasta, mix with eggs and bacon...",
      "ingredient_count": 8,
      "created_at": "2025-01-20T10:30:00Z",
      "updated_at": "2025-01-20T10:30:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Scrambled Eggs",
      "instructions": "Beat eggs, cook in butter...",
      "ingredient_count": 3,
      "created_at": "2025-01-19T08:15:00Z",
      "updated_at": "2025-01-19T08:15:00Z"
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

### Response 400 Bad Request

**Przypadek:** Nieprawidłowe query parameters

```json
{
  "error": "ValidationError",
  "message": "Invalid request data",
  "details": {
    "limit": ["Number must be less than or equal to 100"],
    "sort": ["Invalid enum value. Expected 'name_asc' | 'name_desc' | 'created_asc' | 'created_desc'"]
  }
}
```

### Response 401 Unauthorized

**Przypadek:** Brak lub nieprawidłowy token autoryzacji

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### Response 500 Internal Server Error

**Przypadek:** Nieoczekiwany błąd serwera

```json
{
  "error": "InternalServerError",
  "message": "An unexpected error occurred. Our team has been notified.",
  "incident_id": "uuid"
}
```

---

## 5. Przepływ danych

### Diagram przepływu

```
Client
  ↓ GET /api/recipes?search=pasta&limit=10
  ↓ Authorization: Bearer <token>

Astro API Route (src/pages/api/recipes/index.ts)
  ↓ 1. Extract JWT from Authorization header
  ↓ 2. Validate token via supabase.auth.getUser()
  ↓ 3. Validate query params (Zod schema)
  ↓ 4. Call service layer

Recipes Service (src/lib/services/recipes.service.ts)
  ↓ 5. Build Supabase query with filters
  ↓ 6. Execute COUNT query for total
  ↓ 7. Execute SELECT query with JOIN to count ingredients
  ↓ 8. Map results to RecipeListItemDto[]
  ↓ 9. Build pagination metadata

Supabase Database
  ↓ 10. Apply RLS policies (auth.uid() = user_id)
  ↓ 11. Execute SQL query with filters
  ↓ 12. Return filtered results

Response
  ↓ 13. Return PaginatedResponse<RecipeListItemDto>
  ↓ 14. Status 200 OK
```

### Szczegóły przepływu

**Krok 1-2: Autoryzacja**
- Middleware ekstraktuje JWT z header `Authorization: Bearer <token>`
- Wywołanie `supabase.auth.getUser()` weryfikuje token
- Jeśli błąd → return 401 Unauthorized

**Krok 3: Walidacja**
- `getRecipesQuerySchema.safeParse(request.url.searchParams)`
- Jeśli validation error → return 400 Bad Request z details

**Krok 4-5: Service Layer**
- Wywołanie `recipesService.getRecipes(supabase, query)`
- Service buduje query z:
  - `.select()` z agregacją COUNT ingredients
  - `.ilike()` dla search (case-insensitive LIKE)
  - `.order()` dla sortowania
  - `.range()` dla paginacji limit/offset

**Krok 6-7: Database Queries**

**Query 1 - Total Count:**
```sql
SELECT COUNT(*)
FROM recipes
WHERE user_id = auth.uid()
  AND (name ILIKE '%pasta%' OR 'pasta' IS NULL);
```

**Query 2 - Data with Ingredient Count:**
```sql
SELECT
  r.id,
  r.name,
  r.instructions,
  r.created_at,
  r.updated_at,
  COUNT(i.id) AS ingredient_count
FROM recipes r
LEFT JOIN ingredients i ON r.id = i.recipe_id
WHERE r.user_id = auth.uid()
  AND (r.name ILIKE '%pasta%' OR 'pasta' IS NULL)
GROUP BY r.id, r.name, r.instructions, r.created_at, r.updated_at
ORDER BY r.created_at DESC
LIMIT 20 OFFSET 0;
```

**Krok 8-9: Response Building**
- Map database results to DTOs
- Calculate `has_more = offset + limit < total`
- Build `PaginatedResponse` object

**Krok 10-12: RLS Enforcement**
- PostgreSQL RLS policy automatycznie filtruje:
  ```sql
  CREATE POLICY recipes_select ON recipes
    FOR SELECT
    USING (auth.uid() = user_id);
  ```
- Użytkownik widzi TYLKO swoje przepisy (bezpieczeństwo na poziomie bazy)

---

## 6. Względy bezpieczeństwa

### 6.1 Uwierzytelnianie (Authentication)

**Mechanizm:** Supabase Auth z JWT tokens

**Implementacja:**
```typescript
// src/pages/api/recipes/index.ts
const { data: { user }, error } = await context.locals.supabase.auth.getUser();

if (error || !user) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "Authentication required"
    }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
```

**Zabezpieczenia:**
- JWT signature verification (automatic przez Supabase)
- Token expiration check (1 hour default)
- httpOnly cookies (immune to XSS)

### 6.2 Autoryzacja (Authorization)

**Mechanizm:** Row Level Security (RLS) w PostgreSQL

**RLS Policy:**
```sql
CREATE POLICY recipes_select ON recipes
  FOR SELECT
  USING (auth.uid() = user_id);
```

**Korzyści:**
- Izolacja danych na poziomie bazy (nie można ominąć przez API)
- Brak potrzeby ręcznego filtrowania w kodzie aplikacji
- GDPR compliant (perfekcyjna separacja danych)

### 6.3 Walidacja danych wejściowych

**Defense in Depth:**

| Warstwa | Walidacja | Cel |
|---------|-----------|-----|
| Frontend | React form validation | User experience |
| API | Zod schemas | Security boundary |
| Database | CHECK constraints | Last line of defense |

**SQL Injection Prevention:**
- Supabase używa parameterized queries (prepared statements)
- Wszystkie input values są escapowane automatycznie
- Brak string concatenation w SQL queries

**Example - Safe Query:**
```typescript
// ✅ SAFE - parameterized
const { data } = await supabase
  .from('recipes')
  .select('*')
  .ilike('name', `%${searchTerm}%`);  // Supabase escapes automatically

// ❌ UNSAFE - raw SQL (NEVER DO THIS)
// const { data } = await supabase.rpc('raw_sql', {
//   sql: `SELECT * FROM recipes WHERE name LIKE '%${searchTerm}%'`
// });
```

### 6.4 Rate Limiting

**Supabase Default Limits:**
- Free tier: 50 requests/second
- Pro tier: 200 requests/second

**Future Enhancement (Post-MVP):**
- Per-user rate limiting (10 req/min for list endpoints)
- Implementacja przez middleware z Redis cache

### 6.5 Information Disclosure Prevention

**Zabezpieczenia:**
- Error responses NIE zawierają stack traces w production
- Database errors są logowane do Sentry, ale return generic message
- 404 vs 403 distinction (zawsze 404 jeśli resource nie należy do usera)

**Example:**
```typescript
// ✅ GOOD - generic error
return new Response(
  JSON.stringify({
    error: "InternalServerError",
    message: "An unexpected error occurred. Our team has been notified.",
    incident_id: sentryEventId
  }),
  { status: 500 }
);

// ❌ BAD - leaks implementation details
// return new Response(
//   JSON.stringify({
//     error: "PostgreSQL connection timeout on recipes table",
//     stack: error.stack
//   }),
//   { status: 500 }
// );
```

---

## 7. Obsługa błędów

### 7.1 Klasyfikacja błędów

| Status Code | Error Type | Triggered By | User Action |
|-------------|------------|--------------|-------------|
| 400 | ValidationError | Invalid query params | Fix request parameters |
| 401 | Unauthorized | Missing/invalid token | Login again |
| 429 | TooManyRequests | Rate limit exceeded | Wait and retry |
| 500 | InternalServerError | Database/unexpected error | Contact support |
| 503 | ServiceUnavailable | Database down | Retry later |

### 7.2 Error Response Format

**Standard Format:**
```json
{
  "error": "ErrorType",
  "message": "Human-readable description",
  "details": {
    "field_name": ["Error detail 1", "Error detail 2"]
  }
}
```

### 7.3 Szczegółowe scenariusze błędów

#### Scenario 1: Invalid Query Parameters

**Input:**
```http
GET /api/recipes?limit=500&sort=invalid_sort
```

**Response:** 400 Bad Request
```json
{
  "error": "ValidationError",
  "message": "Invalid request data",
  "details": {
    "limit": ["Number must be less than or equal to 100"],
    "sort": ["Invalid enum value. Expected 'name_asc' | 'name_desc' | 'created_asc' | 'created_desc', received 'invalid_sort'"]
  }
}
```

#### Scenario 2: Missing Authorization

**Input:**
```http
GET /api/recipes
// No Authorization header
```

**Response:** 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

#### Scenario 3: Expired Token

**Input:**
```http
GET /api/recipes
Authorization: Bearer <expired_token>
```

**Response:** 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**Implementation:**
```typescript
const { data: { user }, error } = await supabase.auth.getUser();

if (error?.message === 'JWT expired') {
  // Token wygasł, klient powinien refresh
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "Authentication required"
    }),
    { status: 401 }
  );
}
```

#### Scenario 4: Database Connection Error

**Trigger:** PostgreSQL connection timeout

**Response:** 500 Internal Server Error
```json
{
  "error": "InternalServerError",
  "message": "An unexpected error occurred. Our team has been notified.",
  "incident_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Implementation:**
```typescript
try {
  const result = await recipesService.getRecipes(supabase, query);
  return new Response(JSON.stringify(result), { status: 200 });
} catch (error) {
  // Log to Sentry
  const sentryEventId = Sentry.captureException(error, {
    tags: { endpoint: 'GET /api/recipes' },
    user: { id: user.id }
  });

  // Return generic error
  return new Response(
    JSON.stringify({
      error: "InternalServerError",
      message: "An unexpected error occurred. Our team has been notified.",
      incident_id: sentryEventId
    }),
    { status: 500 }
  );
}
```

#### Scenario 5: Rate Limit Exceeded

**Response:** 429 Too Many Requests
```json
{
  "error": "TooManyRequests",
  "message": "Rate limit exceeded. Please try again in 60 seconds.",
  "retry_after": 60
}
```

### 7.4 Error Logging Strategy

**Sentry Integration:**
```typescript
// Log tylko 500 errors do Sentry
if (error.status >= 500) {
  Sentry.captureException(error, {
    level: 'error',
    tags: {
      endpoint: 'GET /api/recipes',
      user_id: user?.id
    },
    extra: {
      query_params: query,
      supabase_error: error.message
    }
  });
}

// 400, 401 - log locally (console.warn)
console.warn('Client error:', { status: error.status, query });
```

---

## 8. Wydajność

### 8.1 Target Performance (p95)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Response Time | < 100ms | Vercel Analytics |
| Database Query | < 50ms | Supabase Dashboard |
| Total Endpoint Latency | < 150ms | End-to-end |

### 8.2 Database Optimization

**Indexes (z db-plan.md):**
```sql
-- Index dla filtrowania po user_id (główne zapytanie)
CREATE INDEX idx_recipes_user_id ON recipes(user_id);

-- Index dla JOIN z ingredients (COUNT aggregation)
CREATE INDEX idx_ingredients_recipe_id ON ingredients(recipe_id);
```

**Query Optimization:**
```sql
-- ✅ OPTIMIZED - używa indexes, LEFT JOIN dla agregacji
SELECT
  r.id, r.name, r.instructions, r.created_at, r.updated_at,
  COUNT(i.id) AS ingredient_count
FROM recipes r
LEFT JOIN ingredients i ON r.id = i.recipe_id
WHERE r.user_id = $1
  AND (r.name ILIKE $2 OR $2 IS NULL)
GROUP BY r.id
ORDER BY r.created_at DESC
LIMIT $3 OFFSET $4;

-- ❌ SLOW - separate subquery per row (N+1 problem)
-- SELECT
--   r.*,
--   (SELECT COUNT(*) FROM ingredients WHERE recipe_id = r.id) AS ingredient_count
-- FROM recipes r
-- WHERE r.user_id = $1;
```

**EXPLAIN ANALYZE (expected):**
```
Limit  (cost=0.00..100.00 rows=20 width=256) (actual time=2.5..10.2 rows=20 loops=1)
  ->  GroupAggregate  (cost=0.00..500.00 rows=100 width=256)
        ->  Index Scan using idx_recipes_user_id on recipes r
              Filter: (user_id = 'uuid' AND name ILIKE '%pasta%')
        ->  Index Scan using idx_ingredients_recipe_id on ingredients i
Planning Time: 1.2 ms
Execution Time: 12.5 ms
```

### 8.3 Connection Pooling

**Supabase PgBouncer:**
- Automatic connection pooling
- Transaction mode (default)
- Max 15 connections per database (Free tier)
- Max 200 connections (Pro tier)

**Implementation - no changes needed:**
Supabase client używa pooling automatycznie.

### 8.4 Caching Strategy

**Client-Side Caching (TanStack Query - post-MVP):**
```typescript
// Frontend cache strategy
const { data } = useQuery({
  queryKey: ['recipes', { search, sort, limit, offset }],
  queryFn: () => fetchRecipes({ search, sort, limit, offset }),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

**Benefits:**
- Reduce API calls by ~30-50%
- Immediate response for cached data
- Background refetch for stale data

**Server-Side Caching (future):**
- Redis cache dla często używanych queries
- Cache key: `recipes:${userId}:${search}:${sort}:${page}`
- TTL: 5 minutes
- Invalidation on recipe CREATE/UPDATE/DELETE

### 8.5 Pagination Best Practices

**Cursor-based vs Offset-based:**

| Type | Pros | Cons | Used in MVP |
|------|------|------|-------------|
| Offset | Simple, allows jumping to page N | Performance degrades with large offsets | ✅ Yes |
| Cursor | Consistent performance, no duplicates | Can't jump to arbitrary page | ❌ Post-MVP |

**Offset Performance Issue:**
```sql
-- Slow for large offsets (e.g., offset=10000)
LIMIT 20 OFFSET 10000;
-- Database must scan 10020 rows, return only 20

-- Solution for post-MVP: cursor-based
WHERE id > $cursor_id
ORDER BY id
LIMIT 20;
```

**MVP Decision:** Offset-based pagination is acceptable for:
- Expected max recipes per user: ~100-500
- Max realistic offset: 100-200 (page 5-10)
- Query time at offset 200: ~20ms (acceptable)

### 8.6 Potential Bottlenecks

**Identified Bottlenecks:**

1. **Large number of ingredients per recipe:**
   - Impact: COUNT aggregation slowdown
   - Mitigation: Limit 50 ingredients per recipe (validation)

2. **Complex search queries:**
   - Impact: ILIKE '%term%' doesn't use index
   - Mitigation: Consider PostgreSQL full-text search (post-MVP)

3. **High concurrent users:**
   - Impact: Connection pool exhaustion
   - Mitigation: Upgrade to Pro tier (200 connections)

**Monitoring Plan:**
- Supabase Dashboard: query performance
- Sentry: error rate tracking
- Vercel Analytics: endpoint latency

---

## 9. Etapy wdrożenia

### Phase 1: Setup and Configuration (30 min)

#### Step 1.1: Create Validation Schema
**File:** `src/lib/validation/recipes.schema.ts`

```typescript
import { z } from "zod";

/**
 * Schema walidacji query params dla GET /api/recipes
 */
export const getRecipesQuerySchema = z.object({
  search: z.string().max(100).optional(),
  sort: z
    .enum(["name_asc", "name_desc", "created_asc", "created_desc"])
    .default("created_desc"),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type GetRecipesQuery = z.infer<typeof getRecipesQuerySchema>;
```

**Checklist:**
- [ ] Create file `src/lib/validation/recipes.schema.ts`
- [ ] Import Zod
- [ ] Define `getRecipesQuerySchema`
- [ ] Export type `GetRecipesQuery`
- [ ] Test schema validation (unit test)

#### Step 1.2: Verify Database Types
**File:** `src/db/database.types.ts`

**Action:** Verify that TypeScript types are generated from Supabase schema
```bash
supabase gen types typescript --local > src/db/database.types.ts
```

**Checklist:**
- [ ] Run `supabase gen types typescript`
- [ ] Verify `Recipe` type exists
- [ ] Verify `Ingredient` type exists
- [ ] Commit types to git

---

### Phase 2: Service Layer Implementation (1 hour)

#### Step 2.1: Create Recipes Service
**File:** `src/lib/services/recipes.service.ts`

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type {
  RecipeListItemDto,
  PaginatedResponse,
  Pagination
} from "@/types";
import type { GetRecipesQuery } from "@/lib/validation/recipes.schema";

type SupabaseClientType = SupabaseClient<Database>;

/**
 * Service dla operacji na przepisach
 */
export class RecipesService {
  /**
   * Pobiera listę przepisów użytkownika z filtrowaniem i paginacją
   */
  async getRecipes(
    supabase: SupabaseClientType,
    query: GetRecipesQuery
  ): Promise<PaginatedResponse<RecipeListItemDto>> {
    const { search, sort, limit, offset } = query;

    // 1. Build base query
    let recipesQuery = supabase
      .from("recipes")
      .select("id, name, instructions, created_at, updated_at, ingredients(id)", {
        count: "exact",
      });

    // 2. Apply search filter
    if (search) {
      recipesQuery = recipesQuery.ilike("name", `%${search}%`);
    }

    // 3. Apply sorting
    const [sortField, sortOrder] = this.parseSortParam(sort);
    recipesQuery = recipesQuery.order(sortField, { ascending: sortOrder === "asc" });

    // 4. Apply pagination
    recipesQuery = recipesQuery.range(offset, offset + limit - 1);

    // 5. Execute query
    const { data, error, count } = await recipesQuery;

    if (error) {
      throw new Error(`Failed to fetch recipes: ${error.message}`);
    }

    // 6. Map to DTOs
    const recipes: RecipeListItemDto[] = (data || []).map((recipe) => ({
      id: recipe.id,
      name: recipe.name,
      instructions: recipe.instructions,
      created_at: recipe.created_at,
      updated_at: recipe.updated_at,
      ingredient_count: recipe.ingredients?.length || 0,
    }));

    // 7. Build pagination metadata
    const total = count || 0;
    const pagination: Pagination = {
      total,
      limit,
      offset,
      has_more: offset + limit < total,
    };

    return {
      data: recipes,
      pagination,
    };
  }

  /**
   * Helper: Parse sort parameter to field and order
   */
  private parseSortParam(sort: string): [string, "asc" | "desc"] {
    const sortMap: Record<string, [string, "asc" | "desc"]> = {
      name_asc: ["name", "asc"],
      name_desc: ["name", "desc"],
      created_asc: ["created_at", "asc"],
      created_desc: ["created_at", "desc"],
    };
    return sortMap[sort] || ["created_at", "desc"];
  }
}

// Export singleton instance
export const recipesService = new RecipesService();
```

**Checklist:**
- [ ] Create file `src/lib/services/recipes.service.ts`
- [ ] Implement `getRecipes()` method
- [ ] Implement `parseSortParam()` helper
- [ ] Add JSDoc comments
- [ ] Export singleton instance
- [ ] Write unit tests for service methods

---

### Phase 3: API Route Implementation (45 min)

#### Step 3.1: Create API Route Handler
**File:** `src/pages/api/recipes/index.ts`

```typescript
import type { APIRoute } from "astro";
import { getRecipesQuerySchema } from "@/lib/validation/recipes.schema";
import { recipesService } from "@/lib/services/recipes.service";

export const prerender = false;

/**
 * GET /api/recipes
 *
 * Retrieves a paginated, filtered list of recipes for the authenticated user.
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Authentication check
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Extract and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      search: url.searchParams.get("search") || undefined,
      sort: url.searchParams.get("sort") || "created_desc",
      limit: url.searchParams.get("limit") || "20",
      offset: url.searchParams.get("offset") || "0",
    };

    const validation = getRecipesQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "ValidationError",
          message: "Invalid request data",
          details: validation.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Call service layer
    const result = await recipesService.getRecipes(
      locals.supabase,
      validation.data
    );

    // 4. Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 5. Handle unexpected errors
    console.error("Error in GET /api/recipes:", error);

    // In production: log to Sentry
    // const sentryEventId = Sentry.captureException(error);

    return new Response(
      JSON.stringify({
        error: "InternalServerError",
        message: "An unexpected error occurred. Our team has been notified.",
        // incident_id: sentryEventId, // Uncomment when Sentry is set up
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
- [ ] Create file `src/pages/api/recipes/index.ts`
- [ ] Set `prerender = false`
- [ ] Implement `GET` handler
- [ ] Add authentication check
- [ ] Add query params validation
- [ ] Add error handling
- [ ] Add JSDoc comments
- [ ] Test endpoint with Postman/Thunder Client

---

### Phase 4: Testing (1 hour)

#### Step 4.1: Unit Tests - Service Layer
**File:** `src/lib/services/__tests__/recipes.service.test.ts`

```typescript
import { describe, it, expect, vi } from "vitest";
import { recipesService } from "../recipes.service";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("RecipesService", () => {
  describe("getRecipes", () => {
    it("should return paginated recipes with ingredient count", async () => {
      // Mock Supabase client
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            ilike: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() =>
                  Promise.resolve({
                    data: [
                      {
                        id: "1",
                        name: "Pasta",
                        instructions: "Cook",
                        created_at: "2025-01-01",
                        updated_at: "2025-01-01",
                        ingredients: [{ id: "i1" }, { id: "i2" }],
                      },
                    ],
                    count: 10,
                    error: null,
                  })
                ),
              })),
            })),
          })),
        })),
      } as unknown as SupabaseClient;

      const result = await recipesService.getRecipes(mockSupabase, {
        search: "pasta",
        sort: "created_desc",
        limit: 20,
        offset: 0,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].ingredient_count).toBe(2);
      expect(result.pagination.total).toBe(10);
      expect(result.pagination.has_more).toBe(false);
    });

    it("should handle search filter correctly", async () => {
      // Test search functionality
      // ...
    });

    it("should apply correct sorting", async () => {
      // Test sort parameter parsing
      // ...
    });
  });
});
```

**Checklist:**
- [ ] Create test file
- [ ] Write test for successful query
- [ ] Write test for search filter
- [ ] Write test for sorting
- [ ] Write test for pagination
- [ ] Run tests: `npm run test`

#### Step 4.2: Integration Tests - API Route
**File:** `src/pages/api/recipes/__tests__/index.test.ts`

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

describe("GET /api/recipes", () => {
  let supabase: any;
  let authToken: string;

  beforeAll(async () => {
    // Setup test Supabase client
    supabase = createClient(
      import.meta.env.SUPABASE_URL,
      import.meta.env.SUPABASE_ANON_KEY
    );

    // Create test user and get auth token
    const { data } = await supabase.auth.signInWithPassword({
      email: "test@example.com",
      password: "password123",
    });
    authToken = data.session.access_token;
  });

  it("should return 401 when not authenticated", async () => {
    const response = await fetch("http://localhost:3000/api/recipes");
    expect(response.status).toBe(401);
  });

  it("should return recipes with valid auth", async () => {
    const response = await fetch("http://localhost:3000/api/recipes", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("pagination");
  });

  it("should filter recipes by search query", async () => {
    const response = await fetch(
      "http://localhost:3000/api/recipes?search=pasta",
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    const data = await response.json();
    expect(data.data.every((r: any) =>
      r.name.toLowerCase().includes("pasta")
    )).toBe(true);
  });

  it("should validate query parameters", async () => {
    const response = await fetch(
      "http://localhost:3000/api/recipes?limit=500",
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("ValidationError");
  });
});
```

**Checklist:**
- [ ] Create integration test file
- [ ] Test authentication requirement
- [ ] Test successful response
- [ ] Test search functionality
- [ ] Test validation errors
- [ ] Run integration tests

#### Step 4.3: Manual Testing Checklist

**Test Cases:**

| # | Test Case | Expected Result | Status |
|---|-----------|-----------------|--------|
| 1 | GET /api/recipes without auth | 401 Unauthorized | ⬜ |
| 2 | GET /api/recipes with valid token | 200 OK with data | ⬜ |
| 3 | GET /api/recipes?search=pasta | Filtered results | ⬜ |
| 4 | GET /api/recipes?sort=name_asc | Sorted by name A-Z | ⬜ |
| 5 | GET /api/recipes?limit=5 | Max 5 results | ⬜ |
| 6 | GET /api/recipes?limit=500 | 400 ValidationError | ⬜ |
| 7 | GET /api/recipes?offset=20 | Page 2 results | ⬜ |
| 8 | Empty recipes list | Empty array + pagination | ⬜ |
| 9 | Recipe with 0 ingredients | ingredient_count = 0 | ⬜ |
| 10 | Large dataset (100+ recipes) | Performance < 150ms | ⬜ |

**Tools:**
- Postman collection
- Thunder Client (VS Code extension)
- curl commands

---

### Phase 5: Documentation and Deployment (30 min)

#### Step 5.1: API Documentation
**File:** `README-API.md` (or update existing)

```markdown
## GET /api/recipes

Retrieves a paginated list of recipes for the authenticated user.

### Authentication
Required. Include JWT token in Authorization header.

### Query Parameters
- `search` (optional): Search term for recipe name
- `sort` (optional): Sort order (default: created_desc)
- `limit` (optional): Items per page (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

### Example Request
\`\`\`bash
curl -X GET "https://api.shopmate.com/api/recipes?search=pasta&limit=10" \
  -H "Authorization: Bearer <token>"
\`\`\`

### Example Response
\`\`\`json
{
  "data": [...],
  "pagination": {...}
}
\`\`\`

See full documentation: [API Plan](/.ai/doc/15_api-plan.md)
```

**Checklist:**
- [ ] Update API documentation
- [ ] Add example requests/responses
- [ ] Document error codes
- [ ] Add to Postman collection
- [ ] Update CHANGELOG.md

#### Step 5.2: Deployment Checklist

**Pre-deployment:**
- [ ] All tests passing (unit + integration)
- [ ] RLS policies verified in Supabase Dashboard
- [ ] Database indexes exist (`idx_recipes_user_id`)
- [ ] Environment variables configured
- [ ] Error logging setup (Sentry/console)

**Deployment:**
- [ ] Merge feature branch to main
- [ ] Deploy to staging environment
- [ ] Run smoke tests on staging
- [ ] Monitor Vercel deployment logs
- [ ] Check Supabase Dashboard for query performance

**Post-deployment:**
- [ ] Test endpoint on production
- [ ] Monitor error rate (Sentry)
- [ ] Monitor response time (Vercel Analytics)
- [ ] Verify RLS enforcement (attempt to access other user's data)

---

## 10. Estimated Timeline

| Phase | Task | Duration | Dependencies |
|-------|------|----------|--------------|
| 1 | Setup validation schema | 15 min | - |
| 1 | Verify database types | 15 min | Supabase schema |
| 2 | Implement service layer | 45 min | Phase 1 |
| 2 | Write service unit tests | 15 min | Service implementation |
| 3 | Implement API route | 30 min | Phase 2 |
| 3 | Manual testing | 15 min | API route |
| 4 | Integration tests | 30 min | Phase 3 |
| 4 | Manual test checklist | 30 min | Phase 3 |
| 5 | Documentation | 15 min | Phase 4 |
| 5 | Deployment | 15 min | All phases |

**Total Estimated Time:** ~3.5 hours

---

## 11. Success Criteria

### Functional Requirements
- ✅ Endpoint returns list of recipes for authenticated user only
- ✅ Search filtering works (case-insensitive)
- ✅ Sorting works for all 4 options (name/date, asc/desc)
- ✅ Pagination returns correct results with metadata
- ✅ Ingredient count is accurate
- ✅ RLS policies prevent unauthorized access

### Non-Functional Requirements
- ✅ Response time < 150ms (p95)
- ✅ Database query < 50ms (p95)
- ✅ 100% test coverage for service layer
- ✅ All integration tests passing
- ✅ No 500 errors in production (first 24h)
- ✅ Error rate < 1%

### Security Requirements
- ✅ JWT token validation working
- ✅ RLS policies enforce data isolation
- ✅ SQL injection prevention verified
- ✅ Input validation prevents abuse (max limits)
- ✅ Error messages don't leak sensitive data

---

## 12. Rollback Plan

### Rollback Triggers
- Error rate > 5%
- Response time > 500ms (p95)
- Security vulnerability discovered
- Critical bug in production

### Rollback Procedure
1. Revert deployment via Vercel Dashboard
2. Notify team via Slack
3. Investigate root cause
4. Fix issue in feature branch
5. Re-deploy after testing

**Recovery Time Objective (RTO):** < 10 minutes

---

## 13. Monitoring and Alerts

### Metrics to Monitor

| Metric | Tool | Alert Threshold |
|--------|------|-----------------|
| Error rate | Sentry | > 1% |
| Response time | Vercel Analytics | > 200ms (p95) |
| Database query time | Supabase Dashboard | > 100ms |
| Request rate | Supabase | Approaching rate limit |

### Alert Configuration

**Sentry Alerts:**
```javascript
{
  "error_rate": {
    "threshold": "1%",
    "window": "5 minutes",
    "action": "Send to Slack #alerts"
  }
}
```

**Supabase Alerts:**
- Database query > 100ms → Email notification
- Connection pool > 80% → Slack notification

---

## 14. Future Enhancements (Post-MVP)

### Performance Optimizations
1. **Cursor-based pagination** for large datasets
2. **Full-text search** (PostgreSQL tsvector) instead of ILIKE
3. **Server-side caching** (Redis) for frequent queries
4. **GraphQL endpoint** for flexible querying

### Feature Additions
1. **Filter by ingredient** (`?ingredient=chicken`)
2. **Multi-field search** (name + instructions)
3. **Favorite recipes** (add `is_favorite` flag)
4. **Recipe tags/categories** (new table)

### Security Enhancements
1. **Per-user rate limiting** (10 req/min)
2. **Request throttling** during high load
3. **CORS configuration** for specific domains

---

**Document Version:** 1.0
**Last Updated:** 2025-10-25
**Author:** Claude Code (API Implementation Planner)
**Status:** ✅ Ready for Implementation

---

## Appendix: SQL Query Examples

### Query 1: Recipes with Ingredient Count
```sql
SELECT
  r.id,
  r.name,
  r.instructions,
  r.created_at,
  r.updated_at,
  COUNT(i.id) AS ingredient_count
FROM recipes r
LEFT JOIN ingredients i ON r.id = i.recipe_id
WHERE r.user_id = auth.uid()
  AND (r.name ILIKE '%pasta%' OR 'pasta' IS NULL)
GROUP BY r.id, r.name, r.instructions, r.created_at, r.updated_at
ORDER BY r.created_at DESC
LIMIT 20 OFFSET 0;
```

### Query 2: Total Count
```sql
SELECT COUNT(*)
FROM recipes
WHERE user_id = auth.uid()
  AND (name ILIKE '%pasta%' OR 'pasta' IS NULL);
```

### EXPLAIN ANALYZE Output
```
Limit  (cost=0.00..100.00 rows=20 width=256) (actual time=2.5..10.2 rows=20 loops=1)
  ->  GroupAggregate  (cost=0.00..500.00 rows=100 width=256)
        Group Key: r.id
        ->  Nested Loop Left Join  (cost=0.00..450.00 rows=100 width=256)
              ->  Index Scan using idx_recipes_user_id on recipes r
                    Index Cond: (user_id = auth.uid())
                    Filter: (name ILIKE '%pasta%')
              ->  Index Scan using idx_ingredients_recipe_id on ingredients i
                    Index Cond: (recipe_id = r.id)
Planning Time: 1.2 ms
Execution Time: 12.5 ms
```

---

## Appendix: Code Snippets for Quick Reference

### Supabase Query Builder (Complete Example)
```typescript
const { data, error, count } = await supabase
  .from("recipes")
  .select(
    "id, name, instructions, created_at, updated_at, ingredients(id)",
    { count: "exact" }
  )
  .ilike("name", `%${search}%`)
  .order("created_at", { ascending: false })
  .range(0, 19);
```

### Error Response Helper
```typescript
function errorResponse(
  status: number,
  error: string,
  message: string,
  details?: any
) {
  return new Response(
    JSON.stringify({ error, message, details }),
    {
      status,
      headers: { "Content-Type": "application/json" }
    }
  );
}
```

### Auth Check Helper
```typescript
async function requireAuth(supabase: SupabaseClient) {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return user;
}
```