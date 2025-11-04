# API Endpoint Implementation Plan: POST /api/meal-plan

## 1. Przegląd punktu końcowego

**Cel:** Utworzenie przypisania przepisu do konkretnego dnia tygodnia i typu posiłku w kalendarzu tygodniowym użytkownika.

**Funkcjonalność:**
- Użytkownik przypisuje istniejący przepis do wybranego slotu w kalendarzu (dzień + typ posiłku)
- System waliduje, że przepis należy do użytkownika
- System sprawdza, czy slot nie jest już zajęty (UNIQUE constraint)
- System oblicza automatycznie `user_id` z sesji użytkownika
- Po utworzeniu zwraca pełne dane przypisania wraz z nazwą przepisu

**Kontekst biznesowy:**
- Endpoint jest kluczowy dla głównej funkcjonalności aplikacji (planowanie posiłków)
- Użytkownik może zaplanować do 28 posiłków w tygodniu (7 dni × 4 typy posiłków)
- Przypisania służą później do generowania list zakupów

---

## 2. Szczegóły żądania

### Metoda HTTP
`POST`

### Struktura URL
`/api/meal-plan`

### Parametry

**Wymagane (Request Body):**
- `recipe_id` (string, UUID) - Identyfikator przepisu do przypisania
- `week_start_date` (string, YYYY-MM-DD) - Data początku tygodnia (poniedziałek)
- `day_of_week` (number, 1-7) - Dzień tygodnia (1 = Poniedziałek, 7 = Niedziela)
- `meal_type` (string, enum) - Typ posiłku: `breakfast`, `second_breakfast`, `lunch`, `dinner`

**Opcjonalne:**
- Brak

**Automatyczne (nie w body):**
- `user_id` - Pobierany z sesji uwierzytelnionego użytkownika

### Request Body (przykład)

```json
{
  "recipe_id": "550e8400-e29b-41d4-a716-446655440000",
  "week_start_date": "2025-01-20",
  "day_of_week": 3,
  "meal_type": "lunch"
}
```

### Content-Type
`application/json`

---

## 3. Wykorzystywane typy

### Input DTOs

```typescript
// src/types.ts (linie 137-142)
export interface CreateMealPlanDto {
  recipe_id: string;
  week_start_date: string; // YYYY-MM-DD format
  day_of_week: number; // 1-7 (1 = Monday, 7 = Sunday)
  meal_type: MealType;
}

// src/types.ts (linia 40)
export type MealType = "breakfast" | "second_breakfast" | "lunch" | "dinner";
```

### Output DTOs

```typescript
// src/types.ts (linie 148-157)
export interface MealPlanAssignmentDto {
  id: string;
  user_id: string;
  recipe_id: string;
  recipe_name: string; // JOIN z tabelą recipes
  week_start_date: string;
  day_of_week: number;
  meal_type: MealType;
  created_at: string;
}
```

### Error DTOs

```typescript
// src/types.ts (linie 373-376)
export interface ErrorResponseDto {
  error: string;
  message?: string;
}

// src/types.ts (linie 386-389)
export interface ValidationErrorResponseDto {
  error: string;
  details: ValidationErrorDetails; // Record<string, string[]>
}
```

### Database Types

```typescript
// Wykorzystywane z src/db/database.types.ts
export type MealPlan = Database["public"]["Tables"]["meal_plan"]["Row"];
export type MealPlanInsert = Database["public"]["Tables"]["meal_plan"]["Insert"];
```

---

## 4. Szczegóły odpowiedzi

### Sukces (201 Created)

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

**Headers:**
- `Content-Type: application/json`
- `Location: /api/meal-plan/{id}` (opcjonalnie, jeśli istnieje GET endpoint)

