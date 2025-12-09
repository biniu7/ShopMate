# API Endpoint Implementation Plan: PATCH /api/shopping-lists/:list_id/items/:item_id

## 1. Przegląd punktu końcowego

Endpoint umożliwia aktualizację statusu `is_checked` pojedynczego elementu na liście zakupów (oznaczenie jako zakupione/niezakupione). Jest to **jedyna dozwolona mutacja** na zapisanych listach zakupów zgodnie ze wzorcem snapshot pattern. Endpoint wymaga autentykacji oraz weryfikacji, że zarówno lista, jak i item należą do zalogowanego użytkownika.

**Kluczowe cechy:**

- Atomowa operacja aktualizacji pojedynczego pola
- Nie narusza immutability listy (snapshot pattern)
- Wymaga weryfikacji własności zasobu (authorization)
- Optymistyczna aktualizacja UI po stronie klienta

## 2. Szczegóły żądania

### Metoda HTTP

`PATCH`

### Struktura URL

```
/api/shopping-lists/:list_id/items/:item_id
```

### Parametry

**Path Parameters (wymagane):**

- `list_id` (UUID) - identyfikator listy zakupów
- `item_id` (UUID) - identyfikator elementu na liście

**Request Body (wymagane):**

```typescript
{
  "is_checked": boolean
}
```

**Headers:**

- `Content-Type: application/json`
- Cookie z session token (Supabase Auth automatycznie obsługuje przez `context.locals.supabase`)

### Przykład żądania

```http
PATCH /api/shopping-lists/850e8400-e29b-41d4-a716-446655440000/items/950e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "is_checked": true
}
```

## 3. Wykorzystywane typy

### Command Model (Request)

```typescript
// src/types.ts (już istnieje, lines 298-300)
export interface UpdateShoppingListItemDto {
  is_checked: boolean;
}
```

### Response DTO

```typescript
// src/types.ts (już istnieje, line 272)
export type ShoppingListItemDto = ShoppingListItem;

// Database type (line 32-34)
export type ShoppingListItem = Database["public"]["Tables"]["shopping_list_items"]["Row"];
// Rozwinięcie:
// {
//   id: string;
//   shopping_list_id: string;
//   ingredient_name: string;
//   quantity: number | null;
//   unit: string | null;
//   category: IngredientCategory;
//   is_checked: boolean;
//   sort_order: number;
// }
```

### Validation Schema (do stworzenia)

```typescript
// src/lib/validation/shopping-list.schema.ts
import { z } from "zod";

export const updateShoppingListItemSchema = z
  .object({
    is_checked: z.boolean({
      required_error: "Pole is_checked jest wymagane",
      invalid_type_error: "Pole is_checked musi być typu boolean",
    }),
  })
  .strict(); // strict() zapobiega dodatkowym polom (mass assignment)

export const uuidParamSchema = z.string().uuid({
  message: "Nieprawidłowy format UUID",
});
```

## 4. Szczegóły odpowiedzi

### Pomyślna odpowiedź (200 OK)

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

### Odpowiedzi błędów

**400 Bad Request** - Nieprawidłowe dane wejściowe

```json
{
  "error": "Validation Error",
  "details": {
    "is_checked": ["Pole is_checked jest wymagane"]
  }
}
```

**401 Unauthorized** - Użytkownik nie zalogowany

```json
{
  "error": "Unauthorized",
  "message": "Musisz być zalogowany aby wykonać tę operację"
}
```

**404 Not Found** - Item lub lista nie istnieje/nie należy do użytkownika

```json
{
  "error": "Not Found",
  "message": "Element listy nie został znaleziony"
}
```

**500 Internal Server Error** - Błąd serwera

```json
{
  "error": "Internal Server Error",
  "message": "Wystąpił błąd podczas aktualizacji elementu"
}
```

## 5. Przepływ danych

### Architektura warstwowa

