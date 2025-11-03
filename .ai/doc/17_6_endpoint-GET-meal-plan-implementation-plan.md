# API Endpoint Implementation Plan: GET /api/meal-plan

## 1. Przegląd punktu końcowego

Endpoint GET `/api/meal-plan` zwraca wszystkie przypisania posiłków (meal plan assignments) dla zalogowanego użytkownika w określonym tygodniu. Tydzień jest zdefiniowany przez datę poniedziałku (`week_start_date`). Endpoint łączy dane z tabel `meal_plan` i `recipes` aby dostarczyć pełne informacje o każdym przypisaniu, włączając nazwę przepisu.

**Główne funkcje:**
- Pobieranie przypisań posiłków dla określonego tygodnia
- Automatyczne obliczanie daty końca tygodnia (niedziela)
- Zwracanie nazw przepisów wraz z przypisaniami (JOIN z tabelą recipes)
- Sortowanie przypisań według dnia tygodnia i typu posiłku
- Obsługa pustych tygodni (brak przypisań)

## 2. Szczegóły żądania

**Metoda HTTP:** `GET`

**Struktura URL:** `/api/meal-plan?week_start_date=YYYY-MM-DD`

**Parametry:**

### Query Parameters:

**Wymagane:**
- `week_start_date` (string): Data poniedziałku w formacie ISO (YYYY-MM-DD)
  - Format: YYYY-MM-DD (np. "2025-01-20")
  - Walidacja: regex `/^\d{4}-\d{2}-\d{2}$/`
  - Przykład: `2025-01-20`

**Opcjonalne:** brak

**Request Body:** N/A (metoda GET)

**Headers:**
- Cookie zawierający sesję Supabase (automatyczne przez middleware)

## 3. Wykorzystywane typy

### Query Parameters:
```typescript
// Zaimportowany z src/types.ts (line 356-358)
export interface MealPlanQueryParams {
  week_start_date: string; // YYYY-MM-DD
}
```

### Response DTO:
```typescript
// Zaimportowany z src/types.ts (line 163-167)
export interface WeekCalendarResponseDto {
  week_start_date: string;     // YYYY-MM-DD
  week_end_date: string;        // YYYY-MM-DD (zawsze niedziela)
  assignments: MealPlanAssignmentDto[];
}

// Zaimportowany z src/types.ts (line 148-157)
export interface MealPlanAssignmentDto {
  id: string;                   // UUID
  user_id: string;              // UUID
  recipe_id: string;            // UUID
  recipe_name: string;          // Nazwa przepisu (z JOIN)
  week_start_date: string;      // YYYY-MM-DD
  day_of_week: number;          // 1-7 (1=Pon, 7=Niedz)
  meal_type: MealType;          // breakfast | second_breakfast | lunch | dinner
  created_at: string;           // ISO 8601
}

// Zaimportowany z src/types.ts (line 40)
export type MealType = "breakfast" | "second_breakfast" | "lunch" | "dinner";
```

### Error Response:
```typescript
// Zaimportowany z src/types.ts (line 373-376)
export interface ErrorResponseDto {
  error: string;
  message?: string;
}

// Zaimportowany z src/types.ts (line 386-389)
export interface ValidationErrorResponseDto {
  error: string;
  details: ValidationErrorDetails;
}
```

### Validation Schema (do utworzenia):
```typescript
// src/lib/validation/meal-plan.schema.ts
import { z } from "zod";

export const mealPlanQuerySchema = z.object({
  week_start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Expected YYYY-MM-DD")
    .refine(
      (date) => !isNaN(Date.parse(date)),
      "Invalid date. Must be a valid ISO date"
    ),
});

export type MealPlanQueryInput = z.infer<typeof mealPlanQuerySchema>;
```

## 4. Szczegóły odpowiedzi

### Success Response (200 OK):

```json
{
  "week_start_date": "2025-01-20",
  "week_end_date": "2025-01-26",
  "assignments": [
    {
      "id": "750e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440099",
      "recipe_id": "550e8400-e29b-41d4-a716-446655440000",
      "recipe_name": "Scrambled Eggs",
      "week_start_date": "2025-01-20",
      "day_of_week": 1,
      "meal_type": "breakfast",
      "created_at": "2025-01-20T08:00:00Z"
    },
    {
      "id": "750e8400-e29b-41d4-a716-446655440001",
      "user_id": "550e8400-e29b-41d4-a716-446655440099",
      "recipe_id": "550e8400-e29b-41d4-a716-446655440001",
      "recipe_name": "Spaghetti Carbonara",
      "week_start_date": "2025-01-20",
      "day_of_week": 1,
      "meal_type": "lunch",
      "created_at": "2025-01-20T09:00:00Z"
    }
  ]
}
```

