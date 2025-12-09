# API Endpoint Implementation Plan: PUT /api/recipes/:id

## 1. Przegląd punktu końcowego

Endpoint `PUT /api/recipes/:id` służy do aktualizacji istniejącego przepisu wraz z jego składnikami. Implementacja wykorzystuje strategię **pełnej zamiany** (full replacement):

- Stare składniki są całkowicie usuwane
- Nowe składniki są tworzone z nowych danych
- Dane przepisu (nazwa, instrukcje) są aktualizowane

**Kluczowe zachowania:**

- Zmiany w przepisie **propagują** do przypisań w planie posiłków (live update)
- Zmiany **NIE propagują** do wcześniej zapisanych list zakupów (snapshot pattern)
- Operacja wymaga autoryzacji - użytkownik może aktualizować tylko swoje przepisy
- W przypadku błędu podczas aktualizacji składników, zmiany w przepisie są zachowane (brak rollbacku)

---

## 2. Szczegóły żądania

### Metoda HTTP

`PUT`

### Struktura URL

`/api/recipes/:id`

gdzie `:id` to UUID przepisu do zaktualizowania

### Parametry URL

**Wymagane:**

- `id` (string, UUID) - Unikalny identyfikator przepisu

### Request Body

**Content-Type:** `application/json`

**Struktura:**

```typescript
{
  name: string,           // 3-100 znaków, trimmed
  instructions: string,   // 10-5000 znaków, trimmed
  ingredients: [
    {
      name: string,           // 1-100 znaków, wymagane
      quantity: number | null, // dodatnia liczba lub null
      unit: string | null,     // max 50 znaków lub null
      sort_order: number       // int, min 0, domyślnie 0
    }
  ]
}
```

**Wymagane pola:**

- `name` - nazwa przepisu
- `instructions` - instrukcje przygotowania
- `ingredients` - tablica składników (min 1, max 50)
  - `name` - nazwa składnika
  - `sort_order` - kolejność sortowania

**Opcjonalne pola:**

- `ingredients[].quantity` - ilość składnika (może być null)
- `ingredients[].unit` - jednostka miary (może być null)

### Nagłówki

- `Authorization: Bearer <token>` - Token JWT z Supabase Auth (automatycznie obsługiwany przez middleware)

---

## 3. Wykorzystywane typy

### DTOs i Command Modele

**Input:**

- `UpdateRecipeDto` (src/types.ts:92) - Command Model dla aktualizacji przepisu
  ```typescript
  export type UpdateRecipeDto = CreateRecipeDto;
  ```
- `CreateRecipeDto` (src/types.ts:82-86) - Faktyczna struktura danych
  ```typescript
  export interface CreateRecipeDto {
    name: string;
    instructions: string;
    ingredients: IngredientInputDto[];
  }
  ```
- `IngredientInputDto` (src/types.ts:71-76) - Struktura pojedynczego składnika
  ```typescript
  export interface IngredientInputDto {
    name: string;
    quantity: number | null;
    unit: string | null;
    sort_order: number;
  }
  ```

**Output:**

- `RecipeResponseDto` (src/types.ts:104-107) - Response DTO dla przepisu
  ```typescript
  export interface RecipeResponseDto extends Recipe {
    ingredients: IngredientResponseDto[];
    meal_plan_assignments?: number;
  }
  ```
- `IngredientResponseDto` (src/types.ts:98) - Response DTO dla składnika
  ```typescript
  export type IngredientResponseDto = Ingredient;
  ```

**Errors:**

- `ErrorResponseDto` (src/types.ts:373-376) - Standardowa odpowiedź błędu
  ```typescript
  export interface ErrorResponseDto {
    error: string;
    message?: string;
  }
  ```
- `ValidationErrorResponseDto` (src/types.ts:386-389) - Błąd walidacji
  ```typescript
  export interface ValidationErrorResponseDto {
    error: string;
    details: ValidationErrorDetails;
  }
  ```

