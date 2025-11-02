# API Endpoint Implementation Plan: GET /api/recipes

## 1. Przegląd punktu końcowego

Endpoint GET /api/recipes służy do pobierania listy przepisów użytkownika z możliwością wyszukiwania, sortowania i paginacji. Zwraca uproszczoną reprezentację przepisów (bez szczegółów składników), zoptymalizowaną dla widoku listy.

**Główne funkcje:**

- Pobieranie listy przepisów zalogowanego użytkownika
- Wyszukiwanie przepisów po nazwie (case-insensitive)
- Sortowanie po nazwie lub dacie utworzenia (rosnąco/malejąco)
- Paginacja z konfigurowalnymi parametrami (strona, limit)
- Zwracanie liczby składników dla każdego przepisu

**Typ operacji:** Read (GET) - bezpieczna i idempotentna

---

## 2. Szczegóły żądania

### HTTP Method

`GET`

### Struktura URL

```
/api/recipes
```

### Query Parameters

#### Wymagane

Brak - wszystkie parametry są opcjonalne. Identyfikacja użytkownika odbywa się poprzez sesję uwierzytelniającą.

#### Opcjonalne

| Parametr | Typ    | Domyślna wartość | Walidacja                                                    | Opis                                                |
| -------- | ------ | ---------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| `search` | string | -                | Opcjonalny, trim                                             | Case-insensitive substring match na nazwie przepisu |
| `sort`   | enum   | `created_desc`   | `name_asc` \| `name_desc` \| `created_asc` \| `created_desc` | Sposób sortowania wyników                           |
| `page`   | number | 1                | >= 1                                                         | Numer strony dla paginacji                          |
| `limit`  | number | 20               | >= 1, <= 100                                                 | Liczba elementów na stronie                         |

### Request Headers

```
Cookie: sb-<project>-auth-token (automatycznie przez Supabase Auth)
```

### Request Body

Brak - GET request nie zawiera body.

### Przykładowe żądania

**1. Podstawowe żądanie (bez parametrów):**

```
GET /api/recipes
```

**2. Wyszukiwanie z sortowaniem:**

```
GET /api/recipes?search=pasta&sort=name_asc
```

**3. Paginacja z limitem:**

```
GET /api/recipes?page=2&limit=10
```

**4. Pełny przykład:**

```
GET /api/recipes?search=kurczak&sort=created_desc&page=1&limit=20
```

---

## 3. Wykorzystywane typy

### Types z src/types.ts

#### Request Types

```typescript
// Query parameters
export interface RecipeListQueryParams extends PaginationParams {
  search?: string;
  sort?: "name_asc" | "name_desc" | "created_asc" | "created_desc";
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
```

#### Response Types

```typescript
// Single item in list
export interface RecipeListItemDto {
  id: string;
  name: string;
  ingredients_count: number;
  created_at: string;
  updated_at: string;
}

// Paginated response wrapper
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

// Pagination metadata
export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}
```

#### Error Types

```typescript
export interface ErrorResponseDto {
  error: string;
  message?: string;
}

export interface ValidationErrorResponseDto {
  error: string;
  details: ValidationErrorDetails;
}

export type ValidationErrorDetails = Record<string, string[]>;
```

#### Database Types (używane wewnętrznie)

```typescript
export type Recipe = Database["public"]["Tables"]["recipes"]["Row"];
```

### Zod Schema dla walidacji

Lokalizacja: `src/lib/validation/recipe.schema.ts` (do rozszerzenia)

```typescript
import { z } from "zod";

// Query params schema
export const recipeListQuerySchema = z.object({
  search: z.string().trim().optional(),
  sort: z.enum(["name_asc", "name_desc", "created_asc", "created_desc"]).default("created_desc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type RecipeListQueryInput = z.infer<typeof recipeListQuerySchema>;
```

---

## 4. Szczegóły odpowiedzi

### Success Response (200 OK)

#### Structure

```typescript
PaginatedResponse<RecipeListItemDto>;
```

#### Example

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Spaghetti Carbonara",
      "ingredients_count": 5,
      "created_at": "2025-01-26T10:00:00Z",
      "updated_at": "2025-01-26T10:00:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440111",
      "name": "Pasta Bolognese",
      "ingredients_count": 8,
      "created_at": "2025-01-25T15:30:00Z",
      "updated_at": "2025-01-25T15:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