**Uwagi:**
- Puste tygodnie zwracają pustą tablicę `assignments: []`
- Assignments są posortowane według `day_of_week` (1-7) i `meal_type` (w kolejności: breakfast, second_breakfast, lunch, dinner)
- `week_end_date` jest automatycznie obliczany jako `week_start_date + 6 dni`

### Error Responses:

**400 Bad Request - Brak wymaganego parametru:**
```json
{
  "error": "Validation failed",
  "details": {
    "week_start_date": ["Required"]
  }
}
```

**400 Bad Request - Nieprawidłowy format daty:**
```json
{
  "error": "Validation failed",
  "details": {
    "week_start_date": ["Invalid date format. Expected YYYY-MM-DD"]
  }
}
```

**401 Unauthorized - Brak autentykacji:**
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## 5. Przepływ danych

### Krok po kroku:

1. **Request arrives** → GET /api/meal-plan?week_start_date=2025-01-20

2. **Astro Middleware** → Sprawdza i odświeża sesję Supabase (automatyczne)

3. **Endpoint Handler** (`src/pages/api/meal-plan/index.ts`)
   - Parsuje query parameters z URL
   - Waliduje params używając `mealPlanQuerySchema.safeParse()`
   - Jeśli walidacja niepowodzenie → return 400 Bad Request

4. **Authentication Check**
   - Wywołuje `locals.supabase.auth.getUser()`
   - Jeśli błąd lub brak user → return 401 Unauthorized

5. **Service Call** (`src/lib/services/meal-plan.service.ts`)
   - Wywołuje `getMealPlanForWeek(supabase, userId, weekStartDate)`
   - Service wykonuje SQL query z JOIN:
     ```sql
     SELECT
       meal_plan.*,
       recipes.name as recipe_name
     FROM meal_plan
     INNER JOIN recipes ON meal_plan.recipe_id = recipes.id
     WHERE
       meal_plan.user_id = $userId
       AND meal_plan.week_start_date = $weekStartDate
     ORDER BY
       meal_plan.day_of_week ASC
     ```

6. **Data Processing** (w service)
   - Oblicza `week_end_date` (week_start_date + 6 dni)
   - Sortuje assignments według `day_of_week` i `meal_type`
   - Mapuje dane do `MealPlanAssignmentDto[]`
   - Konstruuje `WeekCalendarResponseDto`

7. **Response**
   - Return 200 OK z JSON body
   - Jeśli błąd bazy danych → catch i return 500

### Diagram przepływu danych:

```
Client Request
     ↓
[Astro Middleware] - Session refresh
     ↓
[API Endpoint Handler]
     ├─→ Parse & Validate Query Params (Zod)
     ├─→ Authentication Check (Supabase)
     └─→ [Service Layer]
           ├─→ Database Query (JOIN meal_plan + recipes)
           ├─→ Calculate week_end_date
           ├─→ Sort assignments
           └─→ Map to DTOs
     ↓
Response (JSON)
```

## 6. Względy bezpieczeństwa

### 6.1 Authentication & Authorization

**Authentication:**
- Endpoint wymaga zalogowanego użytkownika
- Sprawdzanie przez `locals.supabase.auth.getUser()`
- Jeśli brak sesji → zwróć 401 Unauthorized
- Session zarządzana przez Astro middleware i Supabase cookies

**Authorization:**
- RLS (Row Level Security) na tabeli `meal_plan` zapewnia, że użytkownik widzi tylko swoje dane
- Policy RLS: `auth.uid() = user_id`
- Dodatkowy filtr w query: `.eq("user_id", userId)`
- Recipes są dostępne tylko przez JOIN, więc użytkownik widzi tylko przepisy przypisane do swojego meal plan

### 6.2 Input Validation

**Query Parameter Validation:**
- Zod schema waliduje `week_start_date`:
  - Format: YYYY-MM-DD (regex)
  - Prawidłowa data ISO (Date.parse)
  - Required field