```
┌─────────────────────────────────────────────────────────────┐
│ Client (React component)                                     │
│ - Wywołuje PATCH /api/shopping-lists/:id/items/:item_id     │
│ - Optimistic UI update (opcjonalnie)                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ API Route Handler                                            │
│ src/pages/api/shopping-lists/[list_id]/items/[item_id].ts  │
│                                                              │
│ 1. Walidacja path params (list_id, item_id jako UUID)      │
│ 2. Walidacja request body (Zod schema)                     │
│ 3. Autentykacja (supabase.auth.getUser())                  │
│ 4. Wywołanie service layer                                  │
│ 5. Obsługa błędów i zwrot odpowiedzi                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Service Layer                                                │
│ src/lib/services/shopping-list.service.ts                   │
│                                                              │
│ updateItemCheckedStatus(supabase, listId, itemId, userId,  │
│                         isChecked): Promise<ShoppingListItem>│
│                                                              │
│ 1. Weryfikacja własności listy (user_id match)             │
│ 2. Weryfikacja istnienia item w liście                     │
│ 3. Wykonanie UPDATE query                                   │
│ 4. Zwrócenie zaktualizowanego rekordu                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Database (Supabase PostgreSQL)                              │
│                                                              │
│ UPDATE shopping_list_items                                  │
│ SET is_checked = $1, updated_at = NOW()                    │
│ WHERE id = $2 AND shopping_list_id IN (                    │
│   SELECT id FROM shopping_lists WHERE id = $3 AND          │
│   user_id = $4                                              │
│ )                                                            │
│ RETURNING *;                                                │
│                                                              │
│ + RLS policies sprawdzają user_id automatycznie            │
└─────────────────────────────────────────────────────────────┘
```

### Szczegółowy przepływ

1. **Request validation**
   - Walidacja UUID formatów dla `list_id` i `item_id`
   - Walidacja body zgodnie z `updateShoppingListItemSchema`
   - Early return 400 przy nieprawidłowych danych

2. **Authentication**
   - Pobieranie użytkownika z `context.locals.supabase.auth.getUser()`
   - Early return 401 jeśli użytkownik niezalogowany

3. **Authorization & Update (w service)**
   - Single query z verification: UPDATE WHERE item.id = :itemId AND item.shopping_list_id = :listId AND list.user_id = :userId
   - Dzięki JOIN/subquery w jednym zapytaniu weryfikujemy własność i aktualizujemy
   - RLS policies zapewniają dodatkową warstwę bezpieczeństwa

4. **Response**
   - 200 OK z zaktualizowanym item
   - 404 jeśli query nie zwróciło żadnego rekordu (oznacza brak dostępu lub nieistnienie)

## 6. Względy bezpieczeństwa

### Autentykacja

- Endpoint wymaga zalogowanego użytkownika
- Weryfikacja przez `supabase.auth.getUser()` w middleware lub bezpośrednio w endpointcie
- Session token przechowywany w httpOnly cookie (automatyczne przez Supabase Auth)

### Autoryzacja (IDOR Protection)

**Zagrożenie:** Użytkownik A może próbować zaktualizować item z listy użytkownika B przez manipulację UUID w URL

**Mitigation:**

1. **Database Level (Primary):** RLS policy na `shopping_list_items`:

   ```sql
   CREATE POLICY "Users can update only their own list items"
   ON shopping_list_items FOR UPDATE
   USING (
     shopping_list_id IN (
       SELECT id FROM shopping_lists WHERE user_id = auth.uid()
     )
   );
   ```

2. **Application Level (Secondary):** Explicit verification w service layer:

   ```typescript
   // Najpierw sprawdź czy lista należy do użytkownika
   const { data: list } = await supabase
     .from("shopping_lists")
     .select("id")
     .eq("id", listId)
     .eq("user_id", userId)
     .single();

   if (!list) {
     throw new Error("NOT_FOUND"); // 404
   }

   // Następnie update item
   ```