### Błąd walidacji (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": {
    "day_of_week": ["Must be between 1 and 7"],
    "meal_type": ["Must be one of: breakfast, second_breakfast, lunch, dinner"],
    "week_start_date": ["Must be a valid date in YYYY-MM-DD format", "Must be Monday"]
  }
}
```

### Duplikat przypisania (400 Bad Request)

```json
{
  "error": "This meal slot is already assigned. Remove existing assignment first."
}
```

### Nieautoryzowany (401 Unauthorized)

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### Przepis nie znaleziony (404 Not Found)

```json
{
  "error": "Recipe not found or does not belong to user"
}
```

### Błąd serwera (500 Internal Server Error)

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
1. Client Request (POST /api/meal-plan)
   ↓
2. Astro API Route Handler (src/pages/api/meal-plan/index.ts)
   ↓
3. Authentication Check (context.locals.supabase.auth.getUser())
   ↓
4. Input Validation (Zod schema)
   ↓
5. Business Logic Service (src/lib/services/meal-plan.service.ts)
   ├─ Verify Recipe Ownership
   ├─ Check Duplicate Assignment
   └─ Create Assignment
   ↓
6. Database Operation (Supabase)
   ├─ INSERT into meal_plan
   └─ JOIN with recipes to get recipe_name
   ↓
7. Response Transformation (MealPlanAssignmentDto)
   ↓
8. Client Response (201 Created)
```

### Szczegółowy przepływ

**Krok 1: Otrzymanie żądania**
- Astro route handler przyjmuje żądanie POST
- Parsuje JSON body

**Krok 2: Uwierzytelnianie**
- Pobiera sesję użytkownika: `context.locals.supabase.auth.getUser()`
- Jeśli brak sesji → 401 Unauthorized

**Krok 3: Walidacja danych wejściowych**
- Zod schema waliduje:
  - `recipe_id`: UUID format
  - `week_start_date`: YYYY-MM-DD format + czy to poniedziałek
  - `day_of_week`: liczba 1-7
  - `meal_type`: jeden z dozwolonych wartości
- Jeśli walidacja nie przejdzie → 400 Bad Request z `details`

**Krok 4: Weryfikacja własności przepisu**
- Service sprawdza: `SELECT id FROM recipes WHERE id = recipe_id AND user_id = current_user_id`
- Jeśli nie istnieje → 404 Not Found

**Krok 5: Sprawdzenie duplikatów**
- Service sprawdza: `SELECT id FROM meal_plan WHERE user_id = X AND week_start_date = Y AND day_of_week = Z AND meal_type = W`
- Jeśli istnieje → 400 Bad Request (slot już zajęty)

**Krok 6: Utworzenie przypisania**
- INSERT do tabeli `meal_plan`:
  ```sql
  INSERT INTO meal_plan (user_id, recipe_id, week_start_date, day_of_week, meal_type)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING *
  ```

**Krok 7: Pobranie pełnych danych**
- SELECT z JOIN aby uzyskać `recipe_name`:
  ```sql
  SELECT
    mp.id, mp.user_id, mp.recipe_id, mp.week_start_date,
    mp.day_of_week, mp.meal_type, mp.created_at,
    r.name as recipe_name
  FROM meal_plan mp
  JOIN recipes r ON mp.recipe_id = r.id
  WHERE mp.id = $1
  ```

**Krok 8: Transformacja odpowiedzi**
- Mapowanie wyniku DB na `MealPlanAssignmentDto`
- Zwrócenie 201 Created z pełnymi danymi

### Interakcje z bazą danych

**Tabele:**
- `meal_plan` (INSERT, SELECT)
- `recipes` (SELECT dla weryfikacji + JOIN)

**Indeksy wykorzystywane:**
- Primary key index na `meal_plan.id`
- Index na `recipes.user_id` (weryfikacja własności)
- Unique constraint index na `(user_id, week_start_date, day_of_week, meal_type)`

**RLS (Row Level Security):**
- Polityki RLS zapewniają, że:
  - INSERT: `user_id` automatycznie ustawione na `auth.uid()`
  - SELECT recipes: tylko przepisy użytkownika
  - SELECT meal_plan: tylko przypisania użytkownika

---

