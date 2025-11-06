# API Endpoint Implementation Plan: DELETE /api/shopping-lists/:id

## 1. Przegląd punktu końcowego

Ten endpoint umożliwia użytkownikowi usunięcie zapisanej listy zakupów wraz z wszystkimi powiązanymi pozycjami. Jest to operacja destrukcyjna i nieodwracalna.

**Kluczowe funkcjonalności:**
- Usunięcie listy zakupów należącej do zalogowanego użytkownika
- Automatyczne usunięcie wszystkich powiązanych pozycji (CASCADE)
- Walidacja własności listy przed usunięciem
- Zabezpieczenie przed nieautoryzowanym dostępem

**Użycie:**
- Usuwanie niepotrzebnych list zakupów
- Czyszczenie historycznych list
- Zarządzanie przestrzenią użytkownika

## 2. Szczegóły żądania

### Metoda HTTP
`DELETE`

### Struktura URL
```
/api/shopping-lists/:id
```

### Parametry

#### Wymagane (Path Parameters)
- **`id`** (string, UUID)
  - Identyfikator listy zakupów do usunięcia
  - Format: UUID v4 (np. `550e8400-e29b-41d4-a716-446655440000`)
  - Walidacja: Zod UUID schema

#### Wymagane (Authentication)
- **Supabase Session Cookie**
  - Automatycznie przekazywane przez middleware
  - Dostępne przez `context.locals.supabase`

### Request Body
Brak (DELETE nie wymaga body)

### Request Headers
```
Cookie: sb-access-token=...; sb-refresh-token=...
```

### Przykładowe żądanie
```http
DELETE /api/shopping-lists/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: shopmate.app
Cookie: sb-access-token=eyJ...; sb-refresh-token=...
```

## 3. Wykorzystywane typy

### Z `src/types.ts`

```typescript
// Response DTO (linia 305-307)
export interface DeleteShoppingListResponseDto {
  message: string;
}

// Error Response DTO (linia 373-376)
export interface ErrorResponseDto {
  error: string;
  message?: string;
}

// Database types (linia 28-30)
export type ShoppingList = Database["public"]["Tables"]["shopping_lists"]["Row"];
```

### Walidacja (do utworzenia w endpoint)

```typescript
import { z } from "zod";

// Path parameter validation
const deleteShoppingListParamsSchema = z.object({
  id: z.string().uuid({ message: "Invalid shopping list ID format" })
});
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "message": "Shopping list deleted successfully"
}
```

**Typ odpowiedzi:** `DeleteShoppingListResponseDto`

### Błędy

#### 400 Bad Request
Nieprawidłowy format UUID
```json
{
  "error": "Validation error",
  "message": "Invalid shopping list ID format"
}
```

#### 401 Unauthorized
Użytkownik nie jest zalogowany
```json
{
  "error": "Unauthorized",
  "message": "You must be logged in to delete shopping lists"
}
```

#### 404 Not Found
Lista nie istnieje lub nie należy do użytkownika
```json
{
  "error": "Not found",
  "message": "Shopping list not found"
}
```

#### 500 Internal Server Error
Błąd serwera
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## 5. Przepływ danych

### Diagram przepływu

```
┌─────────────────┐
│   Client        │
│  DELETE request │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Astro API Route                        │
│  src/pages/api/shopping-lists/[id].ts   │
│  export async function DELETE()         │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  1. Walidacja Path Parameter        │
│     - Zod schema dla UUID           │
│     - Return 400 jeśli invalid      │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  2. Sprawdzenie Autoryzacji         │
│     - supabase.auth.getUser()       │
│     - Return 401 jeśli brak sesji   │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  3. Service Layer                   │
│     shopping-list.service.ts        │
│     deleteShoppingList()            │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  4. Sprawdzenie Własności           │
│     SELECT from shopping_lists      │
│     WHERE id = ? AND user_id = ?    │
│     Return 404 jeśli nie znaleziono │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  5. Usunięcie Listy                 │
│     DELETE FROM shopping_lists      │
│     WHERE id = ? AND user_id = ?    │
│     (CASCADE usuwa items)           │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  6. Return Response                 │
│     200 OK + success message        │
└─────────────────────────────────────┘
```

### Interakcje z bazą danych

**1. Weryfikacja własności (SELECT):**
```sql
SELECT id, user_id
FROM shopping_lists
WHERE id = $1 AND user_id = $2
LIMIT 1;
```

**2. Usunięcie listy (DELETE):**
```sql
DELETE FROM shopping_lists
WHERE id = $1 AND user_id = $2
RETURNING id;
```

**Uwaga:** `shopping_list_items` są automatycznie usuwane przez `ON DELETE CASCADE` w definicji foreign key.

### RLS (Row Level Security)