### Validation Schemas

**Existing (Zod):**

- `RecipeSchema` (src/lib/validation/recipe.schema.ts:21-34) - Walidacja danych przepisu
- `IngredientInputSchema` (src/lib/validation/recipe.schema.ts:7-15) - Walidacja składników
- `getRecipeByIdParamsSchema` (src/lib/validation/recipe.schema.ts:72-74) - Walidacja parametru ID

### Database Types

- `Recipe` (src/types.ts:16) - Typ wiersza z tabeli recipes
- `RecipeUpdate` (src/types.ts:18) - Typ dla operacji UPDATE
- `Ingredient` (src/types.ts:20) - Typ wiersza z tabeli ingredients
- `IngredientInsert` (src/types.ts:21) - Typ dla operacji INSERT składników

---

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

**Content-Type:** `application/json`

**Struktura:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Spaghetti Carbonara (Updated)",
  "instructions": "1. Boil pasta al dente...\n2. Cook bacon crispy...",
  "created_at": "2025-01-26T10:00:00Z",
  "updated_at": "2025-01-26T11:30:00Z",
  "ingredients": [
    {
      "id": "new-uuid-1",
      "recipe_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "spaghetti",
      "quantity": 600,
      "unit": "g",
      "sort_order": 0
    }
    // ... pozostałe składniki
  ],
  "meal_plan_assignments": 3
}
```

**Opis pól:**

- Wszystkie pola z tabeli `recipes` (id, user_id, name, instructions, created_at, updated_at)
- `ingredients[]` - nowe składniki z nowymi UUID (stare zostały usunięte)
- `meal_plan_assignments` - liczba przypisań tego przepisu w planach posiłków
- `updated_at` - automatycznie zaktualizowane przez trigger bazy danych

### Błędy

#### 400 Bad Request - Błąd walidacji

```json
{
  "error": "Validation error",
  "details": {
    "name": ["Name must be at least 3 characters"],
    "ingredients": ["At least 1 ingredient required"]
  }
}
```

#### 401 Unauthorized - Brak autoryzacji

```json
{
  "error": "Unauthorized",
  "message": "User not authenticated"
}
```

#### 404 Not Found - Przepis nie istnieje lub nie należy do użytkownika

```json
{
  "error": "Not Found",
  "message": "Recipe not found"
}
```

#### 500 Internal Server Error - Błąd serwera

```json
{
  "error": "Internal Server Error",
  "message": "Failed to update recipe"
}
```

---

## 5. Przepływ danych

### Diagram przepływu

```
1. Request → Middleware
   ↓
2. Auth Check (supabase.auth.getUser())
   ↓
3. Validate Path Param (UUID)
   ↓
4. Parse & Validate Request Body (Zod)
   ↓
5. Service Layer: updateRecipe()
   ├── 5.1. Verify recipe exists & ownership
   ├── 5.2. Update recipe (name, instructions)
   ├── 5.3. Delete old ingredients
   ├── 5.4. Insert new ingredients (bulk)
   └── 5.5. Fetch complete recipe with ingredients
   ↓
6. Return Response (200 OK)
```

### Szczegółowy przepływ w warstwie serwisu

**Funkcja:** `updateRecipe(supabase, recipeId, userId, updateData)`

**Krok 1: Weryfikacja istnienia i własności**

```typescript
const existing = await supabase.from("recipes").select("id").eq("id", recipeId).eq("user_id", userId).single();

if (!existing) {
  return null; // → endpoint zwróci 404
}
```

**Krok 2: Aktualizacja przepisu**

```typescript
const { error: updateError } = await supabase
  .from("recipes")
  .update({
    name: updateData.name,
    instructions: updateData.instructions,
  })
  .eq("id", recipeId);
