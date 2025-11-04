# API Endpoint Implementation Plan: DELETE /api/meal-plan/:id

## 1. Przegląd punktu końcowego

Endpoint służy do usuwania przypisania przepisu z kalendarza tygodniowego. Operacja usuwa tylko wpis w tabeli `meal_plan` i **nie usuwa** samego przepisu z tabeli `recipes`. Jest to operacja typu "soft unassignment" - przepis pozostaje w systemie, ale przestaje być przypisany do konkretnego dnia i posiłku.

**Przypadki użycia:**
- Użytkownik chce zmienić posiłek w kalendarzu i usuwa obecne przypisanie
- Użytkownik rezygnuje z zaplanowanego posiłku
- Użytkownik koryguje błąd w planowaniu tygodnia

**Kluczowe wymagania:**
- Tylko właściciel przypisania może je usunąć (user_id validation)
- Musi być obsłużone przez RLS w Supabase + explicit check w kodzie
- Operacja atomowa (nie może pozostawić niespójności)

---

## 2. Szczegóły żądania

**Metoda HTTP:** `DELETE`

**Struktura URL:** `/api/meal-plan/:id`

**Parametry:**

- **Wymagane:**
  - `id` (string, UUID format) - Identyfikator przypisania w tabeli meal_plan
    - Lokalizacja: URL path parameter
    - Format: UUID v4 (np. `550e8400-e29b-41d4-a716-446655440000`)
    - Walidacja: Regex UUID lub Zod UUID schema

- **Opcjonalne:**
  - Brak

**Headers:**
- `Authorization: Bearer <token>` - Token JWT z Supabase Auth (automatycznie obsługiwany przez Supabase client w context.locals)

**Request Body:**
- Brak (DELETE request bez body)

**Przykład żądania:**
```http
DELETE /api/meal-plan/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: shopmate.vercel.app
Authorization: Bearer eyJhbGc...
```

---

## 3. Wykorzystywane typy

**Z `src/types.ts`:**

```typescript
// Response DTO (lines 172-174)
export interface DeleteMealPlanResponseDto {
  message: string;
}

// Error Response DTO (lines 373-376)
export interface ErrorResponseDto {
  error: string;
  message?: string;
}

// Internal types (for service layer)
export type MealPlan = Database["public"]["Tables"]["meal_plan"]["Row"];
```

**Dodatkowe typy do stworzenia (jeśli potrzebne):**

Nie są wymagane nowe typy DTO. Możemy wykorzystać istniejące.

---

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

**Content-Type:** `application/json`

**Body:**
```json
{
  "message": "Assignment removed successfully"
}
```

**TypeScript type:** `DeleteMealPlanResponseDto`

### Błędy

#### 400 Bad Request (opcjonalnie - invalid UUID format)

```json
{
  "error": "Invalid assignment ID format",
  "message": "Assignment ID must be a valid UUID"
}
```

#### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "You must be logged in to perform this action"
}
```

#### 404 Not Found

```json
{
  "error": "Assignment not found",
  "message": "The meal plan assignment does not exist or you don't have permission to delete it"
}
```

#### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred while deleting the assignment"
}
```

---

## 5. Przepływ danych

### High-level flow:

```
1. Client → DELETE /api/meal-plan/:id
2. Astro API Route (src/pages/api/meal-plan/[id].ts)
   ↓
3. Extract `id` from Astro.params
   ↓
4. Validate UUID format (optional but recommended)
   ↓
5. Auth check: context.locals.supabase.auth.getUser()
   ├─ Error → 401 Unauthorized
   └─ Success → Continue
   ↓
6. Call service: deleteMealPlanAssignment(supabase, userId, id)
   ↓
7. Service layer (src/lib/services/meal-plan.service.ts)
   ├─ Query: DELETE FROM meal_plan WHERE id = $1 AND user_id = $2
   ├─ Check affected rows
   ├─ 0 rows → throw NotFoundError
   └─ Success → return
   ↓
8. API Route formats response
   ├─ Success → 200 + DeleteMealPlanResponseDto
   └─ Error → appropriate error status + ErrorResponseDto
```

### Detailed service implementation flow:

```typescript
// Service function flow
async function deleteMealPlanAssignment(
  supabase: SupabaseClient,
  userId: string,
  assignmentId: string
): Promise<void> {

  // 1. Wykonaj DELETE query z warunkami:
  //    - id = assignmentId
  //    - user_id = userId (security check)

  const { data, error, count } = await supabase
    .from('meal_plan')
    .delete({ count: 'exact' })
    .eq('id', assignmentId)
    .eq('user_id', userId);

  // 2. Sprawdź błędy Supabase
  if (error) {
    throw new DatabaseError(error.message);
  }

  // 3. Sprawdź czy coś zostało usunięte
  if (count === 0) {
    throw new NotFoundError('Assignment not found or access denied');
  }

  // 4. Success - return void
  return;
}
```

### Database interaction:

**Query wykonywane przez Supabase:**
```sql
DELETE FROM meal_plan
WHERE id = $1 AND user_id = $2
RETURNING *;
```

**RLS Policy (powinien być już skonfigurowany):**
```sql
-- Policy: Users can only delete their own meal plan assignments
CREATE POLICY "Users can delete own assignments"
ON meal_plan
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

---

## 6. Względy bezpieczeństwa

### 1. Uwierzytelnianie (Authentication)

**Mechanizm:**
- Supabase JWT token w Authorization header (automatycznie obsługiwany przez middleware)
- Weryfikacja przez `context.locals.supabase.auth.getUser()`

**Implementacja:**
```typescript
// W API route
const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();

if (authError || !user) {
  return new Response(
    JSON.stringify({
      error: 'Unauthorized',
      message: 'You must be logged in to perform this action'
    }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}
```

### 2. Autoryzacja (Authorization)

**Problem: IDOR (Insecure Direct Object Reference)**
- User może próbować usunąć przypisanie innego użytkownika przez zgadywanie UUID

**Mitigation strategy (Defense in Depth):**

1. **Warstwa 1: Supabase RLS Policy**
   - Policy automatycznie filtruje query: `WHERE auth.uid() = user_id`
   - Nawet jeśli kod aplikacji ma bug, RLS chroni dane

2. **Warstwa 2: Explicit user_id check w query**
   - Service function dodaje `.eq('user_id', userId)` do query
   - Double protection

3. **Warstwa 3: 404 Not Found zamiast 403 Forbidden**
   - Nie ujawniamy czy zasób istnieje (information disclosure prevention)
   - User dostaje 404 zarówno gdy assignment nie istnieje, jak i gdy nie ma do niego dostępu

**Implementacja:**
```typescript
// W service
const { count } = await supabase
  .from('meal_plan')
  .delete({ count: 'exact' })
  .eq('id', assignmentId)
  .eq('user_id', userId); // <-- Explicit check

if (count === 0) {
  // Nie rozróżniamy czy nie istnieje czy brak dostępu
  throw new NotFoundError('Assignment not found');
}
```

### 3. Walidacja danych wejściowych

**UUID Validation:**
```typescript
import { z } from 'zod';

const uuidSchema = z.string().uuid('Invalid assignment ID format');

// W API route
const idValidation = uuidSchema.safeParse(id);
if (!idValidation.success) {
  return new Response(
    JSON.stringify({
      error: 'Invalid assignment ID format',
      message: 'Assignment ID must be a valid UUID'
    }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}
```

### 4. SQL Injection Prevention

**Mechanizm:**
- Supabase client używa parametrized queries
- Brak string concatenation w queries
- Automatic escaping przez PostgREST

**Bezpieczne:**
```typescript
.eq('id', assignmentId) // ✅ Parametrized
```

**NIE robić:**
```typescript
// ❌ NIGDY nie używać raw SQL z user input
supabase.rpc('delete_assignment', { raw_sql: `DELETE FROM meal_plan WHERE id = '${id}'` })
```

### 5. Rate Limiting

**Supabase default limits:**
- Free tier: 50 req/s
- Pro tier: 200 req/s

**Dodatkowe zabezpieczenie (opcjonalne dla MVP):**
- Middleware rate limiting per user (np. max 100 DELETE operations/hour)
- Implementacja w `src/middleware/index.ts` z użyciem Redis lub in-memory store

### 6. Logging & Monitoring

**Co logować:**
- Próby nieautoryzowanego dostępu (401)
- Próby dostępu do nie swoich zasobów (404)
- Database errors (500)

**Czego NIE logować:**
- JWT tokens
- Pełne session data
- Hasła (oczywiście)

**Implementacja:**
```typescript
// W service (dla błędów)
catch (error) {
  console.error('[meal-plan.service] Delete failed:', {
    assignmentId,
    userId,
    error: error.message,
    // NIE loguj: token, session
  });

  // Sentry w production
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      tags: { operation: 'delete_meal_plan' },
      user: { id: userId }
    });
  }

  throw error;
}
```

---

## 7. Obsługa błędów

### Error Handling Strategy

**Zasady:**
1. Early returns dla walidacji i auth
2. Service layer rzuca typed errors
3. API route łapie i konwertuje na HTTP responses
4. User-friendly messages (nie ujawniamy internal details)

### Katalog błędów

#### 1. Bad Request (400) - Invalid UUID

**Trigger:** Nieprawidłowy format UUID w URL

**Walidacja:**
```typescript
import { z } from 'zod';

const uuidSchema = z.string().uuid();
const result = uuidSchema.safeParse(id);
if (!result.success) {
  // Return 400
}
```

**Response:**
```json
{
  "error": "Invalid assignment ID format",
  "message": "Assignment ID must be a valid UUID"
}
```

#### 2. Unauthorized (401)

**Trigger:**
- Brak tokenu auth
- Expired/invalid token
- User nie zalogowany

**Check:**
```typescript
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) {
  // Return 401
}
```

**Response:**
```json
{
  "error": "Unauthorized",
  "message": "You must be logged in to perform this action"
}
```

#### 3. Not Found (404)

**Trigger:**
- Assignment nie istnieje w bazie
- Assignment należy do innego użytkownika

**Check:**
```typescript
const { count } = await supabase
  .from('meal_plan')
  .delete({ count: 'exact' })
  .eq('id', id)
  .eq('user_id', userId);