Supabase RLS policy powinna zezwalać na DELETE tylko dla `user_id = auth.uid()`:
```sql
CREATE POLICY "Users can delete own shopping lists"
ON shopping_lists FOR DELETE
USING (auth.uid() = user_id);
```

## 6. Względy bezpieczeństwa

### Uwierzytelnienie (Authentication)
- **Sprawdzenie sesji:** Wywołanie `supabase.auth.getUser()` na początku endpointa
- **Guard clause:** Early return z 401 jeśli użytkownik nie jest zalogowany
- **Error message:** Generic message bez ujawniania szczegółów systemu

### Autoryzacja (Authorization)
- **Ownership verification:** Sprawdzenie `shopping_lists.user_id === authenticated_user.id`
- **IDOR prevention:** Użytkownik nie może usunąć list innych użytkowników
- **Double check:** Zarówno w kodzie aplikacji jak i przez RLS w Supabase

### Walidacja danych wejściowych
- **UUID validation:** Zod schema dla path parameter
- **Type safety:** TypeScript zapewnia type checking
- **SQL Injection protection:** Supabase ORM używa prepared statements

### Security obscurity
- **404 dla unauthorized:** Nie ujawniać czy lista istnieje jeśli użytkownik nie jest właścicielem
- **Generic error messages:** Unikać szczegółowych informacji w error responses dla użytkowników

### Rate Limiting
- **Supabase default:** 100 requests/minute (konfigurowane w Supabase dashboard)
- **Recommendation:** Rozważyć dodatkowy rate limiting dla DELETE operations w przyszłości

### Audit Trail (opcjonalnie - poza MVP)
- Obecnie brak logowania usunięć do audit table
- W przyszłości można dodać trigger do logowania DELETE operations

## 7. Obsługa błędów

### Błędy walidacji (400 Bad Request)

**Scenariusz:** Nieprawidłowy format UUID w path parameter

```typescript
const validation = deleteShoppingListParamsSchema.safeParse({ id: params.id });
if (!validation.success) {
  return new Response(
    JSON.stringify({
      error: "Validation error",
      message: "Invalid shopping list ID format"
    }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}
```

### Błędy autoryzacji (401 Unauthorized)

**Scenariusz:** Użytkownik nie jest zalogowany

```typescript
const { data: { user }, error: authError } = await supabase.auth.getUser();

if (authError || !user) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "You must be logged in to delete shopping lists"
    }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
```

### Błędy not found (404 Not Found)

**Scenariusz 1:** Lista nie istnieje
**Scenariusz 2:** Lista należy do innego użytkownika (również 404 dla security)

```typescript
// Service zwraca null jeśli lista nie istnieje lub nie należy do użytkownika
const deleted = await deleteShoppingList(supabase, listId, user.id);

if (!deleted) {
  return new Response(
    JSON.stringify({
      error: "Not found",
      message: "Shopping list not found"
    }),
    { status: 404, headers: { "Content-Type": "application/json" } }
  );
}
```

### Błędy serwera (500 Internal Server Error)

**Scenariusze:**
- Błąd połączenia z bazą danych
- Nieoczekiwany błąd w service layer
- Błąd Supabase

```typescript
try {
  // ... main logic
} catch (error) {
  console.error("Error deleting shopping list:", error);

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

**Development:**
```typescript
console.error("Error deleting shopping list:", {
  listId,
  userId: user.id,
  error: error.message,
  stack: error.stack
});
```

**Production (z Sentry):**
```typescript
import * as Sentry from "@sentry/node";