### Input Validation

- **UUID Validation:** Użycie `z.string().uuid()` zapobiega SQL injection przez malformed IDs
- **Boolean Validation:** Strict type checking dla `is_checked`
- **Strict Schema:** `z.object().strict()` zapobiega mass assignment attacks
- **Sanitization:** Nie dotyczy (tylko boolean update, brak user input strings)

### Rate Limiting

- Supabase default: 100 requests/minute (free tier), 200 req/min (pro tier)
- Dla dodatkowej ochrony można dodać middleware z rate limiting (np. `@upstash/ratelimit`)

### CORS

- Vercel automatycznie konfiguruje CORS dla API routes
- Ograniczenie do trusted origins w production (konfiguracja w `astro.config.mjs`)

## 7. Obsługa błędów

### Klasyfikacja błędów

| Kod | Scenariusz   | Warunek                         | Response                                                                                            |
| --- | ------------ | ------------------------------- | --------------------------------------------------------------------------------------------------- |
| 400 | Bad Request  | Nieprawidłowy UUID format       | `{ error: "Validation Error", details: { list_id: ["Nieprawidłowy format UUID"] } }`                |
| 400 | Bad Request  | Brak `is_checked` w body        | `{ error: "Validation Error", details: { is_checked: ["Pole is_checked jest wymagane"] } }`         |
| 400 | Bad Request  | `is_checked` nie jest boolean   | `{ error: "Validation Error", details: { is_checked: ["Pole is_checked musi być typu boolean"] } }` |
| 401 | Unauthorized | Użytkownik nie zalogowany       | `{ error: "Unauthorized", message: "Musisz być zalogowany..." }`                                    |
| 404 | Not Found    | Lista nie istnieje              | `{ error: "Not Found", message: "Element listy nie został znaleziony" }`                            |
| 404 | Not Found    | Item nie istnieje w tej liście  | j.w.                                                                                                |
| 404 | Not Found    | Lista nie należy do użytkownika | j.w. (security: nie ujawniamy czy istnieje)                                                         |
| 500 | Server Error | Błąd bazy danych                | `{ error: "Internal Server Error", message: "Wystąpił błąd..." }`                                   |
| 500 | Server Error | Supabase connection timeout     | j.w.                                                                                                |

### Strategia obsługi błędów

```typescript
// W API route handler
try {
  // 1. Validation errors (400)
  const paramsValidation = uuidParamSchema.safeParse(list_id);
  if (!paramsValidation.success) {
    return new Response(
      JSON.stringify({
        error: "Validation Error",
        details: paramsValidation.error.flatten(),
      }),
      { status: 400 }
    );
  }

  // 2. Auth errors (401)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Musisz być zalogowany aby wykonać tę operację",
      }),
      { status: 401 }
    );
  }

  // 3. Business logic (404 lub 500)
  const updatedItem = await updateItemCheckedStatus(supabase, list_id, item_id, user.id, is_checked);

  return new Response(JSON.stringify(updatedItem), { status: 200 });
} catch (error) {
  // 4. Rozróżnienie NOT_FOUND vs SERVER_ERROR
  if (error.message === "NOT_FOUND") {
    return new Response(
      JSON.stringify({
        error: "Not Found",
        message: "Element listy nie został znaleziony",
      }),
      { status: 404 }
    );
  }

  // 5. Logowanie do Sentry (jeśli skonfigurowany)
  console.error("Error updating shopping list item:", error);
  // Sentry.captureException(error);

  return new Response(
    JSON.stringify({
      error: "Internal Server Error",
      message: "Wystąpił błąd podczas aktualizacji elementu",
    }),
    { status: 500 }
  );
}
```

### Error Logging

- Console.error dla wszystkich błędów 500
- Sentry integration (jeśli skonfigurowany) dla production errors
- Nie logować błędów 400/401/404 (user errors, nie system errors)