- Zapobiega SQL injection (parametryzowane query przez Supabase client)
- Zapobiega nieprawidłowym formatom dat

**Sanitization:**
- Supabase client automatycznie sanitizes wszystkie parametry
- Używamy `.eq()` i `.select()` z parametrami, nigdy raw SQL strings

### 6.3 Data Access Control

**RLS Policies:**
- Tabela `meal_plan`: Użytkownik może czytać tylko swoje rekordy (user_id = auth.uid())
- Tabela `recipes`: Użytkownik może czytać tylko swoje przepisy (user_id = auth.uid())
- JOIN automatycznie respektuje RLS policies

**Sensitive Data:**
- Response nie zawiera wrażliwych danych oprócz user_id (który należy do zalogowanego użytkownika)
- Nie ma ryzyka wycieku danych innych użytkowników dzięki RLS

### 6.4 Rate Limiting & Abuse Prevention

**Recommendations (future):**
- Implementacja rate limiting na poziomie Vercel (100 requests/minute per IP)
- Monitoring nietypowych wzorców zapytań (Sentry)
- Cache responses per user (opcjonalne, jeśli wydajność stanie się problemem)

## 7. Obsługa błędów

### 7.1 Validation Errors (400 Bad Request)

**Scenariusz 1: Brak parametru `week_start_date`**
```typescript
// Query: GET /api/meal-plan
// Response: 400
{
  "error": "Validation failed",
  "details": {
    "week_start_date": ["Required"]
  }
}
```

**Scenariusz 2: Nieprawidłowy format daty**
```typescript
// Query: GET /api/meal-plan?week_start_date=20250120
// Response: 400
{
  "error": "Validation failed",
  "details": {
    "week_start_date": ["Invalid date format. Expected YYYY-MM-DD"]
  }
}
```

**Scenariusz 3: Nieprawidłowa data**
```typescript
// Query: GET /api/meal-plan?week_start_date=2025-13-40
// Response: 400
{
  "error": "Validation failed",
  "details": {
    "week_start_date": ["Invalid date. Must be a valid ISO date"]
  }
}
```

### 7.2 Authentication Errors (401 Unauthorized)

**Scenariusz: Brak sesji użytkownika**
```typescript
// User nie zalogowany lub sesja wygasła
// Response: 401
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**Handling:**
- Frontend powinien przekierować do strony logowania
- Display user-friendly message: "Sesja wygasła. Zaloguj się ponownie."

### 7.3 Server Errors (500 Internal Server Error)

**Scenariusz 1: Błąd bazy danych**
```typescript
// Database connection issue, query timeout, etc.
// Response: 500
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