Sentry.captureException(error, {
  tags: { endpoint: "DELETE /api/shopping-lists/:id" },
  extra: { listId, userId: user.id }
});
```

## 8. Rozważania dotyczące wydajności

### Optymalizacje bazy danych

**Indeksy (już istniejące):**
- Primary key na `shopping_lists.id` (automatyczny index)
- Index na `shopping_lists.user_id` (dla filtrowania RLS)
- Foreign key z CASCADE na `shopping_list_items.shopping_list_id`

**Query performance:**
- DELETE jest fast (single row operation)
- CASCADE delete może być wolniejszy dla list z wieloma items (100+ items)
- Dla MVP: akceptowalne (max 100 items per list)

### Connection pooling
- Supabase używa PgBouncer (connection pooling) automatycznie
- Brak konieczności konfiguracji dla MVP

### Potencjalne wąskie gardła

**1. CASCADE delete dla dużych list:**
- Problem: Lista z 100 items = 101 DELETE operations
- Mitigation: PostgreSQL optymalizuje CASCADE delete
- MVP: Akceptowalne (limit 100 items)

**2. RLS policy evaluation:**
- Problem: RLS dodaje overhead (~10-30ms per query)
- Mitigation: Proper indexing na user_id
- MVP: Akceptowalne

**3. Supabase rate limits:**
- Free tier: 50 requests/second
- Pro tier: 200 requests/second
- MVP: Sufficient (delete operations są rzadkie)

### Monitoring

**Metryki do monitorowania:**
- Delete operation duration (target: <500ms)
- Error rate (target: <1%)
- 404 rate (może wskazywać na problemy z UI/routing)

**Tools:**
- Sentry dla error tracking
- Supabase dashboard dla database metrics
- Vercel Analytics dla endpoint performance

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie service layer

**Lokalizacja:** `src/lib/services/shopping-list.service.ts`

**Zadania:**
1. Sprawdzić czy plik istnieje, jeśli nie - utworzyć
2. Dodać funkcję `deleteShoppingList()`:
   ```typescript
   export async function deleteShoppingList(
     supabase: SupabaseClient,
     listId: string,
     userId: string
   ): Promise<boolean>
   ```
3. Implementacja:
   - SELECT dla weryfikacji ownership
   - DELETE z warunkiem `id = ? AND user_id = ?`
   - Return `true` jeśli usunięto, `false` jeśli nie znaleziono
   - Throw error dla database errors

### Krok 2: Utworzenie Zod schema dla walidacji

**Lokalizacja:** W pliku endpointa lub w `src/lib/validation/shopping-list.schema.ts`

**Zadania:**
1. Zdefiniować schema:
   ```typescript
   const deleteShoppingListParamsSchema = z.object({
     id: z.string().uuid({ message: "Invalid shopping list ID format" })
   });
   ```
2. Export schema jeśli w osobnym pliku

### Krok 3: Utworzenie endpointa DELETE

**Lokalizacja:** `src/pages/api/shopping-lists/[id].ts`

**Zadania:**
1. Utworzyć plik z dynamic route `[id].ts`
2. Dodać `export const prerender = false;`
3. Zaimportować dependencies:
   ```typescript
   import type { APIRoute } from "astro";
   import { z } from "zod";
   import { deleteShoppingList } from "@/lib/services/shopping-list.service";
   import type { DeleteShoppingListResponseDto, ErrorResponseDto } from "@/types";
   ```

### Krok 4: Implementacja walidacji i autoryzacji

**W funkcji DELETE():**

1. Extract `id` z `context.params`
2. Walidacja UUID:
   ```typescript
   const validation = deleteShoppingListParamsSchema.safeParse({ id: context.params.id });
   if (!validation.success) {
     // Return 400
   }
   ```
3. Autoryzacja:
   ```typescript
   const { data: { user }, error } = await context.locals.supabase.auth.getUser();
   if (error || !user) {
     // Return 401
   }
   ```

### Krok 5: Implementacja business logic

**W funkcji DELETE():**

1. Call service:
   ```typescript
   const deleted = await deleteShoppingList(
     context.locals.supabase,
     validation.data.id,
     user.id
   );
   ```
2. Handle result:
   - `deleted === true` → Return 200
   - `deleted === false` → Return 404
3. Wrap w try-catch dla 500 errors

### Krok 6: Implementacja responses

**Success response (200):**
```typescript
const response: DeleteShoppingListResponseDto = {
  message: "Shopping list deleted successfully"
};

return new Response(JSON.stringify(response), {
  status: 200,
  headers: { "Content-Type": "application/json" }
});
```

**Error responses:** Według sekcji 7 (Obsługa błędów)

### Krok 7: Error handling i logging

1. Dodać try-catch wrapper
2. Log errors do console (dev) lub Sentry (prod):
   ```typescript
   console.error("Error deleting shopping list:", {
     listId: validation.data.id,
     userId: user.id,
     error
   });
   ```
3. Return generic 500 error

### Krok 8: Testowanie

**Manual testing:**
1. Test sukcesu:
   - Zaloguj się jako user A
   - Utwórz listę zakupów
   - DELETE /api/shopping-lists/:id
   - Verify 200 response
   - Verify lista usunięta z DB
   - Verify items również usunięte (CASCADE)

2. Test 400 (invalid UUID):
   - DELETE /api/shopping-lists/invalid-uuid
   - Verify 400 response

3. Test 401 (unauthorized):
   - Wyloguj się
   - DELETE /api/shopping-lists/:id
   - Verify 401 response

4. Test 404 (nie znaleziono):
   - DELETE /api/shopping-lists/550e8400-e29b-41d4-a716-446655440000 (nieistniejący UUID)
   - Verify 404 response

5. Test 404 (IDOR prevention):
   - Zaloguj się jako user A
   - Utwórz listę jako user B
   - Jako user A: DELETE lista user B
   - Verify 404 response (nie 200, nie 403)

6. Test CASCADE:
   - Utwórz listę z items
   - DELETE lista
   - Verify items również usunięte

**Automated testing (opcjonalnie):**
- Vitest lub Jest dla unit tests service layer
- Playwright dla E2E tests

### Krok 9: Code review

**Checklist:**
- [ ] Walidacja UUID działa poprawnie
- [ ] Authorization check na początku funkcji
- [ ] Ownership verification w service
- [ ] RLS policy w Supabase prawidłowo skonfigurowana
- [ ] CASCADE delete działa (items usuwane)
- [ ] Error handling dla wszystkich scenariuszy
- [ ] Error logging implementation
- [ ] Response types zgodne z TypeScript definitions
- [ ] Kod zgodny z coding standards (early returns, guard clauses)
- [ ] No security vulnerabilities (IDOR, SQL injection)

### Krok 10: Deployment i monitoring

1. **Pre-deployment:**
   - Verify RLS policies w Supabase
   - Run linter: `npm run lint`
   - Run TypeScript check: `npx tsc --noEmit`

2. **Deployment:**
   - Merge do main branch
   - GitHub Actions auto-deploy do Vercel
   - Verify deployment sukcesu

3. **Post-deployment:**
   - Smoke test w production (DELETE test list)
   - Monitor Sentry dla errors
   - Monitor Vercel Analytics dla performance
   - Check Supabase dashboard dla DB metrics

4. **Monitoring (ongoing):**
   - Error rate
   - Response time
   - 404 rate (może wskazywać problemy)
   - Database performance

---

## Appendix

### Przykładowa implementacja service

```typescript
// src/lib/services/shopping-list.service.ts