#### Empty Result

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "total_pages": 0
  }
}
```

### Error Responses

#### 401 Unauthorized

**Przyczyna:** Użytkownik nie jest uwierzytelniony lub sesja wygasła.

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

#### 400 Bad Request

**Przyczyna:** Nieprawidłowe parametry query (np. limit > 100, page < 1, nieprawidłowa wartość sort).

```json
{
  "error": "Validation failed",
  "details": {
    "limit": ["Number must be less than or equal to 100"],
    "page": ["Number must be greater than or equal to 1"]
  }
}
```

#### 500 Internal Server Error

**Przyczyna:** Błąd serwera lub bazy danych.

```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## 5. Przepływ danych

### Diagram przepływu

```
Client Request (GET /api/recipes?search=pasta&sort=name_asc&page=1&limit=20)
    |
    v
[1] Astro API Route Handler (src/pages/api/recipes/index.ts)
    |
    v
[2] Parse & Validate Query Parameters (Zod schema)
    |-- Invalid --> 400 Bad Request
    |
    v
[3] Authentication Check (context.locals.supabase.auth.getUser())
    |-- Not authenticated --> 401 Unauthorized
    |
    v
[4] Extract user_id from session
    |
    v
[5] Call Recipe Service (src/lib/services/recipe.service.ts)
    |
    v
[6] Build Supabase Query
    |-- Filter by user_id
    |-- Apply search filter (ILIKE on name)
    |-- Count total records
    |-- Apply sorting
    |-- Apply pagination (range)
    |-- Aggregate ingredients count
    |
    v
[7] Execute Query (Supabase)
    |-- Database Error --> 500 Internal Server Error
    |
    v
[8] Transform Data to RecipeListItemDto[]
    |
    v
[9] Calculate Pagination Metadata
    |-- total_pages = ceil(total / limit)
    |
    v
[10] Format Response (PaginatedResponse)
    |
    v
[11] Return 200 OK with JSON
```

### Szczegółowy opis kroków

**Krok 1: API Route Handler**

- Plik: `src/pages/api/recipes/index.ts`
- Export: `export const prerender = false;`
- Handler: `export async function GET(context: APIContext)`

**Krok 2: Walidacja parametrów**

- Pobierz query params z `context.url.searchParams`
- Przekonwertuj na obiekt
- Waliduj przez `recipeListQuerySchema.safeParse()`
- Jeśli błąd: zwróć 400 z szczegółami błędów walidacji

**Krok 3: Uwierzytelnienie**

- Wywołaj `context.locals.supabase.auth.getUser()`
- Sprawdź czy `data.user` istnieje i nie ma błędu
- Jeśli brak: zwróć 401

**Krok 4: Ekstrakcja user_id**

- Pobierz `user_id = data.user.id`

**Krok 5: Wywołanie serwisu**

- `const result = await recipeService.getRecipesList(userId, validatedParams)`
- Service zwraca `{ recipes: RecipeListItemDto[], total: number }`

**Krok 6: Budowanie zapytania Supabase**
W serwisie:

```typescript
let query = supabase
  .from("recipes")
  .select("id, name, created_at, updated_at, ingredients(count)", { count: "exact" })
  .eq("user_id", userId);

// Apply search filter
if (search) {
  query = query.ilike("name", `%${search}%`);
}

// Apply sorting
const sortMap = {
  name_asc: { column: "name", ascending: true },
  name_desc: { column: "name", ascending: false },
  created_asc: { column: "created_at", ascending: true },
  created_desc: { column: "created_at", ascending: false },
};
const sortConfig = sortMap[sort];
query = query.order(sortConfig.column, { ascending: sortConfig.ascending });

// Apply pagination
const from = (page - 1) * limit;
const to = from + limit - 1;
query = query.range(from, to);

// Execute query
const { data, error, count } = await query;
```

**Krok 7: Obsługa wyniku**

- Sprawdź `error`, jeśli istnieje - throw
- Zmapuj `data` na `RecipeListItemDto[]`

**Krok 8: Transformacja danych**

```typescript
const recipes = data.map((recipe) => ({
  id: recipe.id,
  name: recipe.name,
  ingredients_count: recipe.ingredients?.[0]?.count ?? 0,
  created_at: recipe.created_at,
  updated_at: recipe.updated_at,
}));
```

**Krok 9: Kalkulacja metadanych paginacji**

```typescript
const totalPages = Math.ceil(count / limit);
const pagination = {
  page,
  limit,
  total: count,
  total_pages: totalPages,
};
```