**Scenariusz 2: JOIN error (recipe deleted but assignment exists)**
```typescript
// Orphaned meal_plan record (recipe was deleted)
// Response: 500 (lub obsługa w service - pominąć takie rekordy)
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

**Handling:**
- Log error do console i Sentry (TODO w implementacji)
- Zwróć ogólny komunikat bez szczegółów technicznych
- Monitor frequency w Sentry dashboard

### 7.4 Edge Cases

**Przypadek 1: Pusty tydzień (brak przypisań)**
```typescript
// Response: 200 OK
{
  "week_start_date": "2025-01-20",
  "week_end_date": "2025-01-26",
  "assignments": []
}
```
**Handling:** To jest prawidłowa odpowiedź, nie błąd.

**Przypadek 2: Data z przeszłości lub przyszłości**
```typescript
// Response: 200 OK (endpoint akceptuje dowolną datę)
// Business logic nie ogranicza zakresu dat
```

**Przypadek 3: Data nie jest poniedziałkiem**
```typescript
// Response: 200 OK (endpoint akceptuje dowolną datę jako week_start_date)
// Odpowiedzialność za przekazanie poniedziałku leży po stronie frontendu
```

### 7.5 Error Logging Strategy

```typescript
// W endpoint handler:
catch (error) {
  console.error("Error in GET /api/meal-plan:", error);

  // TODO: Add Sentry logging
  // Sentry.captureException(error, {
  //   tags: { endpoint: 'GET /api/meal-plan' },
  //   user: { id: user.id },
  //   extra: { week_start_date: validatedParams.week_start_date }
  // });

  return new Response(JSON.stringify({
    error: "Internal server error",
    message: "An unexpected error occurred"
  }), {
    status: 500,
    headers: { "Content-Type": "application/json" }
  });
}
```

## 8. Rozważania dotyczące wydajności

### 8.1 Database Query Optimization

**Indeksy wymagane:**
- Index na `meal_plan(user_id, week_start_date)` - compound index dla szybkiego filtrowania
- Index na `meal_plan(recipe_id)` - dla JOIN z recipes
- Index na `recipes(id)` - PRIMARY KEY, już istnieje

**Query Performance:**
- JOIN z recipes jest efektywny (indexed foreign key)
- Filtrowanie po user_id + week_start_date jest szybkie (compound index)
- Tydzień zawiera max 28 przypisań (7 dni × 4 posiłki), więc payload jest mały

**Expected Query Time:** < 50ms dla typowego przypadku

### 8.2 Response Size

**Typical Response:**
- Empty week: ~100 bytes
- Full week (28 assignments): ~5-8 KB
- Bardzo mały payload, nie wymaga compression

### 8.3 Caching Considerations

**Server-side caching:**
- **Nie zalecane** dla tego endpointa
- Dane zmieniają się często (użytkownik może edytować meal plan)
- Cache invalidation byłby skomplikowany

**Client-side caching:**
- Frontend może cache'ować response per week (SWR, React Query)
- Revalidate on focus lub co 5 minut
- Cache key: `meal-plan-${week_start_date}`

### 8.4 N+1 Query Prevention

**Potencjalny problem:**
- NIE występuje - używamy JOIN w pojedynczym query
- Recipes są fetch'owane jednocześnie z meal_plan assignments

**Implementacja:**
```typescript
// Service używa single query z JOIN:
const { data, error } = await supabase
  .from("meal_plan")
  .select(`
    *,
    recipes (
      name
    )
  `)
  .eq("user_id", userId)
  .eq("week_start_date", weekStartDate)
  .order("day_of_week", { ascending: true });
```

### 8.5 Scalability

**Current MVP:**
- User ma max ~100 recipes
- Meal plan max 28 assignments/tydzień
- Query zwraca max 28 rekordów → bardzo szybkie

**Future considerations (>10K users):**
- Database indexes wystarczą dla 10K-100K users
- Consider connection pooling (Supabase ma to built-in)
- Monitor slow queries w Supabase dashboard

### 8.6 Potential Bottlenecks

**Identyfikowane wąskie gardła:**
1. **Database connection latency** (50-100ms)
   - Mitigation: Supabase edge functions (future)
2. **Cold start (Vercel serverless)** (500ms-2s)
   - Mitigation: Keep functions warm w production (Vercel Pro)
3. **JOIN performance** jeśli brak indexów
   - Mitigation: Ensure indexes are created (migration)

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematu walidacji Zod

**File:** `src/lib/validation/meal-plan.schema.ts`

```typescript
import { z } from "zod";

/**
 * Zod schema for validating GET /api/meal-plan query parameters
 * Validates week_start_date in YYYY-MM-DD format
 */
export const mealPlanQuerySchema = z.object({
  week_start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Expected YYYY-MM-DD")
    .refine(
      (date) => !isNaN(Date.parse(date)),
      "Invalid date. Must be a valid ISO date"
    )
    .describe("ISO date string for Monday of the week (YYYY-MM-DD)"),
});