if (count === 0) {
  // Return 404
}
```

**Response:**
```json
{
  "error": "Assignment not found",
  "message": "The meal plan assignment does not exist or you don't have permission to delete it"
}
```

**Uwaga:** Celowo nie rozróżniamy czy zasób nie istnieje vs brak uprawnień (security best practice).

#### 4. Internal Server Error (500)

**Trigger:**
- Database connection error
- Supabase query error
- Unexpected exception

**Handling:**
```typescript
try {
  await deleteMealPlanAssignment(supabase, user.id, id);
} catch (error) {
  console.error('[DELETE /api/meal-plan/:id] Error:', error);

  // Sentry logging w production
  if (import.meta.env.PROD) {
    Sentry.captureException(error);
  }

  // Return 500
  return new Response(
    JSON.stringify({
      error: 'Internal server error',
      message: 'An unexpected error occurred while deleting the assignment'
    }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
```

**Response:**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred while deleting the assignment"
}
```

### Error Response Pattern

**Wszystkie błędy zwracają:**
```typescript
interface ErrorResponse {
  error: string;        // Machine-readable error code
  message?: string;     // Human-readable description (optional)
}
```

**Consistency:**
- Zawsze `Content-Type: application/json`
- Zawsze structured error object (nie plain text)
- Consistent field naming (error, message)

---

## 8. Rozważania dotyczące wydajności

### 1. Query Performance

**Aktualna sytuacja:**
```sql
DELETE FROM meal_plan
WHERE id = $1 AND user_id = $2
```

**Indexy potrzebne:**
- ✅ Primary Key na `id` (UUID) - automatyczny index
- ✅ Index na `user_id` - powinien już istnieć (zgodnie z database schema notes)

**Verify indexes:**
```sql
-- Sprawdzenie czy indexy istnieją
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'meal_plan';
```

**Expected indexes:**
```sql
CREATE INDEX idx_meal_plan_user_id ON meal_plan(user_id);
CREATE UNIQUE INDEX idx_meal_plan_unique_assignment
  ON meal_plan(user_id, week_start_date, day_of_week, meal_type);
```

**Performance metrics:**
- Single row DELETE by PK: **< 10ms** (SSD storage)
- With user_id filter: **< 15ms** (with index)
- Expected load: ~0.1-1 deletes/user/day (very light)

### 2. Database Locks

**PostgreSQL behavior:**
- DELETE operation = ROW EXCLUSIVE lock
- Lock tylko na deleted row (nie całą tabelę)
- Automatyczne release po transaction commit

**Brak problemu dla MVP:**
- Single row operations
- Brak concurrent deletes tego samego assignment (one user = one session)
- Supabase auto-manages transactions

### 3. RLS Policy Overhead

**Koszt:**
- RLS policy evaluation dodaje ~2-5ms do query time
- Akceptowalny overhead dla security benefit

**Optimization (jeśli potrzebne w przyszłości):**
- Service layer już robi explicit `.eq('user_id', userId)` check
- RLS jest backup security layer (defense in depth)

### 4. Network Latency

**Komponenty:**
1. Client → Vercel Edge (10-50ms depending on geography)
2. Vercel → Supabase (10-30ms)
3. Supabase query execution (<15ms)
4. Supabase → Vercel (10-30ms)
5. Vercel → Client (10-50ms)

**Total expected latency: 50-175ms**

**Optimization strategies:**
- ✅ Vercel Edge Functions (już planned w tech stack)
- ✅ Supabase connection pooling (automatic w Supabase)
- Possible future: Aggressive caching (nie dotyczy DELETE, ale dla GET endpoints)

### 5. Cascade Delete Implications

**Z database schema:**
```sql
recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE
```

**Behavior:**
- Gdy recipe jest usuwany → wszystkie jego assignments w meal_plan też są usuwane
- **NIE dotyczy tego endpointa** - my usuwamy assignment, nie recipe

**Performance note:**
- CASCADE DELETE jest handled przez PostgreSQL triggers
- Brak impactu na performance tego endpointa

### 6. Monitoring Metrics

**Metryki do trackowania (Sentry + custom):**
- Response time percentiles (p50, p95, p99)
- Error rate by status code
- Throughput (deletes/minute)
- Database query duration

**Alerts:**
- p95 latency > 500ms
- Error rate > 5%
- Spike w 404 errors (możliwy attack attempt)

---

## 9. Kroki implementacji

### Krok 1: Przygotowanie środowiska i validacja struktury

**Zadania:**
1. ✅ Sprawdzenie czy typy w `src/types.ts` są dostępne:
   - `DeleteMealPlanResponseDto`
   - `ErrorResponseDto`

2. ✅ Weryfikacja database schema i RLS policies:
   ```sql
   -- Sprawdzenie RLS policy
   SELECT * FROM pg_policies WHERE tablename = 'meal_plan';
   ```

3. Stworzenie struktury plików:
   ```
   src/
   ├── pages/
   │   └── api/
   │       └── meal-plan/
   │           └── [id].ts        # <-- Nowy plik (DELETE handler)
   └── lib/
       └── services/
           └── meal-plan.service.ts  # <-- Nowy plik lub extend existing
   ```

**Weryfikacja:**
- [ ] RLS policy dla DELETE istnieje na tabeli meal_plan
- [ ] Indexy na `id` i `user_id` są created
- [ ] TypeScript types są accessible

---

### Krok 2: Implementacja Service Layer

**Lokalizacja:** `src/lib/services/meal-plan.service.ts`

**Implementacja:**

```typescript
import type { SupabaseClient } from '@/db/supabase.client';

/**
 * Custom error classes dla lepszego error handling
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Usuwa przypisanie przepisu z kalendarza (meal plan assignment).
 * Nie usuwa samego przepisu, tylko wpis w tabeli meal_plan.
 *
 * @param supabase - Supabase client z auth context
 * @param userId - ID użytkownika (z auth.getUser())
 * @param assignmentId - ID przypisania do usunięcia
 * @throws {NotFoundError} Gdy assignment nie istnieje lub nie należy do użytkownika
 * @throws {DatabaseError} Gdy wystąpi błąd bazy danych
 */
export async function deleteMealPlanAssignment(
  supabase: SupabaseClient,
  userId: string,
  assignmentId: string
): Promise<void> {
  // Query z count option do sprawdzenia affected rows
  const { error, count } = await supabase
    .from('meal_plan')
    .delete({ count: 'exact' })
    .eq('id', assignmentId)
    .eq('user_id', userId); // Explicit authorization check

  // Handle database errors
  if (error) {
    console.error('[meal-plan.service] Delete query failed:', {
      assignmentId,
      userId,
      error: error.message,
      code: error.code,
    });

    throw new DatabaseError(
      `Failed to delete meal plan assignment: ${error.message}`
    );
  }

  // Check if anything was deleted
  if (count === 0) {
    // Assignment nie istnieje LUB user nie ma do niego dostępu
    // Celowo nie rozróżniamy (security best practice)
    throw new NotFoundError(
      'Assignment not found or you don\'t have permission to delete it'
    );
  }

  // Success - return void
  return;
}
```

**Testy jednostkowe (opcjonalne dla MVP, ale recommended):**

```typescript
// tests/services/meal-plan.service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { deleteMealPlanAssignment, NotFoundError, DatabaseError } from '@/lib/services/meal-plan.service';

describe('deleteMealPlanAssignment', () => {
  it('should successfully delete assignment', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null, count: 1 })
          })
        })
      })
    };

    await expect(
      deleteMealPlanAssignment(mockSupabase, 'user-123', 'assignment-456')
    ).resolves.toBeUndefined();
  });

  it('should throw NotFoundError when assignment does not exist', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null, count: 0 })
          })
        })
      })
    };

    await expect(
      deleteMealPlanAssignment(mockSupabase, 'user-123', 'assignment-456')
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw DatabaseError on query failure', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: { message: 'Connection failed', code: 'PGRST500' },
              count: null
            })
          })
        })
      })
    };

    await expect(
      deleteMealPlanAssignment(mockSupabase, 'user-123', 'assignment-456')
    ).rejects.toThrow(DatabaseError);
  });
});
```

**Weryfikacja:**
- [ ] Service function obsługuje wszystkie error cases
- [ ] Logging jest zaimplementowany
- [ ] TypeScript types są poprawne
- [ ] (Opcjonalnie) Testy jednostkowe przechodzą

---

### Krok 3: Implementacja API Route Handler

**Lokalizacja:** `src/pages/api/meal-plan/[id].ts`

**Implementacja:**

```typescript
import type { APIRoute } from 'astro';
import { z } from 'zod';
import {
  deleteMealPlanAssignment,
  NotFoundError,
  DatabaseError
} from '@/lib/services/meal-plan.service';
import type {
  DeleteMealPlanResponseDto,
  ErrorResponseDto
} from '@/types';

// Disable prerendering (wymagane dla API routes)
export const prerender = false;

// UUID validation schema
const uuidSchema = z.string().uuid();

/**
 * DELETE /api/meal-plan/:id
 *
 * Usuwa przypisanie przepisu z kalendarza.
 * Wymaga uwierzytelnienia. Użytkownik może usunąć tylko swoje przypisania.
 */
export const DELETE: APIRoute = async (context) => {
  const { params } = context;
  const supabase = context.locals.supabase;

  // ===================================================================
  // Step 1: Extract and validate ID parameter
  // ===================================================================
  const assignmentId = params.id;

  if (!assignmentId) {
    const errorResponse: ErrorResponseDto = {
      error: 'Missing assignment ID',
      message: 'Assignment ID is required in URL path',
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate UUID format
  const idValidation = uuidSchema.safeParse(assignmentId);
  if (!idValidation.success) {
    const errorResponse: ErrorResponseDto = {
      error: 'Invalid assignment ID format',
      message: 'Assignment ID must be a valid UUID',
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ===================================================================
  // Step 2: Authentication check
  // ===================================================================
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.warn('[DELETE /api/meal-plan/:id] Unauthorized access attempt:', {
      assignmentId,
      authError: authError?.message,
    });

    const errorResponse: ErrorResponseDto = {
      error: 'Unauthorized',
      message: 'You must be logged in to perform this action',
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ===================================================================
  // Step 3: Call service to delete assignment
  // ===================================================================
  try {
    await deleteMealPlanAssignment(supabase, user.id, assignmentId);

    // Success response
    const successResponse: DeleteMealPlanResponseDto = {
      message: 'Assignment removed successfully',
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // ===================================================================
    // Step 4: Error handling
    // ===================================================================

    // Not Found Error (404)
    if (error instanceof NotFoundError) {
      const errorResponse: ErrorResponseDto = {
        error: 'Assignment not found',
        message: error.message,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Database Error (500)
    if (error instanceof DatabaseError) {
      console.error('[DELETE /api/meal-plan/:id] Database error:', {
        assignmentId,
        userId: user.id,
        error: error.message,
      });

      // Sentry logging w production
      if (import.meta.env.PROD) {
        // Assuming Sentry is configured globally
        // Sentry.captureException(error, { tags: { endpoint: 'delete_meal_plan' } });
      }

      const errorResponse: ErrorResponseDto = {
        error: 'Internal server error',
        message: 'An unexpected error occurred while deleting the assignment',
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Unexpected errors (500)
    console.error('[DELETE /api/meal-plan/:id] Unexpected error:', {
      assignmentId,
      userId: user.id,
      error,
    });

    if (import.meta.env.PROD) {
      // Sentry.captureException(error);
    }

    const errorResponse: ErrorResponseDto = {
      error: 'Internal server error',
      message: 'An unexpected error occurred',
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

**Uwagi implementacyjne:**
- Early returns dla wszystkich error cases (zgodnie z coding standards)
- Explicit error typing (NotFoundError, DatabaseError)
- Comprehensive logging (ale bez sensitive data)
- Type-safe responses (wszystkie używają DTO types)

**Weryfikacja:**
- [ ] Endpoint jest dostępny pod `/api/meal-plan/[id]`
- [ ] Wszystkie error cases są handled
- [ ] Responses mają proper Content-Type headers
- [ ] TypeScript compilation passes

---

### Krok 4: Testy manualne (end-to-end)

**Setup:**
1. Uruchom development server: `npm run dev`
2. Zaloguj się jako test user
3. Stwórz test assignment w kalendarzu (przez POST /api/meal-plan)

**Test cases:**

#### Test 1: Sukces - usunięcie własnego assignment
```bash
# 1. Create assignment first
curl -X POST http://localhost:3000/api/meal-plan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipe_id": "RECIPE_UUID",
    "week_start_date": "2025-11-03",
    "day_of_week": 1,
    "meal_type": "lunch"
  }'

# Response will contain the assignment ID

# 2. Delete the assignment
curl -X DELETE http://localhost:3000/api/meal-plan/ASSIGNMENT_UUID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: 200 OK
# {
#   "message": "Assignment removed successfully"
# }
```

#### Test 2: Error - brak authorization
```bash
curl -X DELETE http://localhost:3000/api/meal-plan/ASSIGNMENT_UUID

# Expected: 401 Unauthorized
# {
#   "error": "Unauthorized",
#   "message": "You must be logged in to perform this action"
# }
```

#### Test 3: Error - nieprawidłowy UUID format
```bash
curl -X DELETE http://localhost:3000/api/meal-plan/invalid-uuid \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: 400 Bad Request
# {
#   "error": "Invalid assignment ID format",
#   "message": "Assignment ID must be a valid UUID"
# }
```

#### Test 4: Error - assignment nie istnieje
```bash
curl -X DELETE http://localhost:3000/api/meal-plan/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: 404 Not Found
# {
#   "error": "Assignment not found",
#   "message": "Assignment not found or you don't have permission to delete it"
# }
```

#### Test 5: Security - próba usunięcia cudzego assignment
```bash
# 1. User A creates assignment (get assignment_id)
# 2. User B tries to delete it

curl -X DELETE http://localhost:3000/api/meal-plan/USER_A_ASSIGNMENT_UUID \
  -H "Authorization: Bearer USER_B_TOKEN"

# Expected: 404 Not Found (NOT 403 - security best practice)
# {
#   "error": "Assignment not found",
#   "message": "Assignment not found or you don't have permission to delete it"
# }
```

**Weryfikacja:**
- [ ] Wszystkie test cases zwracają expected responses
- [ ] Status codes są prawidłowe
- [ ] Error messages są user-friendly
- [ ] Security: user nie może usunąć cudzego assignment

---

### Krok 5: Weryfikacja RLS Policies

**Sprawdzenie czy RLS policy istnieje:**

```sql
-- Connect to Supabase SQL Editor
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'meal_plan'
  AND cmd = 'DELETE';
```

**Expected policy:**
```sql
policyname: "Users can delete own assignments"
cmd: DELETE
qual: (auth.uid() = user_id)
```

**Jeśli policy nie istnieje, stwórz:**

```sql
-- Enable RLS (jeśli nie włączony)
ALTER TABLE meal_plan ENABLE ROW LEVEL SECURITY;

-- Create DELETE policy
CREATE POLICY "Users can delete own assignments"
ON meal_plan
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

**Weryfikacja:**
- [ ] RLS jest włączony na tabeli meal_plan
- [ ] DELETE policy istnieje i jest poprawny
- [ ] Policy używa `auth.uid() = user_id` check

---

### Krok 6: Dodanie do dokumentacji API

**Lokalizacja:** `.ai/doc/api-endpoints.md` (jeśli istnieje) lub README

**Dodaj sekcję:**

```markdown
### DELETE /api/meal-plan/:id

**Description:** Remove recipe assignment from calendar (does NOT delete the recipe itself)

**Authentication:** Required (JWT token)

**Parameters:**
- `id` (path, UUID, required) - Meal plan assignment ID

**Success Response (200 OK):**
```json
{
  "message": "Assignment removed successfully"
}
```

**Error Responses:**

- **400 Bad Request** - Invalid UUID format
  ```json
  {
    "error": "Invalid assignment ID format",
    "message": "Assignment ID must be a valid UUID"
  }
  ```

- **401 Unauthorized** - Not authenticated
  ```json
  {
    "error": "Unauthorized",
    "message": "You must be logged in to perform this action"
  }
  ```

- **404 Not Found** - Assignment not found or access denied
  ```json
  {
    "error": "Assignment not found",
    "message": "Assignment not found or you don't have permission to delete it"
  }
  ```

- **500 Internal Server Error** - Server error
  ```json
  {
    "error": "Internal server error",
    "message": "An unexpected error occurred while deleting the assignment"
  }
  ```

**Example (cURL):**
```bash
curl -X DELETE https://shopmate.vercel.app/api/meal-plan/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Notes:**
- Deleting an assignment does NOT delete the recipe from recipes table
- Users can only delete their own assignments (RLS enforced)
- CASCADE DELETE: If recipe is deleted, all its assignments are automatically removed
```

**Weryfikacja:**
- [ ] Dokumentacja jest complete
- [ ] Przykłady są functional
- [ ] Error responses są documented

---

### Krok 7: Code Review Checklist

**Before merging, verify:**

**Functionality:**
- [ ] Endpoint usuwa assignment z bazy danych
- [ ] Nie usuwa recipe (tylko assignment)
- [ ] RLS policies działają poprawnie
- [ ] Error handling jest comprehensive

**Security:**
- [ ] Authentication check jest present
- [ ] Authorization check (user_id) jest present
- [ ] UUID validation jest implemented
- [ ] Nie ma SQL injection vulnerabilities
- [ ] Error messages nie ujawniają sensitive info

**Code Quality:**
- [ ] TypeScript types są używane everywhere
- [ ] Error handling używa early returns
- [ ] Logging nie zawiera sensitive data
- [ ] Code follows project coding standards
- [ ] Comments są clear i helpful

**Testing:**
- [ ] Manual tests passed (all test cases z Step 4)
- [ ] Security test passed (user B nie może usunąć assignment user A)
- [ ] Edge cases są handled (invalid UUID, missing auth, etc.)

**Documentation:**
- [ ] API documentation jest updated
- [ ] Code comments są present
- [ ] Implementation plan jest followed

**Performance:**
- [ ] Query używa indexes (id, user_id)
- [ ] Nie ma N+1 queries
- [ ] Response time < 200ms (average)

---

### Krok 8: Deployment i Monitoring

**Pre-deployment:**
1. Run linter: `npm run lint`
2. Run TypeScript check: `npm run build` (sprawdzi czy kompiluje się)
3. Run tests (jeśli są): `npm run test`

**Git workflow:**
```bash
# Create feature branch
git checkout -b feature/delete-meal-plan-endpoint

# Commit changes
git add src/pages/api/meal-plan/[id].ts
git add src/lib/services/meal-plan.service.ts
git commit -m "feat: implement DELETE /api/meal-plan/:id endpoint

- Add deleteMealPlanAssignment service function
- Implement DELETE API route with auth & validation
- Add error handling (400, 401, 404, 500)
- Add UUID validation with Zod
- Ensure RLS policy enforcement

Closes #ISSUE_NUMBER"

# Push and create PR
git push origin feature/delete-meal-plan-endpoint
```

**Deployment (Vercel):**
- GitHub push → automatic Vercel deployment (już skonfigurowane w tech stack)
- Preview deployment dla PR review
- Production deployment po merge do main

**Post-deployment monitoring:**

1. **Verify endpoint w production:**
```bash
curl -X DELETE https://shopmate.vercel.app/api/meal-plan/TEST_UUID \
  -H "Authorization: Bearer PROD_TOKEN"
```

2. **Monitor errors w Sentry:**
   - Check for 500 errors
   - Check for unusual 404 spikes (możliwy attack)
   - Set up alert: error rate > 5%

3. **Monitor performance w Vercel Analytics:**
   - Check p95 latency (should be < 200ms)
   - Check throughput (deletes/minute)

4. **Database monitoring w Supabase Dashboard:**
   - Check query performance
   - Check connection pool usage
   - Verify RLS policy enforcement (audit logs)

**Rollback plan (jeśli problemy):**
1. Vercel: instant rollback do previous deployment (1-click w dashboard)
2. Database: RLS policies pozostają (safe), no schema changes w tym endpointcie
3. Notify users jeśli downtime > 5 minut

**Weryfikacja:**
- [ ] Endpoint działa w production
- [ ] Monitoring jest set up (Sentry, Vercel Analytics)
- [ ] No errors w production logs (pierwsze 24h)
- [ ] Performance metrics są acceptable (p95 < 200ms)

---

## Podsumowanie kroków implementacji

| Krok | Zadanie | Status | Estimated Time |
|------|---------|--------|----------------|
| 1 | Przygotowanie środowiska i validacja struktury | ⏳ | 15 min |
| 2 | Implementacja Service Layer | ⏳ | 45 min |
| 3 | Implementacja API Route Handler | ⏳ | 60 min |
| 4 | Testy manualne (end-to-end) | ⏳ | 30 min |
| 5 | Weryfikacja RLS Policies | ⏳ | 15 min |
| 6 | Dodanie do dokumentacji API | ⏳ | 20 min |
| 7 | Code Review Checklist | ⏳ | 30 min |
| 8 | Deployment i Monitoring | ⏳ | 30 min |
| **TOTAL** | | | **~4 godziny** |

**Critical path:**
1. Service Layer (Step 2)
2. API Route (Step 3)
3. Manual Testing (Step 4)
4. Deployment (Step 8)

**Parallel tasks możliwe:**
- Step 5 (RLS) i Step 6 (Docs) można robić równolegle z testami

---

## Załączniki

### A. Przykładowy flow użytkownika

```
1. User jest na stronie kalendarza tygodniowego
2. Widzi przypisanie "Spaghetti Carbonara" na Poniedziałek Lunch
3. Klika przycisk "Usuń" (❌) przy przypisaniu
4. Frontend pokazuje modal potwierdzenia:
   "Czy na pewno chcesz usunąć Spaghetti Carbonara z kalendarza?"
5. User klika "Tak, usuń"
6. Frontend call:
   DELETE /api/meal-plan/550e8400-e29b-41d4-a716-446655440000
7. Backend usuwa przypisanie z meal_plan table
8. Response 200: { "message": "Assignment removed successfully" }
9. Frontend refresh calendar (remove assignment z UI)
10. User widzi pusty slot na Poniedziałek Lunch
11. Przepis "Spaghetti Carbonara" nadal istnieje w recipes list
```

### B. Database query execution plan

```sql
-- Query wykonywany przez endpoint:
EXPLAIN ANALYZE
DELETE FROM meal_plan
WHERE id = '550e8400-e29b-41d4-a716-446655440000'
  AND user_id = 'auth-user-id-here';

-- Expected execution plan:
-- Index Scan using meal_plan_pkey on meal_plan
--   Index Cond: (id = '550e8400-...')
--   Filter: (user_id = 'auth-user-id-here')
--   Execution Time: ~5ms
```

### C. Supabase client usage przykład

```typescript
// ✅ CORRECT - używamy client z context.locals
export const DELETE: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  const { data: { user } } = await supabase.auth.getUser();
  // ...
};

// ❌ WRONG - nie importujemy supabaseClient directly
import { supabaseClient } from '@/db/supabase.client';
// Ten client nie ma auth context z request!
```

### D. Type imports pattern

```typescript
// ✅ CORRECT - używamy type imports
import type { APIRoute } from 'astro';
import type { SupabaseClient } from '@/db/supabase.client';
import type { DeleteMealPlanResponseDto } from '@/types';

// ✅ CORRECT - runtime imports dla functions/classes
import { deleteMealPlanAssignment } from '@/lib/services/meal-plan.service';
import { z } from 'zod';
```

---

**Plan stworzony:** 2025-11-04
**Dla projektu:** ShopMate MVP
**Endpoint:** DELETE /api/meal-plan/:id
**Estimated total implementation time:** ~4 godziny (dla doświadczonego developera)
