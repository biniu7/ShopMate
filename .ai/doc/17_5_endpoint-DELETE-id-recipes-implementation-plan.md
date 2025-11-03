# API Endpoint Implementation Plan: DELETE /api/recipes/:id

## 1. Przegląd punktu końcowego

Endpoint służy do usuwania przepisu kulinarnego wraz z powiązanymi danymi (składnikami i przypisaniami do planu posiłków). Operacja jest kaskadowa - usunięcie przepisu automatycznie usuwa wszystkie powiązane rekordy w tabelach `ingredients` i `meal_plan` dzięki konfiguracją CASCADE w bazie danych.

**Kluczowe funkcjonalności:**
- Usunięcie przepisu użytkownika
- Automatyczne usunięcie wszystkich składników przepisu (CASCADE)
- Automatyczne usunięcie wszystkich przypisań do planu posiłków (CASCADE)
- Zwrócenie informacji o liczbie usuniętych przypisań do planu posiłków
- Weryfikacja własności przepisu przed usunięciem

## 2. Szczegóły żądania

- **Metoda HTTP:** `DELETE`
- **Struktura URL:** `/api/recipes/:id`
- **Parametry:**
  - **Wymagane:**
    - `id` (string, UUID) - identyfikator przepisu do usunięcia, przekazywany w ścieżce URL
  - **Opcjonalne:** brak
- **Request Body:** brak (metoda DELETE nie wymaga body)
- **Headers:**
  - `Authorization` - token uwierzytelniający użytkownika (obsługiwany przez Supabase Auth)

**Przykład żądania:**
```http
DELETE /api/recipes/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <supabase_token>
```

## 3. Wykorzystywane typy

### Istniejące typy w `src/types.ts`:

**Response DTO:**
```typescript
export interface DeleteRecipeResponseDto {
  message: string;
  deleted_meal_plan_assignments: number;
}
```

**Error Response DTO:**
```typescript
export interface ErrorResponseDto {
  error: string;
  message?: string;
}
```

### Schemat walidacji Zod:

Należy utworzyć w `src/lib/validation/recipe.schema.ts`:

```typescript
export const deleteRecipeParamsSchema = z.object({
  id: z.string().uuid({ message: "Invalid recipe ID format" })
});
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK):
```json
{
  "message": "Recipe deleted successfully",
  "deleted_meal_plan_assignments": 3
}
```

### Błąd - Nieprawidłowy UUID (400 Bad Request):
```json
{
  "error": "Validation error",
  "message": "Invalid recipe ID format"
}
```

### Błąd - Brak autoryzacji (401 Unauthorized):
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### Błąd - Przepis nie znaleziony (404 Not Found):
```json
{
  "error": "Not found",
  "message": "Recipe not found or access denied"
}
```

### Błąd - Błąd serwera (500 Internal Server Error):
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## 5. Przepływ danych

```
1. Klient → DELETE /api/recipes/:id
2. Endpoint (src/pages/api/recipes/[id].ts)
   ↓
3. Walidacja UUID parametru :id (Zod)
   ↓
4. Weryfikacja uwierzytelnienia użytkownika (supabase.auth.getUser())
   ↓
5. Service (src/lib/services/recipes.service.ts)
   ↓
6. Zliczenie przypisań meal_plan dla danego recipe_id
   ↓
7. Usunięcie przepisu z tabeli recipes
   (CASCADE automatycznie usuwa ingredients i meal_plan_assignments)
   ↓
8. Zwrócenie DeleteRecipeResponseDto
   ↓