## 8. Rozważania dotyczące wydajności

### Optymalizacje bazy danych

**Indexes (już powinny istnieć):**

```sql
-- Composite index dla szybkiego lookup
CREATE INDEX idx_shopping_list_items_list_id
ON shopping_list_items(shopping_list_id);

-- Index dla RLS policy verification
CREATE INDEX idx_shopping_lists_user_id
ON shopping_lists(user_id);
```

**Query Optimization:**

- Single UPDATE query z JOIN/subquery zamiast SELECT + UPDATE (2 queries)
- RETURNING clause eliminuje potrzebę dodatkowego SELECT po UPDATE
- RLS policies używają indexes (shopping_list_id, user_id)

### Caching

- **Brak server-side cache:** Item status jest mutable, cache byłby counter-productive
- **Client-side optimistic updates:** React Query / SWR może zaktualizować UI przed response (lepsze UX)

### Potencjalne bottlenecki

1. **RLS Policy Evaluation**
   - Overhead: ~5-10ms per request (subquery dla weryfikacji user_id)
   - Mitigation: Proper indexes (już powinny być)
   - Alternative: Application-level check (ale RLS daje defense in depth)

2. **Database Connection Pool**
   - Supabase używa PgBouncer (connection pooling)
   - Free tier: max 60 concurrent connections
   - Pro tier: max 200 concurrent connections
   - Dla MVP (1000 users) wystarczające

3. **API Route Cold Start** (Vercel Serverless)
   - First request: ~200-500ms (cold start)
   - Subsequent: ~50-100ms
   - Mitigation: Vercel Edge Functions (opcjonalne, dla premium tier)

### Monitoring

- Response time target: <200ms (p95)
- Error rate target: <0.1%
- Monitoring via Vercel Analytics lub Sentry Performance

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie validation schemas

**Plik:** `src/lib/validation/shopping-list.schema.ts`

```typescript
import { z } from "zod";

// Dodaj do istniejącego pliku (jeśli istnieje) lub stwórz nowy

export const updateShoppingListItemSchema = z
  .object({
    is_checked: z.boolean({
      required_error: "Pole is_checked jest wymagane",
      invalid_type_error: "Pole is_checked musi być typu boolean",
    }),
  })
  .strict();

export const uuidParamSchema = z.string().uuid({
  message: "Nieprawidłowy format UUID",
});
```

**Weryfikacja:** Import schema i test basic validation

---

### Krok 2: Implementacja service layer

**Plik:** `src/lib/services/shopping-list.service.ts` (rozszerz istniejący lub stwórz nowy)

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type { ShoppingListItem } from "@/types";

/**
 * Aktualizuje status is_checked dla elementu listy zakupów
 * Weryfikuje własność listy przed aktualizacją (IDOR protection)
 *
 * @throws Error z message 'NOT_FOUND' jeśli item/lista nie istnieje lub nie należy do użytkownika
 * @throws Error z message 'DATABASE_ERROR' dla innych błędów bazy danych
 */