**Krok 10: Formatowanie odpowiedzi**

```typescript
const response: PaginatedResponse<RecipeListItemDto> = {
  data: recipes,
  pagination,
};
```

**Krok 11: Zwrot odpowiedzi**

```typescript
return new Response(JSON.stringify(response), {
  status: 200,
  headers: { "Content-Type": "application/json" },
});
```

---

## 6. Względy bezpieczeństwa

### 6.1. Uwierzytelnienie (Authentication)

**Implementacja:**

- Użyj `context.locals.supabase.auth.getUser()` do weryfikacji sesji
- Endpoint wymaga aktywnej sesji uwierzytelniającej
- Token jest automatycznie pobierany z cookies przez middleware Astro

**Kod:**

```typescript
const {
  data: { user },
  error: authError,
} = await context.locals.supabase.auth.getUser();

if (authError || !user) {
  return new Response(JSON.stringify({ error: "Unauthorized", message: "Authentication required" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
```

### 6.2. Autoryzacja (Authorization)

**Row Level Security (RLS):**

- RLS na tabeli `recipes` zapewnia, że użytkownik widzi tylko swoje przepisy
- Policy: `auth.uid() = user_id`
- Dodatkowa eksplicitna filtracja w query: `.eq('user_id', userId)`

**Dlaczego eksplicitny filtr:**

- Dodatkowa warstwa bezpieczeństwa (defense in depth)
- Lepsze komunikowanie intencji w kodzie
- Łatwiejsze testowanie i debugowanie

### 6.3. Walidacja danych wejściowych

**Zod Schema:**

- Wszystkie parametry query są walidowane przez Zod
- Coercion: konwersja stringów na liczby dla `page` i `limit`
- Bounds checking: `limit` max 100, `page` min 1
- Enum validation: `sort` tylko dozwolone wartości
- String trimming: `search` automatyczne usuwanie whitespace

**Obrona przed atakami:**

- **SQL Injection:** Używamy Supabase query builder (parameterized queries)
- **NoSQL Injection:** Nie dotyczy (PostgreSQL)
- **Type Coercion Attacks:** Zod zapewnia type safety
- **Integer Overflow:** Bounds checking w Zod

### 6.4. Ochrona przed wyszukiwaniem wrażliwych danych

**Search Parameter:**

- Użyj `.ilike()` zamiast konkatenacji stringów
- PostgreSQL automatycznie escapuje special characters w LIKE
- Case-insensitive search bezpieczny z ILIKE

```typescript
// BEZPIECZNE
query = query.ilike("name", `%${search}%`);

// NIEBEZPIECZNE (nie rób tego!)
query = query.sql(`name ILIKE '%${search}%'`);
```

### 6.5. Rate Limiting

**Rekomendacje:**

- Rozważ dodanie rate limiting na poziomie middleware lub API Gateway
- Dla MVP: Supabase ma wbudowane limity połączeń
- W produkcji: użyj Vercel Edge Config lub Upstash Redis dla rate limiting

**Przykładowe limity:**

- 100 requests/minute per user dla authenticated endpoints
- 10 requests/minute per IP dla unauthenticated

### 6.6. Exposure of Sensitive Data

**Co zwracamy:**

- ✅ Tylko dane publiczne dla użytkownika (id, name, counts, timestamps)
- ✅ Nie zwracamy pełnych danych składników (optymalizacja i bezpieczeństwo)
- ✅ Nie zwracamy `user_id` w response (nie jest potrzebny na frontendzie)

**Content-Type Header:**

- Zawsze ustawiaj `Content-Type: application/json`
- Zapobiega MIME type sniffing attacks

---

## 7. Obsługa błędów

### 7.1. Katalog błędów

| Kod | Scenariusz           | Przyczyna              | Response Body                                    | Akcja                                      |
| --- | -------------------- | ---------------------- | ------------------------------------------------ | ------------------------------------------ |
| 400 | Invalid query params | `limit > 100`          | `{ error: "Validation failed", details: {...} }` | Waliduj na frontendzie, wyświetl komunikat |
| 400 | Invalid query params | `page < 1`             | `{ error: "Validation failed", details: {...} }` | Waliduj na frontendzie, wyświetl komunikat |
| 400 | Invalid sort value   | `sort=invalid`         | `{ error: "Validation failed", details: {...} }` | Użyj tylko dozwolonych wartości            |
| 401 | No authentication    | Brak sesji lub wygasła | `{ error: "Unauthorized", message: "..." }`      | Przekieruj na /login                       |
| 500 | Database error       | Connection timeout     | `{ error: "Internal server error" }`             | Retry, loguj błąd, alert admin             |
| 500 | Unexpected error     | Unhandled exception    | `{ error: "Internal server error" }`             | Loguj stack trace, alert admin             |