## 6. Względy bezpieczeństwa

### Uwierzytelnianie

**Metoda:** Supabase Auth (JWT tokens w httpOnly cookies)

**Implementacja:**
```typescript
const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();

if (authError || !user) {
  return new Response(
    JSON.stringify({ error: "Unauthorized", message: "Authentication required" }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
```

**Zabezpieczenia:**
- Tokens są httpOnly (immune do XSS)
- Automatyczne odświeżanie tokenów przez Supabase client
- Session expiry handled przez Supabase

### Autoryzacja

**Weryfikacja własności przepisu:**
```typescript
// Service function
async function verifyRecipeOwnership(
  supabase: SupabaseClient,
  recipeId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('recipes')
    .select('id')
    .eq('id', recipeId)
    .eq('user_id', userId)
    .single();

  return !error && data !== null;
}
```

**Row Level Security (RLS):**
- RLS policies na tabeli `meal_plan`:
  ```sql
  -- INSERT policy
  CREATE POLICY "Users can insert their own meal plans"
  ON meal_plan FOR INSERT
  WITH CHECK (auth.uid() = user_id);

  -- SELECT policy
  CREATE POLICY "Users can view their own meal plans"
  ON meal_plan FOR SELECT
  USING (auth.uid() = user_id);
  ```

- RLS policies na tabeli `recipes`:
  ```sql
  CREATE POLICY "Users can view their own recipes"
  ON recipes FOR SELECT
  USING (auth.uid() = user_id);
  ```

**Zabezpieczenia:**
- `user_id` nigdy nie pochodzi z request body (tylko z sesji)
- Double-check: RLS + application-level verification
- Niemożliwe przypisanie cudzego przepisu

### Walidacja danych wejściowych

**Zod Schema:**
```typescript
// src/lib/validation/meal-plan.schema.ts
import { z } from 'zod';

const MEAL_TYPES = ['breakfast', 'second_breakfast', 'lunch', 'dinner'] as const;

// Custom validator for Monday check
const isMondayDate = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  return date.getDay() === 1; // 1 = Monday in JS Date
};

export const createMealPlanSchema = z.object({
  recipe_id: z.string().uuid({ message: "Invalid recipe ID format" }),

  week_start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be in YYYY-MM-DD format")
    .refine(isMondayDate, { message: "Must be Monday" }),

  day_of_week: z
    .number()
    .int()
    .min(1, "Must be between 1 and 7")
    .max(7, "Must be between 1 and 7"),

  meal_type: z.enum(MEAL_TYPES, {
    errorMap: () => ({ message: "Must be one of: breakfast, second_breakfast, lunch, dinner" })
  })
});

export type CreateMealPlanInput = z.infer<typeof createMealPlanSchema>;
```

**Sanityzacja:**
- Zod automatycznie odrzuca dodatkowe pola (strict mode)
- UUID validation zapobiega SQL injection
- Enum validation zapobiega arbitrary values
- Date format validation zapobiega invalid dates

### Ochrona przed atakami

**SQL Injection:**
- ✅ Supabase client używa prepared statements
- ✅ Wszystkie parametry są escapowane
- ✅ Zod validation zapewnia prawidłowe typy

**XSS (Cross-Site Scripting):**
- ✅ API zwraca tylko JSON (nie HTML)
- ✅ Frontend (React) automatycznie escapuje dane

**CSRF (Cross-Site Request Forgery):**
- ✅ Tokens w httpOnly cookies (not accessible from JS)
- ✅ SameSite cookie attribute (jeśli skonfigurowane)

**Rate Limiting:**
- ✅ Supabase default: 100 requests/minute per IP
- ⚠️ Consider adding endpoint-specific limits post-MVP

**Input Size Limits:**
- Request body size: limited by Astro/Vercel (default ~1MB)
- Pojedyncze przypisanie: ~200 bytes (negligible)

---

## 7. Obsługa błędów

### Scenariusze błędów i obsługa