export async function updateItemCheckedStatus(
  supabase: SupabaseClient,
  listId: string,
  itemId: string,
  userId: string,
  isChecked: boolean
): Promise<ShoppingListItem> {
  // Krok 1: Weryfikacja własności listy
  const { data: list, error: listError } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("id", listId)
    .eq("user_id", userId)
    .single();

  if (listError || !list) {
    throw new Error("NOT_FOUND");
  }

  // Krok 2: Aktualizacja item (RLS zapewnia dodatkową ochronę)
  const { data: updatedItem, error: updateError } = await supabase
    .from("shopping_list_items")
    .update({ is_checked: isChecked })
    .eq("id", itemId)
    .eq("shopping_list_id", listId)
    .select()
    .single();

  if (updateError) {
    // Rozróżnienie NOT_FOUND (no rows) vs inne błędy
    if (updateError.code === "PGRST116") {
      // PostgREST: no rows returned
      throw new Error("NOT_FOUND");
    }
    throw new Error("DATABASE_ERROR");
  }

  if (!updatedItem) {
    throw new Error("NOT_FOUND");
  }

  return updatedItem;
}
```

**Weryfikacja:** Unit tests (opcjonalnie) lub manual testing z różnymi scenariuszami

---

### Krok 3: Utworzenie struktury folderów dla API route

**Struktura:** `src/pages/api/shopping-lists/[list_id]/items/[item_id].ts`

```bash
# Upewnij się że folder istnieje
mkdir -p src/pages/api/shopping-lists/[list_id]/items
```

---

### Krok 4: Implementacja API route handler

**Plik:** `src/pages/api/shopping-lists/[list_id]/items/[item_id].ts`

```typescript
import type { APIRoute } from "astro";
import { updateShoppingListItemSchema, uuidParamSchema } from "@/lib/validation/shopping-list.schema";
import { updateItemCheckedStatus } from "@/lib/services/shopping-list.service";

export const prerender = false;