export type MealPlanQueryInput = z.infer<typeof mealPlanQuerySchema>;
```

**Testowanie:**
- Valid: `"2025-01-20"` ✓
- Invalid format: `"20250120"` ✗
- Invalid date: `"2025-13-40"` ✗
- Missing: `undefined` ✗

---

### Krok 2: Utworzenie service layer

**File:** `src/lib/services/meal-plan.service.ts`

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { WeekCalendarResponseDto, MealPlanAssignmentDto, MealType } from "@/types";

type SupabaseClientType = SupabaseClient<Database>;

/**
 * Helper: Calculate week end date (Sunday) from week start date (Monday)
 *
 * @param weekStartDate - ISO date string (YYYY-MM-DD) for Monday
 * @returns ISO date string (YYYY-MM-DD) for Sunday (6 days later)
 */
function calculateWeekEndDate(weekStartDate: string): string {
  const startDate = new Date(weekStartDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6); // Add 6 days to get Sunday

  return endDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
}

/**
 * Helper: Define meal type order for sorting
 */
const MEAL_TYPE_ORDER: Record<MealType, number> = {
  breakfast: 0,
  second_breakfast: 1,
  lunch: 2,
  dinner: 3,
};

/**
 * Get meal plan assignments for a specific week with recipe names
 *
 * This function performs the following steps:
 * 1. Query meal_plan table with JOIN to recipes table
 * 2. Filter by user_id and week_start_date
 * 3. Sort by day_of_week and meal_type
 * 4. Calculate week_end_date
 * 5. Map to DTOs and return WeekCalendarResponseDto
 *
 * @param supabase - Authenticated Supabase client
 * @param userId - User ID from auth session
 * @param weekStartDate - ISO date string for Monday (YYYY-MM-DD)
 * @returns WeekCalendarResponseDto with assignments and week dates
 * @throws Error if database query fails
 */
export async function getMealPlanForWeek(
  supabase: SupabaseClientType,
  userId: string,
  weekStartDate: string
): Promise<WeekCalendarResponseDto> {
  // Step 1: Query meal_plan with JOIN to recipes
  const { data, error } = await supabase
    .from("meal_plan")
    .select(`
      id,
      user_id,
      recipe_id,
      week_start_date,
      day_of_week,
      meal_type,
      created_at,
      recipes (
        name
      )
    `)
    .eq("user_id", userId)
    .eq("week_start_date", weekStartDate)
    .order("day_of_week", { ascending: true });

  if (error) {
    console.error("Database error in getMealPlanForWeek:", error);
    throw new Error(`Failed to fetch meal plan: ${error.message}`);
  }

  // Step 2: Calculate week end date
  const weekEndDate = calculateWeekEndDate(weekStartDate);

  // Step 3: Map data to MealPlanAssignmentDto[]
  const assignments: MealPlanAssignmentDto[] = (data || [])
    .map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      recipe_id: item.recipe_id,
      recipe_name: item.recipes?.name || "Unknown Recipe",
      week_start_date: item.week_start_date,
      day_of_week: item.day_of_week,
      meal_type: item.meal_type,
      created_at: item.created_at,
    }))
    // Step 4: Sort by day_of_week first, then by meal_type
    .sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) {
        return a.day_of_week - b.day_of_week;
      }
      return MEAL_TYPE_ORDER[a.meal_type] - MEAL_TYPE_ORDER[b.meal_type];
    });

  // Step 5: Return WeekCalendarResponseDto
  return {
    week_start_date: weekStartDate,
    week_end_date: weekEndDate,
    assignments,
  };
}
```

**Uwagi implementacyjne:**
- `calculateWeekEndDate` używa natywnego Date API (brak external dependencies)
- Sortowanie jest dwupoziomowe: day_of_week → meal_type
- Obsługa edge case: jeśli recipe nie istnieje (orphaned assignment) → `"Unknown Recipe"`
- Empty weeks zwracają `assignments: []`

---

### Krok 3: Utworzenie API endpoint handler

**File:** `src/pages/api/meal-plan/index.ts`