| Kod | Scenariusz | Przyczyna | Obsługa | Message |
|-----|-----------|----------|---------|---------|
| **400** | Walidacja nie przeszła | Nieprawidłowe dane wejściowe | Return Zod errors | `"Validation failed"` + details |
| **400** | Duplikat przypisania | UNIQUE constraint violation | Catch DB error, check constraint name | `"This meal slot is already assigned..."` |
| **400** | Nieprawidłowa data | `week_start_date` nie jest poniedziałkiem | Zod refine validation | `"Must be Monday"` |
| **401** | Brak sesji | User nie zalogowany | Check auth.getUser() | `"Authentication required"` |
| **404** | Przepis nie istnieje | Invalid `recipe_id` | Check recipe existence | `"Recipe not found..."` |
| **404** | Przepis nie należy do użytkownika | Authorization failure | Check recipe ownership | `"Recipe not found..."` (same message for security) |
| **500** | Błąd bazy danych | DB connection, constraint, etc. | Catch DB errors, log to Sentry | `"An unexpected error occurred"` |
| **500** | Nieoczekiwany błąd | Any unhandled exception | Global try-catch | `"Internal server error"` |

### Implementacja obsługi błędów

**1. Walidacja Zod:**
```typescript
const validation = createMealPlanSchema.safeParse(body);

if (!validation.success) {
  return new Response(
    JSON.stringify({
      error: "Validation failed",
      details: validation.error.flatten().fieldErrors
    }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}
```

**2. Duplikat przypisania:**
```typescript
try {
  // INSERT operation
} catch (error: any) {
  // PostgreSQL unique constraint violation code: 23505
  if (error.code === '23505' || error.message?.includes('duplicate key')) {
    return new Response(
      JSON.stringify({
        error: "This meal slot is already assigned. Remove existing assignment first."
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  throw error; // re-throw if different error
}
```

**3. Przepis nie znaleziony:**
```typescript
const recipeExists = await verifyRecipeOwnership(supabase, recipe_id, user.id);

if (!recipeExists) {
  return new Response(
    JSON.stringify({
      error: "Recipe not found or does not belong to user"
    }),
    { status: 404, headers: { "Content-Type": "application/json" } }
  );
}
```

**4. Global error handler:**
```typescript
try {
  // ... całe API logic
} catch (error: unknown) {
  console.error('Error in POST /api/meal-plan:', error);

  // Log to Sentry (if configured)
  // Sentry.captureException(error);

  return new Response(
    JSON.stringify({
      error: "Internal server error",
      message: "An unexpected error occurred"
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

### Error Logging

**Poziomy logowania:**
- **400 errors:** INFO level (normal user mistakes)
- **401 errors:** WARN level (potential security issue if frequent)
- **404 errors:** INFO level (user typo or deleted resource)
- **500 errors:** ERROR level (requires investigation)

**Informacje w logach:**
```typescript
console.error({
  endpoint: 'POST /api/meal-plan',
  user_id: user?.id,
  error_type: error.constructor.name,
  error_message: error.message,
  stack: error.stack,
  request_body: body, // sanitized (no sensitive data)
  timestamp: new Date().toISOString()
});
```

**Sentry Integration:**
```typescript
import * as Sentry from '@sentry/astro';

Sentry.captureException(error, {
  tags: {
    endpoint: 'POST /api/meal-plan',
    user_id: user?.id
  },
  extra: {
    request_body: body
  }
});
```

---

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

**1. Multiple Database Queries**
- Problem: 3 separate queries (auth check, recipe verification, duplicate check, insert)
- Impact: ~30-50ms per query = 90-150ms total latency
- User perception: Acceptable dla MVP (<200ms)

**2. JOIN dla recipe_name**
- Problem: Additional query z JOIN po INSERT
- Impact: ~10-20ms
- Frequency: Every request

**3. RLS Policy Evaluation**
- Problem: PostgreSQL evaluuje RLS policies na każdym query
- Impact: ~5-10ms overhead per query
- Scale: Minimal dla MVP, może być problem przy >50k users

### Strategie optymalizacji

**Optymalizacja 1: Combine Queries (Transaction)**
```typescript
// Use Supabase transaction to combine operations
const { data, error } = await supabase.rpc('create_meal_plan_assignment', {
  p_recipe_id: recipe_id,
  p_week_start_date: week_start_date,
  p_day_of_week: day_of_week,
  p_meal_type: meal_type
});