### 7.2. Implementacja w kodzie

**Try-Catch Block:**

```typescript
export async function GET(context: APIContext) {
  try {
    // Parse query params
    const queryParams = Object.fromEntries(context.url.searchParams);
    const validation = recipeListQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Authentication check
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Business logic
    const result = await recipeService.getRecipesList(user.id, validation.data);

    return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error in GET /api/recipes:", error);

    // Don't expose internal error details to client
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

### 7.3. Error Logging

**Development:**

- `console.error()` z pełnym stack trace
- Loguj request details (user_id, params)

**Production:**

- Integracja z Sentry (zgodnie z CLAUDE.md)
- Loguj context: user_id, query params, timestamp
- Alert dla 500 errors

**Przykład:**

```typescript
catch (error) {
  const errorContext = {
    endpoint: 'GET /api/recipes',
    userId: user?.id,
    queryParams: validation.data,
    timestamp: new Date().toISOString(),
  };

  console.error('Recipe list error:', errorContext, error);

  // In production: Sentry.captureException(error, { extra: errorContext });
}
```

### 7.4. Graceful Degradation

**Brak wyników:**

- Zwróć pustą tablicę z total=0 (nie error)
- Frontend powinien wyświetlić "Brak przepisów" message

**Partial failures:**

- Jeśli count query fails ale select succeeds - użyj data.length jako fallback
- Zawsze zwróć validną strukturę response

---

## 8. Rozważania dotyczące wydajności

### 8.1. Database Indexing

**Wymagane indeksy:**

```sql
-- Index na user_id (najważniejszy - używany w każdym query)
CREATE INDEX IF NOT EXISTS idx_recipes_user_id
ON recipes(user_id);

-- Composite index dla domyślnego sortowania
CREATE INDEX IF NOT EXISTS idx_recipes_user_created
ON recipes(user_id, created_at DESC);