```typescript
export const prerender = false;

import type { APIRoute } from "astro";
import { mealPlanQuerySchema } from "@/lib/validation/meal-plan.schema";
import { getMealPlanForWeek } from "@/lib/services/meal-plan.service";
import type { WeekCalendarResponseDto, ErrorResponseDto, ValidationErrorResponseDto } from "@/types";

/**
 * GET /api/meal-plan - Get meal plan assignments for a specific week
 *
 * Returns all meal plan assignments for the authenticated user for a given week.
 * Requires valid Supabase session cookie.
 *
 * @param request - HTTP request
 * @param url - Request URL with query parameters
 * @param locals - Astro locals containing supabase client
 * @returns 200 OK with WeekCalendarResponseDto on success
 * @returns 400 Bad Request if validation fails
 * @returns 401 Unauthorized if not authenticated
 * @returns 500 Internal Server Error if database operation fails
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Step 1: Parse query parameters
    const queryParams = Object.fromEntries(url.searchParams);

    // Step 2: Validate query parameters with Zod
    const validation = mealPlanQuerySchema.safeParse(queryParams);

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

    // Step 3: Authentication check
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

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

    // Step 4: Fetch meal plan via service
    const result: WeekCalendarResponseDto = await getMealPlanForWeek(
      locals.supabase,
      user.id,
      validation.data.week_start_date
    );

    // Step 5: Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 6: Error handling
    console.error("Error in GET /api/meal-plan:", error);

    // TODO: Add Sentry logging
    // Sentry.captureException(error, {
    //   tags: { endpoint: 'GET /api/meal-plan' },
    //   user: { id: user.id },
    //   extra: { week_start_date: validation.data.week_start_date }
    // });

    const errorResponse: ErrorResponseDto = {
      error: "Internal server error",
      message: "An unexpected error occurred",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

**Uwagi:**
- `export const prerender = false` - wymagane dla API routes w Astro
- Kolejność kroków: Parse → Validate → Auth → Service → Response
- Early returns dla error conditions (guard clauses)
- User-friendly error messages bez szczegółów technicznych w 500 errors

---

### Krok 4: Testowanie manualne

**Test 1: Successful request**
```bash
# Request
curl -X GET 'http://localhost:3000/api/meal-plan?week_start_date=2025-01-20' \
  -H 'Cookie: sb-access-token=...; sb-refresh-token=...'

# Expected: 200 OK
{
  "week_start_date": "2025-01-20",
  "week_end_date": "2025-01-26",
  "assignments": [...]
}
```

**Test 2: Empty week**
```bash
# Request for week with no assignments
curl -X GET 'http://localhost:3000/api/meal-plan?week_start_date=2025-02-01' \
  -H 'Cookie: sb-access-token=...; sb-refresh-token=...'

# Expected: 200 OK
{
  "week_start_date": "2025-02-01",
  "week_end_date": "2025-02-07",
  "assignments": []
}
```

**Test 3: Missing parameter**
```bash
# Request without week_start_date
curl -X GET 'http://localhost:3000/api/meal-plan' \
  -H 'Cookie: sb-access-token=...; sb-refresh-token=...'

# Expected: 400 Bad Request
{
  "error": "Validation failed",
  "details": {
    "week_start_date": ["Required"]
  }
}
```

**Test 4: Invalid date format**
```bash
# Request with invalid format
curl -X GET 'http://localhost:3000/api/meal-plan?week_start_date=20250120' \
  -H 'Cookie: sb-access-token=...; sb-refresh-token=...'

# Expected: 400 Bad Request
{
  "error": "Validation failed",
  "details": {
    "week_start_date": ["Invalid date format. Expected YYYY-MM-DD"]
  }
}
```

**Test 5: Unauthorized**
```bash
# Request without session cookie
curl -X GET 'http://localhost:3000/api/meal-plan?week_start_date=2025-01-20'

# Expected: 401 Unauthorized
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

---

### Krok 5: Weryfikacja database indexes

**Sprawdź istniejące indeksy:**
```sql
-- W Supabase SQL Editor:
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'meal_plan';
```

**Jeśli brakuje compound index na (user_id, week_start_date), utwórz:**
```sql
-- Migration file lub Supabase SQL Editor:
CREATE INDEX IF NOT EXISTS idx_meal_plan_user_week
ON meal_plan(user_id, week_start_date);

-- Opcjonalnie: index na recipe_id dla JOIN
CREATE INDEX IF NOT EXISTS idx_meal_plan_recipe
ON meal_plan(recipe_id);
```

**Weryfikacja performance:**
```sql
-- Explain query plan:
EXPLAIN ANALYZE
SELECT
  meal_plan.*,
  recipes.name as recipe_name
FROM meal_plan
INNER JOIN recipes ON meal_plan.recipe_id = recipes.id
WHERE
  meal_plan.user_id = 'some-uuid'
  AND meal_plan.week_start_date = '2025-01-20'
ORDER BY meal_plan.day_of_week;

-- Expected: Index Scan na idx_meal_plan_user_week
```

---

### Krok 6: Integracja z frontendem (Wytyczne)

**React hook example (dla zespołu frontend):**