// PostgreSQL function that:
// 1. Checks recipe ownership
// 2. Checks for duplicates
// 3. Inserts assignment
// 4. Returns result with recipe_name
// All in single round-trip
```

**Optymalizacja 2: Database Indexes**
```sql
-- Już istnieje (z database schema):
CREATE UNIQUE INDEX idx_meal_plan_unique
ON meal_plan(user_id, week_start_date, day_of_week, meal_type);

-- Dodatkowe dla performance:
CREATE INDEX idx_meal_plan_user_week
ON meal_plan(user_id, week_start_date);

CREATE INDEX idx_recipes_user_id
ON recipes(user_id);
```

**Optymalizacja 3: Connection Pooling**
- ✅ Supabase używa PgBouncer (built-in)
- ✅ Connection reuse across requests
- No action needed dla MVP

**Optymalizacja 4: Caching (Post-MVP)**
```typescript
// Cache recipe ownership checks
// Use Redis or in-memory cache (low priority dla MVP)
const cacheKey = `recipe:${recipe_id}:user:${user.id}`;
const cached = await cache.get(cacheKey);
if (cached) return true;
```

### Benchmarki oczekiwane (MVP)

| Metryka | Target | Acceptable | Critical |
|---------|--------|------------|----------|
| **Response Time (p50)** | <150ms | <300ms | >500ms |
| **Response Time (p95)** | <300ms | <500ms | >1000ms |
| **Database Query Time** | <50ms | <100ms | >200ms |
| **Throughput** | >50 req/s | >20 req/s | <10 req/s |
| **Error Rate** | <0.1% | <1% | >5% |

**Dla MVP (1000 users):**
- Oczekiwane obciążenie: ~5-10 requests/minute (peak)
- Current implementation wystarczająca (bez optymalizacji)

**Dla Growth (10k users):**
- Oczekiwane obciążenie: ~50-100 requests/minute
- Rozważyć Optymalizacja 1 (RPC function)

### Monitoring

**Metryki do śledzenia:**
- Response time (p50, p95, p99)
- Error rate per status code
- Database query latency
- RLS policy evaluation time
- Throughput (requests per minute)

**Narzędzia:**
- Vercel Analytics (built-in)
- Supabase Dashboard (query performance)
- Sentry (error tracking + performance monitoring)

---

## 9. Kroki implementacji

### Krok 1: Przygotowanie walidacji (Zod schema)

**Lokalizacja:** `src/lib/validation/meal-plan.schema.ts`

**Zadania:**
- [ ] Utwórz plik `meal-plan.schema.ts` jeśli nie istnieje
- [ ] Zaimplementuj `createMealPlanSchema` z walidacją:
  - `recipe_id`: UUID
  - `week_start_date`: YYYY-MM-DD format + custom refine (Monday check)
  - `day_of_week`: integer 1-7
  - `meal_type`: enum
- [ ] Export typu `CreateMealPlanInput`
- [ ] Dodaj helper function `isMondayDate()`

**Przykład:**
```typescript
import { z } from 'zod';

const MEAL_TYPES = ['breakfast', 'second_breakfast', 'lunch', 'dinner'] as const;

const isMondayDate = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  return date.getDay() === 1;
};