-- Index dla wyszukiwania (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_recipes_name_trgm
ON recipes USING gin (name gin_trgm_ops);

-- Alternatywnie dla prostszego ILIKE (bez pg_trgm extension):
CREATE INDEX IF NOT EXISTS idx_recipes_name_lower
ON recipes(lower(name) text_pattern_ops);
```

**Sprawdzenie indeksów:**

```sql
SELECT * FROM pg_indexes WHERE tablename = 'recipes';
```

### 8.2. Query Optimization

**N+1 Problem:**

- ❌ NIE: Fetch recipes, potem dla każdego recipe count ingredients (N+1 queries)
- ✅ TAK: Użyj agregacji w jednym query

**Optymalne zapytanie:**

```typescript
const { data, error, count } = await supabase
  .from("recipes")
  .select(
    `
    id,
    name,
    created_at,
    updated_at,
    ingredients(count)
  `,
    { count: "exact" }
  )
  .eq("user_id", userId);
// ... filters, sorting, pagination
```

**Count optimization:**

- Użyj `{ count: 'exact' }` tylko gdy potrzebne (zawsze dla paginacji)
- PostgreSQL wykonuje count efektywnie z indeksami

### 8.3. Pagination Strategy

**Offset-based pagination (implementacja):**

- Proste w implementacji
- Dobre dla małych i średnich dataset'ów
- Limit: 100 items/page (wystarczające dla MVP)

**Range calculation:**

```typescript
const from = (page - 1) * limit; // page=1, limit=20 → from=0
const to = from + limit - 1; // page=1, limit=20 → to=19
query.range(from, to);
```

**Alternatywa (future):**

- Cursor-based pagination dla bardzo dużych dataset'ów
- Użyj `created_at` + `id` jako cursor

### 8.4. Caching Strategy

**Frontend caching:**

- React Query / TanStack Query na frontendzie
- Cache TTL: 5 minutes dla listy przepisów
- Invalidate cache po create/update/delete

**Backend caching (future):**

- Nie implementujemy dla MVP (overkill)
- W produkcji: Redis cache dla często odpytywanych list
- Cache key: `recipes:${userId}:${hash(params)}`

### 8.5. Response Size Optimization

**Dlaczego RecipeListItemDto:**

- Zwracamy tylko potrzebne pola (id, name, counts, timestamps)
- NIE zwracamy instructions ani pełnych ingredients (duże dane)
- Zmniejsza payload size ~80% vs full RecipeResponseDto

**Przykładowe rozmiary:**

- RecipeListItemDto: ~150 bytes/item
- Full RecipeResponseDto: ~800+ bytes/item
- 20 items: 3KB vs 16KB

**Compression:**

- Vercel automatycznie stosuje gzip/brotli compression
- Dodatkowo: używaj `Content-Encoding: gzip` jeśli hosting nie robi tego automatycznie

### 8.6. Database Connection Pooling

**Supabase:**

- Connection pooling obsługiwany automatycznie przez Supabase
- Używaj `context.locals.supabase` (singleton per request)
- NIE twórz nowych klientów w pętlach

### 8.7. Monitoring & Metrics

**Metryki do śledzenia:**

- Response time (target: <200ms p95)
- Query execution time
- Cache hit rate (gdy implementujemy cache)
- Error rate
- Pagination stats (most used page, limit distribution)

**Tools:**

- Supabase Dashboard: query performance
- Vercel Analytics: endpoint latency
- Sentry Performance Monitoring

---

## 9. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

**1.1. Sprawdź/utwórz pliki:**

```
src/
├── pages/
│   └── api/
│       └── recipes/
│           └── index.ts          # API route handler
├── lib/
│   ├── services/
│   │   └── recipe.service.ts    # Business logic
│   └── validation/
│       └── recipe.schema.ts     # Zod schemas
└── types.ts                      # Types (już istnieje)
```

**1.2. Komendy:**

```bash
# Sprawdź czy folder istnieje
ls src/pages/api/recipes/

# Jeśli nie istnieje, utwórz
mkdir -p src/pages/api/recipes
```

---

### Krok 2: Rozszerzenie Zod Schema

**Plik:** `src/lib/validation/recipe.schema.ts`

**Zadanie:**

- Dodaj `recipeListQuerySchema` dla walidacji query params
- Export type `RecipeListQueryInput`

**Kod:**

```typescript
import { z } from "zod";

// ... existing schemas (createRecipeSchema, updateRecipeSchema)

/**
 * Zod schema for GET /api/recipes query parameters
 * Validates search, sort, page, and limit params
 */
export const recipeListQuerySchema = z.object({
  search: z.string().trim().optional().describe("Case-insensitive search on recipe name"),

  sort: z
    .enum(["name_asc", "name_desc", "created_asc", "created_desc"])
    .default("created_desc")
    .describe("Sort order for recipes"),

  page: z.coerce.number().int().min(1, "Page must be at least 1").default(1).describe("Page number for pagination"),

  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .default(20)
    .describe("Number of items per page"),
});

export type RecipeListQueryInput = z.infer<typeof recipeListQuerySchema>;
```

**Weryfikacja:**

```typescript
// Test w REPL/console
const testValid = recipeListQuerySchema.safeParse({
  search: "pasta",
  sort: "name_asc",
  page: "1",
  limit: "20",
});
console.log(testValid.success); // true
console.log(testValid.data); // { search: "pasta", sort: "name_asc", page: 1, limit: 20 }

const testInvalid = recipeListQuerySchema.safeParse({
  limit: "200",
});
console.log(testInvalid.success); // false
console.log(testInvalid.error.flatten());
```

---

### Krok 3: Implementacja Recipe Service

**Plik:** `src/lib/services/recipe.service.ts`

**Zadanie:**

- Dodaj funkcję `getRecipesList()`
- Implementuj logikę query z search, sort, pagination
- Agreguj count składników

**Kod:**

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type { RecipeListQueryInput } from "@/lib/validation/recipe.schema";
import type { RecipeListItemDto, PaginatedResponse, PaginationMetadata } from "@/types";

/**
 * Get paginated list of user's recipes with search and sorting
 *
 * @param supabase - Authenticated Supabase client
 * @param userId - User ID from auth session
 * @param params - Query parameters (search, sort, page, limit)
 * @returns Paginated response with recipes and metadata
 * @throws Error if database query fails
 */
export async function getRecipesList(
  supabase: SupabaseClient,
  userId: string,
  params: RecipeListQueryInput
): Promise<PaginatedResponse<RecipeListItemDto>> {
  const { search, sort, page, limit } = params;

  // Build base query
  let query = supabase
    .from("recipes")
    .select(
      `
      id,
      name,
      created_at,
      updated_at,
      ingredients(count)
    `,
      { count: "exact" }
    )
    .eq("user_id", userId);

  // Apply search filter (case-insensitive)
  if (search && search.trim()) {
    query = query.ilike("name", `%${search.trim()}%`);
  }

  // Apply sorting
  const sortConfig = getSortConfig(sort);
  query = query.order(sortConfig.column, { ascending: sortConfig.ascending });

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  // Execute query
  const { data, error, count } = await query;

  if (error) {
    console.error("Database error in getRecipesList:", error);
    throw new Error(`Failed to fetch recipes: ${error.message}`);
  }

  // Transform data to DTOs
  const recipes: RecipeListItemDto[] = (data || []).map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    ingredients_count: recipe.ingredients?.[0]?.count ?? 0,
    created_at: recipe.created_at,
    updated_at: recipe.updated_at,
  }));

  // Calculate pagination metadata
  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);

  const pagination: PaginationMetadata = {
    page,
    limit,
    total,
    total_pages: totalPages,
  };

  return {
    data: recipes,
    pagination,
  };
}

/**
 * Helper: Map sort parameter to Supabase order config
 */
function getSortConfig(sort: RecipeListQueryInput["sort"]): {
  column: string;
  ascending: boolean;
} {
  const sortMap = {
    name_asc: { column: "name", ascending: true },
    name_desc: { column: "name", ascending: false },
    created_asc: { column: "created_at", ascending: true },
    created_desc: { column: "created_at", ascending: false },
  };

  return sortMap[sort];
}
```

**Weryfikacja:**

- Sprawdź czy funkcja kompiluje się bez błędów TypeScript
- Przygotuj test unit test (opcjonalnie)

---

### Krok 4: Implementacja API Route Handler

**Plik:** `src/pages/api/recipes/index.ts`

**Zadanie:**

- Utwórz GET handler
- Implementuj authentication flow
- Waliduj query params
- Wywołaj service
- Obsłuż błędy

**Kod:**

```typescript
import type { APIContext } from "astro";
import { recipeListQuerySchema } from "@/lib/validation/recipe.schema";
import { getRecipesList } from "@/lib/services/recipe.service";
import type { PaginatedResponse, RecipeListItemDto, ErrorResponseDto, ValidationErrorResponseDto } from "@/types";

export const prerender = false;

/**
 * GET /api/recipes
 *
 * Get user's recipes with optional search, sorting, and pagination
 *
 * @param context - Astro API context
 * @returns 200 with paginated recipes | 401 unauthorized | 400 validation error | 500 server error
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    // 1. Parse query parameters
    const queryParams = Object.fromEntries(context.url.searchParams);

    // 2. Validate query parameters
    const validation = recipeListQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      const errorResponse: ValidationErrorResponseDto = {
        error: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Authentication check
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      const errorResponse: ErrorResponseDto = {
        error: "Unauthorized",
        message: "Authentication required",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Fetch recipes via service
    const result: PaginatedResponse<RecipeListItemDto> = await getRecipesList(
      context.locals.supabase,
      user.id,
      validation.data
    );

    // 5. Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 6. Error handling
    console.error("Error in GET /api/recipes:", error);

    const errorResponse: ErrorResponseDto = {
      error: "Internal server error",
      message: "An unexpected error occurred",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
```

**Weryfikacja:**

- Sprawdź czy plik kompiluje się bez błędów TypeScript
- Sprawdź czy `context.locals.supabase` jest dostępny (powinien być z middleware)

---

### Krok 5: Weryfikacja Database Indexes

**Zadanie:**

- Sprawdź czy wymagane indeksy istnieją w Supabase
- Utwórz brakujące indeksy

**SQL do wykonania w Supabase SQL Editor:**

```sql
-- 1. Check existing indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'recipes'
ORDER BY indexname;

-- 2. Create required indexes (if not exist)

-- Index na user_id (kluczowy dla RLS i queries)
CREATE INDEX IF NOT EXISTS idx_recipes_user_id
ON recipes(user_id);

-- Composite index dla domyślnego sortowania (user_id + created_at)
CREATE INDEX IF NOT EXISTS idx_recipes_user_created
ON recipes(user_id, created_at DESC);

-- Index dla case-insensitive search na name
-- Opcja A: Używając pg_trgm extension (lepsze dla fuzzy search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_recipes_name_trgm
ON recipes USING gin (name gin_trgm_ops);

-- Opcja B: Prostszy index dla ILIKE (jeśli pg_trgm nie jest dostępny)
-- CREATE INDEX IF NOT EXISTS idx_recipes_name_lower
-- ON recipes(lower(name) text_pattern_ops);

-- 3. Verify index creation
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'recipes'
ORDER BY indexname;
```

**Weryfikacja:**

- Sprawdź output z query #3 - powinny być widoczne wszystkie indeksy
- Sprawdź query plan: `EXPLAIN ANALYZE SELECT * FROM recipes WHERE user_id = '...' ORDER BY created_at DESC LIMIT 20;`
- Index Scan powinien być używany (nie Seq Scan)

---

### Krok 6: Testowanie manualne

**6.1. Test authentication (401)**

```bash
# Request bez auth token (użyj Incognito/Private browsing)
curl http://localhost:3000/api/recipes

# Expected: 401 Unauthorized
```

**6.2. Test podstawowy (200)**

```bash
# Request z auth (użyj authenticated browser session lub token)
curl http://localhost:3000/api/recipes

# Expected: 200 OK z pustą tablicą lub listą recipes
```

**6.3. Test z parametrami (200)**

```bash
# Search
curl "http://localhost:3000/api/recipes?search=pasta"

# Sorting
curl "http://localhost:3000/api/recipes?sort=name_asc"

# Pagination
curl "http://localhost:3000/api/recipes?page=1&limit=10"

# Combined
curl "http://localhost:3000/api/recipes?search=kurczak&sort=created_desc&page=1&limit=5"
```

**6.4. Test walidacji (400)**

```bash
# Invalid limit (> 100)
curl "http://localhost:3000/api/recipes?limit=200"
# Expected: 400 Bad Request z validation details

# Invalid page (< 1)
curl "http://localhost:3000/api/recipes?page=0"
# Expected: 400 Bad Request

# Invalid sort value
curl "http://localhost:3000/api/recipes?sort=invalid"
# Expected: 400 Bad Request
```

**6.5. Test edge cases**

```bash
# Empty search
curl "http://localhost:3000/api/recipes?search="
# Expected: 200 OK (ignores empty search)

# Very large page number (beyond total_pages)
curl "http://localhost:3000/api/recipes?page=9999"
# Expected: 200 OK with empty data array

# Special characters in search
curl "http://localhost:3000/api/recipes?search=%27OR%201=1--"
# Expected: 200 OK (no SQL injection, just search for that string)
```

---

### Krok 7: Integracja z frontendem (Preview)

**Zadanie:**

- Przygotuj przykładowy hook React Query (opcjonalnie)
- Dokumentacja API dla frontend team

**Przykładowy hook (future):**

```typescript
// src/components/hooks/useRecipes.ts
import { useQuery } from "@tanstack/react-query";
import type { PaginatedResponse, RecipeListItemDto } from "@/types";

interface UseRecipesParams {
  search?: string;
  sort?: "name_asc" | "name_desc" | "created_asc" | "created_desc";
  page?: number;
  limit?: number;
}

export function useRecipes(params: UseRecipesParams = {}) {
  return useQuery({
    queryKey: ["recipes", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params.search) searchParams.set("search", params.search);
      if (params.sort) searchParams.set("sort", params.sort);
      if (params.page) searchParams.set("page", String(params.page));
      if (params.limit) searchParams.set("limit", String(params.limit));

      const response = await fetch(`/api/recipes?${searchParams}`);

      if (!response.ok) {
        throw new Error("Failed to fetch recipes");
      }

      return response.json() as Promise<PaginatedResponse<RecipeListItemDto>>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

**Dokumentacja dla frontend (API Contract):**

- Endpoint: `GET /api/recipes`
- Base URL: `/api/recipes`
- Query Params: search, sort, page, limit
- Response Type: `PaginatedResponse<RecipeListItemDto>`
- Error Handling: Check response.ok, parse error body

---

### Krok 8: Code Review Checklist

**Przed mergem do głównej gałęzi:**

**✅ Functionality:**

- [ ] Endpoint zwraca poprawną listę przepisów dla zalogowanego użytkownika
- [ ] Search działa case-insensitive
- [ ] Wszystkie opcje sortowania działają poprawnie
- [ ] Paginacja zwraca correct data i metadata
- [ ] Empty results zwracają pustą tablicę (nie error)

**✅ Security:**

- [ ] Authentication check na początku handlera
- [ ] User widzi tylko swoje przepisy (RLS + explicit filter)
- [ ] Parametry query są walidowane przez Zod
- [ ] Nie ma SQL injection vulnerability (query builder)
- [ ] Error responses nie expose sensitive data

**✅ Performance:**

- [ ] Indeksy w bazie danych utworzone
- [ ] Brak N+1 queries (sprawdź Supabase logs)
- [ ] Pagination limit max 100
- [ ] Query time < 200ms (sprawdź w Supabase Dashboard)

**✅ Code Quality:**

- [ ] TypeScript: brak any types, wszystkie typy z types.ts
- [ ] Error handling: try-catch w handlerze, throw w service
- [ ] Logging: console.error z kontekstem dla debug
- [ ] Comments: JSDoc dla publicznych funkcji
- [ ] Naming: czytelne nazwy zmiennych i funkcji

**✅ Testing:**

- [ ] Testy manualne przeprowadzone (wszystkie scenariusze z Kroku 6)
- [ ] Test authentication (401)
- [ ] Test validation errors (400)
- [ ] Test happy path (200)
- [ ] Test edge cases

**✅ Documentation:**

- [ ] Plan implementacji zapisany w `.ai/doc/`
- [ ] API contract documented dla frontend team
- [ ] README zaktualizowany (jeśli potrzebne)

---

### Krok 9: Deployment

**9.1. Commit changes:**

```bash
git add src/pages/api/recipes/index.ts
git add src/lib/services/recipe.service.ts
git add src/lib/validation/recipe.schema.ts
git commit -m "feat(api): implement GET /api/recipes endpoint

- Add recipe list endpoint with search, sort, pagination
- Implement getRecipesList service function
- Add recipeListQuerySchema for validation
- Create database indexes for performance
- Add comprehensive error handling and logging

Closes #XX"
```

**9.2. Deploy to staging:**

```bash
git push origin feature/get-recipes-endpoint
# Create PR → Review → Merge to develop
```

**9.3. Verify on staging:**

- Test endpoint na staging URL
- Sprawdź Supabase logs
- Sprawdź Vercel logs dla błędów

**9.4. Deploy to production:**

```bash
# Merge develop → master
# Automatic deploy via Vercel
```

**9.5. Post-deployment verification:**

- Test endpoint na production URL
- Monitor Sentry dla errors (jeśli skonfigurowany)
- Sprawdź metryki w Vercel Analytics

---

### Krok 10: Monitoring i optymalizacja

**Co monitorować:**

- Response time (target: p95 < 200ms)
- Error rate (target: < 0.1%)
- Most common search queries
- Pagination patterns (which pages are most accessed)

**Tools:**

- Supabase Dashboard: Query Performance
- Vercel Analytics: Endpoint latency
- Browser DevTools: Network tab

**Optymalizacje post-launch:**

- Add caching if needed (Redis/Vercel KV)
- Optimize indexes based on actual query patterns
- Consider cursor-based pagination if offset becomes slow

---

## 10. Podsumowanie

### Kluczowe cechy implementacji

✅ **Bezpieczeństwo:**

- Authentication via Supabase Auth
- RLS + explicit user_id filtering
- Zod validation dla wszystkich inputów
- SQL injection protection

✅ **Wydajność:**

- Database indexing (user_id, created_at, name)
- Agregacja składników w jednym query
- Pagination limit max 100
- Lightweight DTOs (tylko potrzebne pola)

✅ **Niezawodność:**

- Comprehensive error handling (401, 400, 500)
- Graceful degradation (empty results)
- Error logging z kontekstem
- Type safety (TypeScript + Zod)

✅ **Maintainability:**

- Clean separation: route → service → database
- Reusable validation schemas
- Well-documented code (JSDoc)
- Follows project conventions (CLAUDE.md)

### Następne kroki po implementacji

1. **Frontend Integration:**
   - Utwórz React Query hook (`useRecipes`)
   - Implementuj UI komponent dla listy przepisów
   - Dodaj search bar i sort dropdown
   - Implementuj pagination controls

2. **Testing:**
   - Unit tests dla `getRecipesList` service
   - Integration tests dla API route
   - E2E tests w Playwright/Cypress

3. **Enhancements (future):**
   - Cursor-based pagination
   - Redis caching
   - Elasticsearch dla advanced search
   - Faceted filters (by ingredient count, date range)

---

**Plan utworzony:** 2025-01-31
**Wersja:** 1.0
**Status:** Ready for implementation