```typescript
// src/components/hooks/useMealPlan.ts
import { useState, useEffect } from 'react';
import type { WeekCalendarResponseDto, ErrorResponseDto } from '@/types';

export function useMealPlan(weekStartDate: string) {
  const [data, setData] = useState<WeekCalendarResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMealPlan() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/meal-plan?week_start_date=${weekStartDate}`
        );

        if (!response.ok) {
          const errorData: ErrorResponseDto = await response.json();
          throw new Error(errorData.message || errorData.error);
        }

        const result: WeekCalendarResponseDto = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchMealPlan();
  }, [weekStartDate]);

  return { data, loading, error };
}
```

**Usage w komponencie:**

```typescript
// src/components/MealPlanCalendar.tsx
import { useMealPlan } from '@/components/hooks/useMealPlan';

export function MealPlanCalendar({ weekStartDate }: { weekStartDate: string }) {
  const { data, loading, error } = useMealPlan(weekStartDate);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return null;

  return (
    <div>
      <h2>Week: {data.week_start_date} - {data.week_end_date}</h2>
      {data.assignments.length === 0 ? (
        <p>No meals planned for this week</p>
      ) : (
        <ul>
          {data.assignments.map((assignment) => (
            <li key={assignment.id}>
              Day {assignment.day_of_week} - {assignment.meal_type}: {assignment.recipe_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

### Krok 7: Error monitoring setup (TODO dla zespołu)

**Sentry Integration (future):**

```typescript
// src/lib/sentry.ts (do utworzenia)
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: import.meta.env.SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});

// W endpoint handler:
catch (error) {
  console.error("Error in GET /api/meal-plan:", error);

  Sentry.captureException(error, {
    tags: { endpoint: 'GET /api/meal-plan' },
    user: { id: user.id },
    extra: {
      week_start_date: validation.data.week_start_date,
      timestamp: new Date().toISOString()
    }
  });

  // ... return 500 response
}
```

---

### Krok 8: Documentation update

**Aktualizuj API documentation:**
- Dodaj endpoint do README.md lub API docs
- Dokumentuj query parameters i response format
- Przykłady curl commands

**Update types.ts (jeśli potrzebne):**
- Wszystkie typy już istnieją w `src/types.ts`
- Sprawdź czy wszystkie DTOs są exported

---

## 10. Podsumowanie i Checklist

### Pre-Implementation Checklist:
- [ ] Przejrzyj plan implementacji z zespołem
- [ ] Potwierdź że wszystkie wymagane typy istnieją w `src/types.ts`
- [ ] Sprawdź istniejące database indexes
- [ ] Upewnij się że Supabase RLS policies są włączone

### Implementation Checklist:
- [ ] **Krok 1:** Utwórz `src/lib/validation/meal-plan.schema.ts`
- [ ] **Krok 2:** Utwórz `src/lib/services/meal-plan.service.ts`
- [ ] **Krok 3:** Utwórz `src/pages/api/meal-plan/index.ts`
- [ ] **Krok 4:** Przeprowadź testy manualne (5 test cases)
- [ ] **Krok 5:** Weryfikuj database indexes
- [ ] **Krok 6:** Dostarcz dokumentację dla zespołu frontend

### Post-Implementation Checklist:
- [ ] Run `npm run lint` i popraw błędy
- [ ] Testuj endpoint w dev environment
- [ ] Code review z zespołem
- [ ] Merge do main branch
- [ ] Deploy do production
- [ ] Monitor w Sentry dashboard (jeśli skonfigurowany)

---

## 11. Dodatkowe uwagi

### Performance Baseline (Expected):
- Cold start (first request): ~500ms-1s
- Warm requests: ~50-150ms
- Empty week response: ~50ms
- Full week (28 assignments): ~100-150ms

### Future Enhancements (Out of MVP scope):
1. **Caching:** Implementacja Redis cache dla często pobieranych tygodni
2. **Bulk fetch:** Endpoint do pobierania wielu tygodni jednocześnie (np. miesiąc)
3. **Filtering:** Query params dla filtrowania po meal_type
4. **Aggregation:** Statistics endpoint (np. most used recipes)
5. **Optimistic UI:** Frontend mutations z instant feedback

### Related Endpoints (To be implemented):
- `POST /api/meal-plan` - Create meal plan assignment
- `DELETE /api/meal-plan/:id` - Delete meal plan assignment
- `PUT /api/meal-plan/:id` - Update meal plan assignment (if needed)

---

**Document Version:** 1.0
**Last Updated:** 2025-01-03
**Author:** AI Architecture Team
**Status:** Ready for Implementation