```

**Uwaga:** `updated_at` jest automatycznie aktualizowane przez trigger bazy danych

**Krok 3: Usunięcie starych składników**

```typescript
const { error: deleteError } = await supabase.from("ingredients").delete().eq("recipe_id", recipeId);
```

**Uwaga:** RLS zapewnia, że usuwamy tylko składniki przepisu należącego do użytkownika

**Krok 4: Wstawienie nowych składników (bulk insert)**

```typescript
const ingredientsToInsert = updateData.ingredients.map((ing) => ({
  recipe_id: recipeId,
  name: ing.name,
  quantity: ing.quantity,
  unit: ing.unit,
  sort_order: ing.sort_order,
}));

const { error: insertError } = await supabase.from("ingredients").insert(ingredientsToInsert);
```

**Krok 5: Pobranie zaktualizowanego przepisu z składnikami**

```typescript
const result = await supabase
  .from("recipes")
  .select(
    `
    *,
    ingredients (*)
  `
  )
  .eq("id", recipeId)
  .single();

// Sortowanie składników według sort_order
result.ingredients.sort((a, b) => a.sort_order - b.sort_order);
```

**Krok 6: Dodanie licznika meal_plan_assignments**

```typescript
const { count } = await supabase
  .from("meal_plan")
  .select("*", { count: "exact", head: true })
  .eq("recipe_id", recipeId);

return {
  ...result,
  meal_plan_assignments: count ?? 0,
};
```

### Transakcyjność

**Uwaga:** Supabase nie obsługuje natywnie transakcji w JavaScript SDK.

**Strategia obsługi błędów:**

- Jeśli aktualizacja przepisu się nie powiedzie → zwróć błąd (przepis pozostaje niezmieniony)
- Jeśli usunięcie składników się nie powiedzie → zwróć błąd (przepis został zmieniony, składniki pozostają stare)
- Jeśli wstawienie nowych składników się nie powiedzie → zwróć błąd (przepis został zmieniony, składniki zostały usunięte)

**Konsekwencja:** W przypadku częściowych błędów, przepis może pozostać bez składników. Jest to akceptowalne w MVP, ale należy logować taki przypadek do Sentry.

**Alternatywa (future enhancement):** Użycie Supabase Database Functions (PL/pgSQL) dla pełnej transakcyjności.

---

## 6. Względy bezpieczeństwa

### 1. Uwierzytelnianie (Authentication)

**Mechanizm:** Supabase JWT token w middleware

```typescript
const {
  data: { user },
  error,
} = await context.locals.supabase.auth.getUser();