export const PATCH: APIRoute = async (context) => {
  const { list_id, item_id } = context.params;
  const supabase = context.locals.supabase;

  // 1. Walidacja path parameters
  const listIdValidation = uuidParamSchema.safeParse(list_id);
  const itemIdValidation = uuidParamSchema.safeParse(item_id);

  if (!listIdValidation.success) {
    return new Response(
      JSON.stringify({
        error: "Validation Error",
        details: { list_id: ["Nieprawidłowy format UUID"] },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!itemIdValidation.success) {
    return new Response(
      JSON.stringify({
        error: "Validation Error",
        details: { item_id: ["Nieprawidłowy format UUID"] },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. Parsowanie request body
  let requestBody;
  try {
    requestBody = await context.request.json();
  } catch {
    return new Response(
      JSON.stringify({
        error: "Bad Request",
        message: "Nieprawidłowy format JSON",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 3. Walidacja request body
  const bodyValidation = updateShoppingListItemSchema.safeParse(requestBody);
  if (!bodyValidation.success) {
    return new Response(
      JSON.stringify({
        error: "Validation Error",
        details: bodyValidation.error.flatten().fieldErrors,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 4. Autentykacja
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Musisz być zalogowany aby wykonać tę operację",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // 5. Business logic
  try {
    const updatedItem = await updateItemCheckedStatus(
      supabase,
      listIdValidation.data,
      itemIdValidation.data,
      user.id,
      bodyValidation.data.is_checked
    );

    return new Response(JSON.stringify(updatedItem), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    // 6. Obsługa błędów z service layer
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Element listy nie został znaleziony",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Log error dla debugowania
    console.error("Error updating shopping list item:", error);

    // Opcjonalnie: Sentry.captureException(error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Wystąpił błąd podczas aktualizacji elementu",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

**Weryfikacja:** Manual testing z różnymi payloads (valid, invalid, missing fields)

---

### Krok 5: Weryfikacja RLS policies

**Plik:** Sprawdź w Supabase Dashboard → Authentication → Policies

Upewnij się że istnieją policies:

```sql
-- Policy dla UPDATE na shopping_list_items
CREATE POLICY "Users can update only their own list items"
ON shopping_list_items FOR UPDATE
USING (
  shopping_list_id IN (
    SELECT id FROM shopping_lists WHERE user_id = auth.uid()
  )
);

-- Policy dla SELECT na shopping_lists (dla weryfikacji w service)
CREATE POLICY "Users can view only their own lists"
ON shopping_lists FOR SELECT
USING (user_id = auth.uid());
```

**Weryfikacja:** Test w Supabase SQL Editor z różnymi user_id

---

### Krok 6: Testing

**Manual Testing Checklist:**

- [ ] **Happy path:** PATCH z valid data → 200 OK z updated item
- [ ] **Invalid UUID:** PATCH z malformed list_id → 400 Validation Error
- [ ] **Invalid UUID:** PATCH z malformed item_id → 400 Validation Error
- [ ] **Missing field:** PATCH bez is_checked → 400 Validation Error
- [ ] **Wrong type:** PATCH z is_checked jako string → 400 Validation Error
- [ ] **Extra fields:** PATCH z dodatkowymi polami → 400 Validation Error (strict schema)
- [ ] **Unauthorized:** PATCH bez auth cookie → 401 Unauthorized
- [ ] **Not found:** PATCH z nieistniejącym list_id → 404 Not Found
- [ ] **Not found:** PATCH z nieistniejącym item_id → 404 Not Found
- [ ] **IDOR:** User A próbuje zaktualizować item User B → 404 Not Found (nie 403)

**Test Commands (curl examples):**

```bash
# Happy path
curl -X PATCH http://localhost:3000/api/shopping-lists/{LIST_ID}/items/{ITEM_ID} \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{"is_checked": true}'

# Invalid UUID
curl -X PATCH http://localhost:3000/api/shopping-lists/invalid-uuid/items/{ITEM_ID} \
  -H "Content-Type: application/json" \
  -d '{"is_checked": true}'

# Missing field
curl -X PATCH http://localhost:3000/api/shopping-lists/{LIST_ID}/items/{ITEM_ID} \
  -H "Content-Type: application/json" \
  -d '{}'

# Wrong type
curl -X PATCH http://localhost:3000/api/shopping-lists/{LIST_ID}/items/{ITEM_ID} \
  -H "Content-Type: application/json" \
  -d '{"is_checked": "yes"}'
```

---

### Krok 7: Dokumentacja i cleanup

**Aktualizuj:**

- `README.md` - dodaj endpoint do API docs (jeśli istnieje sekcja)
- Dodaj JSDoc comments w service functions
- Opcjonalnie: OpenAPI/Swagger spec (jeśli używane)

**Code review checklist:**

- [ ] Wszystkie edge cases obsłużone
- [ ] Proper error messages (user-friendly, nie technical details)
- [ ] No console.log w production code (tylko console.error dla errors)
- [ ] TypeScript types wszystkie poprawne (no `any`)
- [ ] Zod schemas strict (prevent mass assignment)
- [ ] RLS policies weryfikują authorization
- [ ] Service layer separated od API handler

---

### Krok 8: Deployment

**Pre-deployment:**

1. Run linter: `npm run lint`
2. Run type check: `npx tsc --noEmit`
3. Manual testing na local environment

**Deployment (Vercel):**

1. Commit changes: `git add . && git commit -m "feat: implement PATCH shopping-list-item endpoint"`
2. Push to GitHub: `git push origin feature/shopping-list-item-update`
3. Vercel auto-deploys preview environment
4. Test na preview URL
5. Merge to main → production deployment

**Post-deployment:**

1. Monitor Vercel logs dla 500 errors
2. Test na production environment
3. Monitor performance (response times)

---

## 10. Potencjalne rozszerzenia (post-MVP)

- **Batch update:** PATCH multiple items w jednym request (np. "zaznacz wszystko")
- **Optimistic locking:** Dodanie `version` field dla conflict detection
- **Undo functionality:** Przechowywanie historii zmian (audit log)
- **Real-time updates:** Supabase Realtime subscriptions dla collaborative shopping
- **Analytics:** Tracking najczęściej zaznaczanych items (shopping patterns)

---

## 11. Referencje

- **Astro API Routes:** https://docs.astro.build/en/core-concepts/endpoints/
- **Supabase Auth:** https://supabase.com/docs/guides/auth
- **Supabase RLS:** https://supabase.com/docs/guides/auth/row-level-security
- **Zod Validation:** https://zod.dev/
- **REST API Best Practices:** https://restfulapi.net/

---

**Przygotowano:** 2025-11-05
**Wersja:** 1.0
**Status:** Ready for implementation