export const createMealPlanSchema = z.object({
  recipe_id: z.string().uuid(),
  week_start_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(isMondayDate, { message: "Must be Monday" }),
  day_of_week: z.number().int().min(1).max(7),
  meal_type: z.enum(MEAL_TYPES)
});
```

**Czas:** ~15 minut

---

### Krok 2: Implementacja serwisu (Business Logic)

**Lokalizacja:** `src/lib/services/meal-plan.service.ts`

**Zadania:**
- [ ] Utwórz nowy plik `meal-plan.service.ts`
- [ ] Zaimplementuj funkcję `verifyRecipeOwnership()`
- [ ] Zaimplementuj funkcję `checkDuplicateAssignment()`
- [ ] Zaimplementuj funkcję `createMealPlanAssignment()`
- [ ] Zaimplementuj funkcję `getMealPlanWithRecipeName()`

**Przykład:**
```typescript
import type { SupabaseClient } from '@/db/supabase.client';
import type { CreateMealPlanDto, MealPlanAssignmentDto } from '@/types';

/**
 * Verify that recipe exists and belongs to user
 */
export async function verifyRecipeOwnership(
  supabase: SupabaseClient,
  recipeId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('recipes')
    .select('id')
    .eq('id', recipeId)
    .eq('user_id', userId)
    .single();

  return !error && data !== null;
}

/**
 * Check if meal slot is already assigned
 */
export async function checkDuplicateAssignment(
  supabase: SupabaseClient,
  userId: string,
  weekStartDate: string,
  dayOfWeek: number,
  mealType: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('meal_plan')
    .select('id')
    .eq('user_id', userId)
    .eq('week_start_date', weekStartDate)
    .eq('day_of_week', dayOfWeek)
    .eq('meal_type', mealType)
    .single();

  return !error && data !== null;
}

/**
 * Create meal plan assignment
 */
export async function createMealPlanAssignment(
  supabase: SupabaseClient,
  userId: string,
  input: CreateMealPlanDto
): Promise<{ data: MealPlanAssignmentDto | null; error: Error | null }> {
  try {
    // Insert assignment
    const { data: assignment, error: insertError } = await supabase
      .from('meal_plan')
      .insert({
        user_id: userId,
        recipe_id: input.recipe_id,
        week_start_date: input.week_start_date,
        day_of_week: input.day_of_week,
        meal_type: input.meal_type
      })
      .select('*')
      .single();

    if (insertError) {
      return { data: null, error: insertError };
    }

    // Get full data with recipe name
    const { data: fullData, error: selectError } = await supabase
      .from('meal_plan')
      .select(`
        id,
        user_id,
        recipe_id,
        week_start_date,
        day_of_week,
        meal_type,
        created_at,
        recipes:recipe_id (name)
      `)
      .eq('id', assignment.id)
      .single();

    if (selectError || !fullData) {
      return { data: null, error: selectError || new Error('Failed to fetch assignment') };
    }

    // Transform to DTO
    const result: MealPlanAssignmentDto = {
      id: fullData.id,
      user_id: fullData.user_id,
      recipe_id: fullData.recipe_id,
      recipe_name: fullData.recipes.name,
      week_start_date: fullData.week_start_date,
      day_of_week: fullData.day_of_week,
      meal_type: fullData.meal_type,
      created_at: fullData.created_at
    };

    return { data: result, error: null };

  } catch (error) {
    return { data: null, error: error as Error };
  }
}
```

**Czas:** ~45 minut

---

### Krok 3: Implementacja endpointa API

**Lokalizacja:** `src/pages/api/meal-plan/index.ts`

**Zadania:**
- [ ] Utwórz folder `src/pages/api/meal-plan/` jeśli nie istnieje
- [ ] Utwórz plik `index.ts` (route handler)
- [ ] Dodaj `export const prerender = false`
- [ ] Implementuj `POST` function handler
- [ ] Integruj z walidacją (Zod)
- [ ] Integruj z serwisem (business logic)
- [ ] Implementuj obsługę błędów

**Struktura:**
```typescript
export const prerender = false;

import type { APIContext } from 'astro';
import { createMealPlanSchema } from '@/lib/validation/meal-plan.schema';
import {
  verifyRecipeOwnership,
  checkDuplicateAssignment,
  createMealPlanAssignment
} from '@/lib/services/meal-plan.service';