9. Endpoint → Response 200 OK z liczbą usuniętych przypisań
```

### Interakcje z bazą danych:

**Zapytanie 1: Zliczenie przypisań do planu posiłków**
```sql
SELECT COUNT(*) FROM meal_plan
WHERE recipe_id = $1 AND user_id = $2
```

**Zapytanie 2: Usunięcie przepisu**
```sql
DELETE FROM recipes
WHERE id = $1 AND user_id = $2
RETURNING id
```

Dzięki CASCADE w definicji kluczy obcych:
- `ingredients.recipe_id → recipes.id ON DELETE CASCADE`
- `meal_plan.recipe_id → recipes.id ON DELETE CASCADE`

Supabase automatycznie usunie wszystkie powiązane rekordy.

## 6. Względy bezpieczeństwa

### Uwierzytelnienie:
- **Obowiązkowe:** Sprawdzenie `supabase.auth.getUser()` przed wykonaniem operacji
- **Token:** Weryfikacja tokenu Supabase w headerze Authorization
- **Błąd 401:** Zwracany gdy użytkownik nie jest zalogowany

### Autoryzacja:
- **RLS (Row Level Security):** Supabase automatycznie weryfikuje czy `auth.uid() = user_id`
- **Własność zasobu:** Użytkownik może usunąć tylko własne przepisy
- **Błąd 404:** Zwracany gdy przepis nie istnieje lub nie należy do użytkownika (nie ujawniamy czy zasób istnieje)

### Walidacja danych:
- **UUID:** Walidacja formatu UUID zapobiega SQL injection
- **Zod schema:** Ścisła walidacja parametrów wejściowych
- **Prepared statements:** Supabase automatycznie używa prepared statements

### Bezpieczeństwo kaskadowego usuwania:
- **Transakcyjność:** Operacja DELETE jest atomowa
- **Integralność:** Foreign keys z CASCADE zapewniają spójność danych
- **Brak orphaned records:** Wszystkie powiązane dane są usuwane razem z przepisem

## 7. Obsługa błędów

### 400 Bad Request - Nieprawidłowy format UUID:
```typescript
if (!validation.success) {
  return new Response(
    JSON.stringify({
      error: "Validation error",
      message: "Invalid recipe ID format"
    }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}
```

### 401 Unauthorized - Brak uwierzytelnienia:
```typescript
const { data: { user }, error: authError } = await supabase.auth.getUser();

if (authError || !user) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "Authentication required"
    }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
```

### 404 Not Found - Przepis nie istnieje lub brak dostępu:
```typescript
if (!deletedRecipe) {
  return new Response(
    JSON.stringify({
      error: "Not found",
      message: "Recipe not found or access denied"
    }),
    { status: 404, headers: { "Content-Type": "application/json" } }
  );
}
```

### 500 Internal Server Error - Błędy bazy danych:
```typescript
try {
  // ... operacje na bazie danych
} catch (error) {
  console.error("Error deleting recipe:", error);
  return new Response(
    JSON.stringify({
      error: "Internal server error",
      message: "An unexpected error occurred"
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

### Logowanie błędów:
- Console.error dla wszystkich błędów serwerowych
- Potencjalnie Sentry dla monitoringu produkcyjnego
- Szczegóły błędów tylko w logach (nie w odpowiedzi do klienta)

## 8. Rozważania dotyczące wydajności

### Optymalizacje:
1. **Indeksy bazy danych:**
   - Indeks na `recipes.id` (PRIMARY KEY - automatyczny)
   - Indeks na `recipes.user_id` (dla RLS)
   - Indeks na `meal_plan.recipe_id` (dla COUNT query)

2. **Zliczanie w jednym zapytaniu:**
   - Użycie COUNT(*) zamiast SELECT + length
   - Minimalizacja liczby round-trips do bazy danych

3. **Kaskadowe usuwanie:**
   - Obsługiwane przez bazę danych (wydajniejsze niż usuwanie w aplikacji)
   - Pojedyncza transakcja zamiast wielu DELETE statements

4. **RLS:**
   - Row Level Security w Supabase zapewnia bezpieczeństwo bez dodatkowego narzutu w aplikacji

### Potencjalne wąskie gardła:
- **Duża liczba meal_plan_assignments:** COUNT może być wolny dla popularnych przepisów
  - **Mitygacja:** Indeks na `meal_plan.recipe_id`
- **Cascade delete wielu powiązanych rekordów:** Może trwać dłużej dla przepisów z wieloma składnikami
  - **Mitygacja:** Optymalizacja po stronie bazy danych, indeksy na foreign keys

### Limity:
- Brak soft delete - usunięcie jest permanentne
- Brak weryfikacji czy przepis jest używany (celowo - pozwalamy usuwać używane przepisy)

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie schematu walidacji Zod
**Plik:** `src/lib/validation/recipe.schema.ts`

Dodać nowy schema do walidacji parametru `id`:
```typescript
export const deleteRecipeParamsSchema = z.object({
  id: z.string().uuid({ message: "Invalid recipe ID format" })
});
```

### Krok 2: Implementacja logiki w service
**Plik:** `src/lib/services/recipes.service.ts`

Utworzyć lub rozszerzyć funkcję:
```typescript
export async function deleteRecipe(
  supabase: SupabaseClient,
  userId: string,
  recipeId: string
): Promise<{ deletedMealPlanAssignments: number }> {
  // 1. Zlicz przypisania do meal_plan
  // 2. Usuń przepis (CASCADE usunie ingredients i meal_plan)
  // 3. Zwróć liczbę usuniętych przypisań
}
```

**Implementacja:**
1. Query do zliczenia meal_plan_assignments
2. Query do usunięcia recipe z WHERE recipe_id = $1 AND user_id = $2
3. Sprawdzenie czy delete zwrócił wynik (404 jeśli nie)
4. Return count z kroku 1

### Krok 3: Utworzenie endpointu API
**Plik:** `src/pages/api/recipes/[id].ts`

Struktura:
```typescript
export const prerender = false;

export async function DELETE(context: APIContext) {
  // 1. Pobranie parametru id z context.params
  // 2. Walidacja UUID za pomocą Zod
  // 3. Uwierzytelnienie użytkownika
  // 4. Wywołanie recipes.service.deleteRecipe()
  // 5. Zwrócenie DeleteRecipeResponseDto
}
```

**Szczegóły implementacji:**
1. Extract `id` z `context.params`
2. Validate z `deleteRecipeParamsSchema.safeParse({ id })`
3. `await context.locals.supabase.auth.getUser()` - return 401 jeśli error
4. `await deleteRecipe(supabase, user.id, id)` - return 404 jeśli not found
5. Return 200 z `DeleteRecipeResponseDto`

### Krok 4: Obsługa błędów
Dodać try-catch w endpointcie:
- Catch wszystkich błędów i zwracanie 500
- Logowanie błędów przez console.error
- Zwracanie generycznych komunikatów (bez szczegółów technicznych)

### Krok 5: Testy manualne
1. **Test sukcesu:** Usunięcie istniejącego przepisu
2. **Test 400:** Nieprawidłowy UUID (np. "abc123")
3. **Test 401:** Brak tokenu autoryzacyjnego
4. **Test 404:** Próba usunięcia nieistniejącego przepisu
5. **Test 404:** Próba usunięcia przepisu innego użytkownika
6. **Test CASCADE:** Weryfikacja czy ingredients i meal_plan zostały usunięte

### Krok 6: Weryfikacja zgodności z regułami projektu
- ✅ Użycie `export const prerender = false`
- ✅ Uppercase metoda `DELETE()`
- ✅ Walidacja Zod
- ✅ Logika w service (`src/lib/services/`)
- ✅ Supabase przez `context.locals.supabase`
- ✅ Early returns dla błędów
- ✅ Guard clauses
- ✅ User-friendly error messages

### Krok 7: Dokumentacja i commit
1. Sprawdzenie czy wszystkie typy są poprawnie zdefiniowane w `types.ts`
2. Komentarze JSDoc w service functions
3. Commit zgodny z Conventional Commits: `feat(api): implement DELETE /api/recipes/:id endpoint`

---

## Dodatkowe uwagi

### Bezpieczeństwo transakcji:
Operacja DELETE w PostgreSQL jest atomowa - albo wszystkie powiązane rekordy zostaną usunięte, albo żaden. Nie ma ryzyka partial deletion.

### Przyszłe rozszerzenia:
- Soft delete (flaga `deleted_at` zamiast fizycznego usunięcia)
- Audit log (historia usunięć)
- Potwierdzenie usunięcia po stronie klienta
- Undo functionality (przywracanie usuniętych przepisów)

### Zgodność z MVP scope:
- ✅ W zakresie MVP - podstawowa funkcjonalność CRUD
- ✅ RLS zapewnia bezpieczeństwo
- ✅ Brak over-engineeringu
- ✅ Proste i skuteczne rozwiązanie