if (error || !user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
```

**Źródło tokena:** Cookie `sb-access-token` zarządzane przez middleware Astro

### 2. Autoryzacja (Authorization)

**Poziom aplikacji:**
Sprawdzenie własności przepisu przed aktualizacją:

```typescript
const existing = await supabase.from("recipes").select("id").eq("id", recipeId).eq("user_id", userId).single();
```

**Poziom bazy danych (Row Level Security):**

- Polityka RLS na tabeli `recipes`: `auth.uid() = user_id`
- Polityka RLS na tabeli `ingredients`: weryfikacja przez `recipe_id` → `recipes.user_id`

**Defense in Depth:** Weryfikacja na obu poziomach zapewnia dodatkową warstwę bezpieczeństwa

### 3. Walidacja danych wejściowych

**Path Parameter (ID):**

```typescript
const paramValidation = getRecipeByIdParamsSchema.safeParse({ id: recipeId });
if (!paramValidation.success) {
  return new Response(
    JSON.stringify({
      error: "Bad Request",
      message: "Invalid recipe ID format",
    }),
    { status: 400 }
  );
}
```

**Request Body:**

```typescript
const bodyValidation = RecipeSchema.safeParse(requestBody);
if (!bodyValidation.success) {
  return new Response(
    JSON.stringify({
      error: "Validation error",
      details: bodyValidation.error.flatten().fieldErrors,
    }),
    { status: 400 }
  );
}
```

### 4. Zapobieganie SQL Injection

**Mechanizm:** Supabase Client używa parametryzowanych zapytań

- Wszystkie wartości są escapowane automatycznie
- Brak możliwości bezpośredniego wykonania surowego SQL z kodu aplikacji

### 5. Zapobieganie nadmiernym żądaniom

**Walidacja biznesowa:**

- Maksymalnie 50 składników na przepis (RecipeSchema)
- Maksymalnie 100 znaków na nazwę składnika
- Maksymalnie 5000 znaków na instrukcje

**Future enhancement:** Rate limiting na poziomie middleware lub edge functions

### 6. Bezpieczeństwo nagłówków HTTP

**Nagłówki CORS:** Konfigurowane w Vercel/Astro

```typescript
headers: {
  "Content-Type": "application/json",
  "X-Content-Type-Options": "nosniff",
}
```

---

## 7. Obsługa błędów

### Scenariusze błędów i kody odpowiedzi

| Scenariusz                                | Kod | Response                                                                        | Opis                                                          |
| ----------------------------------------- | --- | ------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Użytkownik niezalogowany                  | 401 | `{ error: "Unauthorized", message: "User not authenticated" }`                  | `supabase.auth.getUser()` zwrócił error                       |
| Nieprawidłowy format UUID                 | 400 | `{ error: "Bad Request", message: "Invalid recipe ID format" }`                 | Walidacja parametru `id` nie powiodła się                     |
| Błędne dane wejściowe                     | 400 | `{ error: "Validation error", details: {...} }`                                 | Zod validation error (nazwa za krótka, brak składników, etc.) |
| Przepis nie istnieje                      | 404 | `{ error: "Not Found", message: "Recipe not found" }`                           | Przepis o danym ID nie istnieje                               |
| Przepis należy do innego użytkownika      | 404 | `{ error: "Not Found", message: "Recipe not found" }`                           | Przepis istnieje, ale `user_id` się nie zgadza                |
| Błąd aktualizacji przepisu                | 500 | `{ error: "Internal Server Error", message: "Failed to update recipe" }`        | Błąd bazy danych podczas UPDATE                               |
| Błąd usuwania składników                  | 500 | `{ error: "Internal Server Error", message: "Failed to update ingredients" }`   | Błąd podczas DELETE składników                                |
| Błąd wstawiania składników                | 500 | `{ error: "Internal Server Error", message: "Failed to update ingredients" }`   | Błąd podczas INSERT nowych składników                         |
| Błąd pobierania zaktualizowanego przepisu | 500 | `{ error: "Internal Server Error", message: "Failed to fetch updated recipe" }` | Błąd podczas finałowego SELECT                                |

### Strategia logowania błędów

**Do Sentry (błędy krytyczne):**

- Błędy bazy danych (status 500)
- Nieoczekiwane wyjątki
- Częściowe błędy transakcji (przepis bez składników)

**Do console.error (błędy deweloperskie):**

- Wszystkie błędy z dodatkowymi szczegółami dla debugowania

```typescript
console.error("Failed to update recipe:", error);
```

**Nie loguj (błędy użytkownika):**

- Błędy walidacji (400)
- Błędy autoryzacji (401, 404)

### Struktura try-catch w endpoint

```typescript
try {
  // Walidacja + Business Logic
} catch (error) {
  console.error("Unexpected error in PUT /api/recipes/:id:", error);

  return new Response(
    JSON.stringify({
      error: "Internal Server Error",
      message: "An unexpected error occurred",
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

### Struktura error handling w service

```typescript
export async function updateRecipe(...) {
  // Verification
  if (!existing) {
    return null; // endpoint interpretuje jako 404
  }

  // Update recipe
  if (updateError) {
    console.error("Failed to update recipe:", updateError);
    throw new Error("Failed to update recipe");
  }

  // Delete ingredients
  if (deleteError) {
    console.error("Failed to delete ingredients:", deleteError);
    throw new Error("Failed to update ingredients");
  }

  // ... etc.
}
```

---

## 8. Rozważania dotyczące wydajności

### Optymalizacje bazy danych

**1. Bulk insert składników**

- Zamiast N pojedynczych INSERT, wykonujemy jeden bulk INSERT
- Redukcja round-trips do bazy danych

```typescript
await supabase.from("ingredients").insert(ingredientsToInsert); // Bulk insert
```

**2. Single query dla przepisu z składnikami**

- Używamy Supabase nested select zamiast osobnych zapytań

```typescript
.select(`*, ingredients (*)`)  // One query, not two
```

**3. Indeksy bazy danych**

- `recipes.user_id` - dla filtrowania po użytkowniku (już istnieje)
- `ingredients.recipe_id` - dla JOIN i DELETE operacji (już istnieje)
- `meal_plan.recipe_id` - dla liczenia przypisań (już istnieje)

### Potencjalne wąskie gardła

**1. Usuwanie + wstawianie wszystkich składników przy każdej aktualizacji**

- **Wpływ:** Dla przepisów z wieloma składnikami (max 50), DELETE + INSERT może być kosztowne
- **Mitigacja:** Akceptowalne dla MVP. W przyszłości można zaimplementować diff algorytm (UPDATE istniejących, INSERT nowych, DELETE usuniętych)
- **Koszt:** Średnio ~50ms dla 50 składników

**2. Liczenie meal_plan_assignments**

- **Wpływ:** Dodatkowe zapytanie COUNT przy każdym GET
- **Mitigacja:** Używamy `count: "exact", head: true` (optymalizowane zapytanie)
- **Alternatywa:** Cached/materialized count (overkill dla MVP)

**3. Brak transakcji**

- **Wpływ:** W rzadkich przypadkach przepis może zostać zaktualizowany, ale składniki nie
- **Mitigacja:** Logowanie do Sentry + możliwość ręcznego naprawienia przez użytkownika
- **Alternatywa:** Database Functions w PL/pgSQL (future enhancement)

### Limity żądań

**Supabase Free Tier:**

- 500 MB bazy danych
- 50,000 Monthly Active Users
- 1 GB file storage
- Wystarczające dla MVP

**API Limits:**

- Brak sztywnych limitów na liczbę składników (max 50 w walidacji)
- Request body size: domyślnie ~10 MB (wystarczające)

### Monitoring wydajności

**Metryki do śledzenia:**

- Czas odpowiedzi endpointu (target: <500ms p95)
- Liczba błędów 500 (target: <0.1%)
- Liczba częściowych błędów transakcji (target: <0.01%)

**Narzędzia:**

- Vercel Analytics (request time, status codes)
- Sentry Performance Monitoring (optional)

---

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie warstwy serwisu

**Lokalizacja:** `src/lib/services/recipe.service.ts`

**Zadanie:** Dodać funkcję `updateRecipe()`

**Implementacja:**

```typescript
/**
 * Updates an existing recipe with full replacement of ingredients
 *
 * This function performs the following steps:
 * 1. Verify recipe exists and belongs to user
 * 2. Update recipe (name, instructions)
 * 3. Delete all old ingredients
 * 4. Bulk insert new ingredients
 * 5. Fetch complete recipe with ingredients and meal plan count
 *
 * @param supabase - Authenticated Supabase client
 * @param recipeId - UUID of the recipe to update
 * @param userId - User ID from auth session (for ownership verification)
 * @param updateData - Validated recipe data
 * @returns Updated RecipeResponseDto or null if recipe not found
 * @throws Error if database operation fails
 */
export async function updateRecipe(
  supabase: SupabaseClientType,
  recipeId: string,
  userId: string,
  updateData: UpdateRecipeDto
): Promise<RecipeResponseDto | null> {
  // Implementation steps 1-5 as detailed in section 5
}
```

**Testy manualne:**

- Aktualizacja przepisu należącego do użytkownika → sukces
- Aktualizacja przepisu innego użytkownika → null (404)
- Aktualizacja nieistniejącego przepisu → null (404)

---

### Krok 2: Utworzenie pliku endpointu

**Lokalizacja:** `src/pages/api/recipes/[id].ts`

**Struktura pliku:**

```typescript
import type { APIContext } from "astro";
import { RecipeSchema, getRecipeByIdParamsSchema } from "@/lib/validation/recipe.schema";
import { updateRecipe } from "@/lib/services/recipe.service";

export const prerender = false;

/**
 * PUT /api/recipes/:id
 * Update recipe and ingredients (full replacement)
 */
export async function PUT(context: APIContext): Promise<Response> {
  // Implementation
}
```

---

### Krok 3: Implementacja autentykacji

**W funkcji `PUT()`:**

```typescript
// Step 1: Check authentication
const {
  data: { user },
  error: authError,
} = await context.locals.supabase.auth.getUser();

if (authError || !user) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "User not authenticated",
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }
  );
}

const userId = user.id;
```

---

### Krok 4: Walidacja parametru URL

```typescript
// Step 2: Validate path parameter
const recipeId = context.params.id;

const paramValidation = getRecipeByIdParamsSchema.safeParse({ id: recipeId });
if (!paramValidation.success) {
  return new Response(
    JSON.stringify({
      error: "Bad Request",
      message: "Invalid recipe ID format",
    }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

---

### Krok 5: Parsowanie i walidacja body

```typescript
// Step 3: Parse request body
let requestBody: unknown;
try {
  requestBody = await context.request.json();
} catch {
  return new Response(
    JSON.stringify({
      error: "Bad Request",
      message: "Invalid JSON in request body",
    }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }
  );
}

// Step 4: Validate request body
const validation = RecipeSchema.safeParse(requestBody);
if (!validation.success) {
  return new Response(
    JSON.stringify({
      error: "Validation error",
      details: validation.error.flatten().fieldErrors,
    }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }
  );
}

const updateData = validation.data;
```

---

### Krok 6: Wywołanie serwisu i obsługa odpowiedzi

```typescript
// Step 5: Update recipe via service
try {
  const updatedRecipe = await updateRecipe(context.locals.supabase, recipeId!, userId, updateData);

  if (!updatedRecipe) {
    return new Response(
      JSON.stringify({
        error: "Not Found",
        message: "Recipe not found",
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Step 6: Return success response
  return new Response(JSON.stringify(updatedRecipe), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
} catch (error) {
  console.error("Failed to update recipe:", error);

  return new Response(
    JSON.stringify({
      error: "Internal Server Error",
      message: "Failed to update recipe",
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

---

### Krok 7: Testowanie endpointu

**Testy manualne (cURL/Postman):**

1. **Sukces - aktualizacja przepisu:**

```bash
curl -X PUT http://localhost:3000/api/recipes/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Updated Recipe",
    "instructions": "New instructions here...",
    "ingredients": [
      { "name": "flour", "quantity": 500, "unit": "g", "sort_order": 0 }
    ]
  }'
```

**Oczekiwany wynik:** Status 200, zaktualizowany przepis w response

2. **Błąd - nieprawidłowy UUID:**

```bash
curl -X PUT http://localhost:3000/api/recipes/invalid-uuid
```

**Oczekiwany wynik:** Status 400, `"Invalid recipe ID format"`

3. **Błąd - brak składników:**

```bash
curl -X PUT http://localhost:3000/api/recipes/550e8400-e29b-41d4-a716-446655440000 \
  -d '{ "name": "Test", "instructions": "Test", "ingredients": [] }'
```

**Oczekiwany wynik:** Status 400, validation error `"At least 1 ingredient required"`

4. **Błąd - przepis nie istnieje:**

```bash
curl -X PUT http://localhost:3000/api/recipes/00000000-0000-0000-0000-000000000000
```

**Oczekiwany wynik:** Status 404, `"Recipe not found"`

5. **Błąd - brak autoryzacji:**

```bash
curl -X PUT http://localhost:3000/api/recipes/550e8400-e29b-41d4-a716-446655440000
```

**Oczekiwany wynik:** Status 401, `"User not authenticated"`

---

### Krok 8: Weryfikacja propagacji zmian

**Test 1: Meal Plan Live Update**

1. Utwórz przepis i przypisz go do planu posiłków
2. Zaktualizuj przepis (zmień nazwę)
3. Pobierz plan posiłków: `GET /api/meal-plan?week_start_date=2025-01-27`
4. **Oczekiwany wynik:** Nazwa przepisu w planie posiłków jest zaktualizowana

**Test 2: Shopping List Snapshot**

1. Utwórz przepis i dodaj go do listy zakupów
2. Zapisz listę zakupów
3. Zaktualizuj przepis (zmień składniki)
4. Pobierz zapisaną listę zakupów: `GET /api/shopping-lists/:id`
5. **Oczekiwany wynik:** Składniki na liście zakupów pozostają niezmienione (stare wartości)

---

### Krok 9: Code review i dokumentacja

**Checklist przed mergem:**

- [ ] Funkcja `updateRecipe()` dodana do `recipe.service.ts`
- [ ] Endpoint `PUT /api/recipes/[id].ts` utworzony i działa
- [ ] Wszystkie przypadki błędów obsłużone (401, 400, 404, 500)
- [ ] Walidacja Zod działa poprawnie
- [ ] RLS weryfikowane (przepis innego użytkownika → 404)
- [ ] Testy manualne przeszły pomyślnie
- [ ] Propagacja do meal_plan potwierdzona
- [ ] Snapshot pattern dla shopping_list potwierdzony
- [ ] Kod zgodny z ESLint i Prettier
- [ ] Kod zgodny z zasadami w `.cursor/rules/*.mdc`
- [ ] Logowanie błędów do console.error dodane

**Dokumentacja:**

- Dodać komentarze JSDoc do funkcji `updateRecipe()`
- Zaktualizować API documentation (jeśli istnieje)

---

### Krok 10: Deployment i monitoring

**Pre-deployment:**

1. Merge do branch głównego (`master`)
2. Weryfikacja pipeline CI/CD (lint, type-check)

**Deployment:**

1. Vercel automatycznie deployuje z `master`
2. Weryfikacja deployment preview

**Post-deployment:**

1. Test smoke na produkcji (podstawowy test sukcesu)
2. Monitoring w Vercel Analytics:
   - Status codes (200 vs. 4xx/5xx)
   - Response times
3. Monitoring w Sentry (jeśli skonfigurowane):
   - Error rates
   - Performance metrics

**Rollback plan:**
Jeśli występują krytyczne błędy → revert commit i redeploy

---

## Podsumowanie

Implementacja endpointu `PUT /api/recipes/:id` wymaga:

1. **Nowej funkcji serwisu:** `updateRecipe()` w `recipe.service.ts`
2. **Nowego pliku endpointu:** `src/pages/api/recipes/[id].ts`
3. **Reużycia istniejących schematów walidacji:** `RecipeSchema`, `getRecipeByIdParamsSchema`
4. **Obsługi 4 kodów statusu:** 200, 400, 401, 404, 500

**Kluczowe zachowania:**

- Full replacement strategy dla składników (DELETE + INSERT)
- Live update dla meal plans
- Snapshot pattern dla shopping lists
- Weryfikacja własności przepisu na poziomie aplikacji i RLS

**Szacowany czas implementacji:** 2-3 godziny (development + testing)

**Ryzyka:**

- Brak transakcyjności (akceptowalne dla MVP, logować do Sentry)
- Potencjalna strata składników przy częściowych błędach (rzadki przypadek)

**Monitoring:**

- Error rate < 0.1%
- Response time p95 < 500ms
- Częściowe błędy transakcji < 0.01%