export async function POST(context: APIContext): Promise<Response> {
  try {
    // 1. Authentication
    const { data: { user }, error: authError } =
      await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required"
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Parse and validate input
    const body = await context.request.json();
    const validation = createMealPlanSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const input = validation.data;

    // 3. Verify recipe ownership
    const recipeExists = await verifyRecipeOwnership(
      context.locals.supabase,
      input.recipe_id,
      user.id
    );

    if (!recipeExists) {
      return new Response(
        JSON.stringify({
          error: "Recipe not found or does not belong to user"
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Check for duplicate assignment
    const isDuplicate = await checkDuplicateAssignment(
      context.locals.supabase,
      user.id,
      input.week_start_date,
      input.day_of_week,
      input.meal_type
    );

    if (isDuplicate) {
      return new Response(
        JSON.stringify({
          error: "This meal slot is already assigned. Remove existing assignment first."
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 5. Create assignment
    const { data: assignment, error: createError } = await createMealPlanAssignment(
      context.locals.supabase,
      user.id,
      input
    );

    if (createError || !assignment) {
      // Check if it's a duplicate key error (race condition)
      if (createError?.message?.includes('duplicate key')) {
        return new Response(
          JSON.stringify({
            error: "This meal slot is already assigned. Remove existing assignment first."
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      throw createError || new Error('Failed to create assignment');
    }

    // 6. Return success
    return new Response(
      JSON.stringify(assignment),
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (error: unknown) {
    console.error('Error in POST /api/meal-plan:', error);

    // Log to Sentry if configured
    // Sentry.captureException(error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An unexpected error occurred"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

**Czas:** ~60 minut

---

### Krok 4: Testowanie manualne

**Zadania:**
- [ ] Start dev server: `npm run dev`
- [ ] Użyj Postman/Thunder Client/curl do testowania

**Test Cases:**

**4.1. Sukces (201 Created)**
```bash
curl -X POST http://localhost:3000/api/meal-plan \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "recipe_id": "valid-uuid",
    "week_start_date": "2025-01-20",
    "day_of_week": 3,
    "meal_type": "lunch"
  }'
```

**4.2. Brak autoryzacji (401)**
```bash
curl -X POST http://localhost:3000/api/meal-plan \
  -H "Content-Type: application/json" \
  -d '{ ... }'
# (without Cookie header)
```

**4.3. Walidacja - Invalid day_of_week (400)**
```bash
curl -X POST http://localhost:3000/api/meal-plan \
  ... \
  -d '{
    "recipe_id": "valid-uuid",
    "week_start_date": "2025-01-20",
    "day_of_week": 8,
    "meal_type": "lunch"
  }'
```

**4.4. Walidacja - Not Monday (400)**
```bash
curl -X POST http://localhost:3000/api/meal-plan \
  ... \
  -d '{
    "recipe_id": "valid-uuid",
    "week_start_date": "2025-01-21",
    "day_of_week": 3,
    "meal_type": "lunch"
  }'
```

**4.5. Recipe not found (404)**
```bash
curl -X POST http://localhost:3000/api/meal-plan \
  ... \
  -d '{
    "recipe_id": "00000000-0000-0000-0000-000000000000",
    "week_start_date": "2025-01-20",
    "day_of_week": 3,
    "meal_type": "lunch"
  }'
```

**4.6. Duplikat (400)**
```bash
# Send same request twice
curl -X POST http://localhost:3000/api/meal-plan ... (same payload)
# Second request should return 400
```

**Czas:** ~30 minut

---

### Krok 5: Dodanie testów jednostkowych (opcjonalne dla MVP)

**Lokalizacja:** `src/lib/services/__tests__/meal-plan.service.test.ts`

**Zadania:**
- [ ] Setup test framework (Vitest) jeśli jeszcze nie skonfigurowane
- [ ] Testy dla `verifyRecipeOwnership()`
- [ ] Testy dla `checkDuplicateAssignment()`
- [ ] Testy dla `createMealPlanAssignment()`
- [ ] Mock Supabase client

**Przykład (szkielet):**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { verifyRecipeOwnership } from '../meal-plan.service';

describe('verifyRecipeOwnership', () => {
  it('returns true when recipe belongs to user', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'recipe-id' },
                error: null
              })
            })
          })
        })
      })
    };

    const result = await verifyRecipeOwnership(
      mockSupabase as any,
      'recipe-id',
      'user-id'
    );

    expect(result).toBe(true);
  });

  it('returns false when recipe does not belong to user', async () => {
    // ... test implementation
  });
});
```

**Czas:** ~90 minut (jeśli implementujemy)
**Priorytet:** LOW dla MVP (manual testing wystarczające)

---

### Krok 6: Dokumentacja i finalizacja

**Zadania:**
- [ ] Dodaj JSDoc comments do funkcji serwisu
- [ ] Zaktualizuj API documentation (jeśli istnieje)
- [ ] Commit changes z conventional commit message
- [ ] Create PR z opisem zmian

**Commit message:**
```
feat(api): implement POST /api/meal-plan endpoint

- Add Zod validation schema for meal plan creation
- Implement meal plan service with business logic
- Add recipe ownership verification
- Add duplicate assignment check
- Return 201 with full assignment data including recipe name
- Handle errors: 400, 401, 404, 500

Closes #ISSUE_NUMBER
```

**Czas:** ~15 minut

---

### Krok 7: Deployment i weryfikacja produkcja

**Zadania:**
- [ ] Merge PR do main branch
- [ ] Verify automatic deployment na Vercel
- [ ] Test na staging/production environment
- [ ] Monitor error logs (Sentry)
- [ ] Monitor performance (Vercel Analytics)

**Checklist produkcja:**
- ✅ RLS policies enabled na `meal_plan` table
- ✅ Indexes created (unique constraint)
- ✅ Environment variables set (Supabase keys)
- ✅ Error tracking configured (Sentry)
- ✅ HTTPS enabled (automatic via Vercel)

**Czas:** ~15 minut

---

## 10. Podsumowanie

### Szacowany czas implementacji
- **Walidacja (Zod):** 15 min
- **Serwis (Business Logic):** 45 min
- **Endpoint API:** 60 min
- **Testowanie manualne:** 30 min
- **Dokumentacja:** 15 min
- **Deployment:** 15 min
- **TOTAL:** ~3 godziny

### Kluczowe decyzje
1. ✅ Walidacja `week_start_date` jako poniedziałek (custom Zod refine)
2. ✅ Oddzielne sprawdzenie duplikatów przed INSERT (lepsze error messages)
3. ✅ JOIN z `recipes` po INSERT dla `recipe_name` (separate query)
4. ✅ Same error message dla "not found" i "not authorized" (security)
5. ✅ User-friendly error messages (po polsku na frontend)

### Potencjalne улучшения (Post-MVP)
- [ ] Batch assign multiple recipes (POST array)
- [ ] PostgreSQL function (RPC) dla atomowej operacji
- [ ] Caching recipe ownership checks
- [ ] Soft delete zamiast CASCADE DELETE
- [ ] Audit log (kto, kiedy, co zmienił)
- [ ] WebSocket notifications (realtime updates)

### Zależności
- Wymaga działającego Supabase Auth
- Wymaga tabeli `recipes` z danymi
- Wymaga RLS policies na `meal_plan` i `recipes`
- Wymaga Zod library (npm install zod)

### Metryki sukcesu
- ✅ Response time <300ms (p95)
- ✅ Error rate <1%
- ✅ Zero security vulnerabilities
- ✅ 100% test coverage (optional)
- ✅ Zero duplicate assignments (unique constraint works)

---

**Plan przygotowany:** 2025-01-26
**Autor:** Claude Code (AI Assistant)
**Status:** Ready for Implementation ✅