import type { SupabaseClient } from "@/db/supabase.client";

/**
 * Usuwa listę zakupów należącą do użytkownika
 * @param supabase - Supabase client
 * @param listId - UUID listy do usunięcia
 * @param userId - UUID właściciela listy
 * @returns true jeśli usunięto, false jeśli nie znaleziono
 * @throws Error jeśli błąd bazy danych
 */
export async function deleteShoppingList(
  supabase: SupabaseClient,
  listId: string,
  userId: string
): Promise<boolean> {
  // Weryfikacja własności i usunięcie w jednym zapytaniu
  const { data, error } = await supabase
    .from("shopping_lists")
    .delete()
    .eq("id", listId)
    .eq("user_id", userId)
    .select("id")
    .single();

  if (error) {
    // PGRST116 = no rows found (not an error, just not found)
    if (error.code === "PGRST116") {
      return false;
    }
    // Inne błędy = throw
    throw error;
  }

  // Jeśli data !== null, lista została usunięta
  return data !== null;
}
```

### Przykładowa implementacja endpointa

```typescript
// src/pages/api/shopping-lists/[id].ts

import type { APIRoute } from "astro";
import { z } from "zod";
import { deleteShoppingList } from "@/lib/services/shopping-list.service";
import type { DeleteShoppingListResponseDto, ErrorResponseDto } from "@/types";

export const prerender = false;

const deleteShoppingListParamsSchema = z.object({
  id: z.string().uuid({ message: "Invalid shopping list ID format" })
});

export const DELETE: APIRoute = async (context) => {
  try {
    // 1. Walidacja path parameter
    const validation = deleteShoppingListParamsSchema.safeParse({
      id: context.params.id
    });

    if (!validation.success) {
      const errorResponse: ErrorResponseDto = {
        error: "Validation error",
        message: "Invalid shopping list ID format"
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. Autoryzacja
    const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      const errorResponse: ErrorResponseDto = {
        error: "Unauthorized",
        message: "You must be logged in to delete shopping lists"
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. Usunięcie listy (service layer)
    const deleted = await deleteShoppingList(
      context.locals.supabase,
      validation.data.id,
      user.id
    );

    // 4. Handle not found
    if (!deleted) {
      const errorResponse: ErrorResponseDto = {
        error: "Not found",
        message: "Shopping list not found"
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 5. Success response
    const successResponse: DeleteShoppingListResponseDto = {
      message: "Shopping list deleted successfully"
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    // Error logging
    console.error("Error deleting shopping list:", {
      listId: context.params.id,
      error: error instanceof Error ? error.message : "Unknown error"
    });

    // Generic error response
    const errorResponse: ErrorResponseDto = {
      error: "Internal server error",
      message: "An unexpected error occurred"
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
```

### RLS Policy (Supabase)

```sql
-- Policy dla DELETE operations
CREATE POLICY "Users can delete own shopping lists"
ON shopping_lists FOR DELETE
USING (auth.uid() = user_id);

-- Verify policy
SELECT * FROM pg_policies
WHERE tablename = 'shopping_lists'
AND cmd = 'DELETE';
```

---

**Plan wdrożenia przygotowany:** 2025-11-05
**Wersja:** 1.0
**Endpoint:** DELETE /api/shopping-lists/:id
