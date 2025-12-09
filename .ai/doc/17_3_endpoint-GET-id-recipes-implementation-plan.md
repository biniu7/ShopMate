# API Endpoint Implementation Plan: GET /api/recipes/:id

## 1. Przegląd punktu końcowego

Endpoint `GET /api/recipes/:id` służy do pobierania szczegółowych informacji o pojedynczym przepisie kulinarnym wraz ze wszystkimi składnikami. Endpoint zwraca kompletny obiekt przepisu zawierający:

- Podstawowe informacje o przepisie (nazwa, instrukcje, daty)
- Listę wszystkich składników posortowanych według `sort_order`
- Liczbę przypisań przepisu do planu posiłków

Endpoint jest chroniony uwierzytelnianiem i zwraca dane tylko jeśli przepis należy do zalogowanego użytkownika.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/recipes/:id`
- **Path Parameters**:
  - **Wymagane**:
    - `id` (string, UUID) - Unikalny identyfikator przepisu
- **Query Parameters**: Brak
- **Request Headers**:
  - `Authorization: Bearer <token>` - Token uwierzytelniający (zarządzany przez Supabase Auth)
- **Request Body**: Brak (metoda GET)

### Przykład żądania:

```http
GET /api/recipes/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Authorization: Bearer <supabase-jwt-token>
```

## 3. Wykorzystywane typy

### Response Types (z `src/types.ts`)

**RecipeResponseDto** (linie 104-107):

```typescript
export interface RecipeResponseDto extends Recipe {
  ingredients: IngredientResponseDto[];
  meal_plan_assignments?: number;
}
```

**IngredientResponseDto** (linia 98):

```typescript
export type IngredientResponseDto = Ingredient;
```

**ErrorResponseDto** (linie 373-376):

```typescript
export interface ErrorResponseDto {
  error: string;
  message?: string;
}
```

### Database Types (z `src/db/database.types.ts`)

**Recipe** (linia 16):

```typescript
export type Recipe = Database["public"]["Tables"]["recipes"]["Row"];
// Zawiera: id, user_id, name, instructions, created_at, updated_at
```

**Ingredient** (linia 20):

```typescript
export type Ingredient = Database["public"]["Tables"]["ingredients"]["Row"];
// Zawiera: id, recipe_id, name, quantity, unit, sort_order
```

### Validation Schema (nowy - do utworzenia)

**Lokalizacja**: `src/lib/validation/recipe.schema.ts`

```typescript
import { z } from "zod";

export const getRecipeByIdParamsSchema = z.object({
  id: z.string().uuid({ message: "Invalid recipe ID format" }),
});
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

**Content-Type**: `application/json`

**Body**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Spaghetti Carbonara",
  "instructions": "1. Boil pasta...\n2. Cook bacon...",
  "created_at": "2025-01-26T10:00:00Z",
  "updated_at": "2025-01-26T10:00:00Z",
  "ingredients": [
    {
      "id": "650e8400-e29b-41d4-a716-446655440001",
      "recipe_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "spaghetti",
      "quantity": 500,
      "unit": "g",
      "sort_order": 0
    }
  ],
  "meal_plan_assignments": 3
}
```

### Błędy

**400 Bad Request** - Nieprawidłowy format UUID:

```json
{
  "error": "Invalid recipe ID format"
}
```

**401 Unauthorized** - Użytkownik nie zalogowany:

```json
{
  "error": "Unauthorized"
}
```

**404 Not Found** - Przepis nie istnieje lub nie należy do użytkownika:

```json
{
  "error": "Recipe not found"
}
```

**500 Internal Server Error** - Błąd serwera:

```json
{
  "error": "Internal server error"
}
```

## 5. Przepływ danych

### 5.1. Diagram przepływu

```
1. Request → Astro API Route Handler
              ↓
2. Walidacja parametru :id (Zod)
              ↓
3. Uwierzytelnienie użytkownika (Supabase Auth)
              ↓
4. Service Layer (recipe.service.ts)
              ↓
5. Query 1: Pobierz przepis z tabeli recipes (WHERE id = :id AND user_id = :userId)
              ↓
6. Query 2: Pobierz składniki z tabeli ingredients (WHERE recipe_id = :id ORDER BY sort_order)
              ↓
7. Query 3: Policz przypisania z tabeli meal_plan (COUNT WHERE recipe_id = :id)
              ↓
8. Złożenie obiektu RecipeResponseDto
              ↓
9. Response → 200 OK z JSON
```

### 5.2. Interakcje z bazą danych

**Query 1 - Pobranie przepisu:**

```typescript
const { data: recipe, error } = await supabase
  .from("recipes")
  .select("*")
  .eq("id", recipeId)
  .eq("user_id", userId)
  .single();
```

**Query 2 - Pobranie składników:**

```typescript
const { data: ingredients, error } = await supabase
  .from("ingredients")
  .select("*")
  .eq("recipe_id", recipeId)
  .order("sort_order", { ascending: true });
```

**Query 3 - Policzenie przypisań do planu posiłków:**

```typescript
const { count, error } = await supabase
  .from("meal_plan")
  .select("*", { count: "exact", head: true })
  .eq("recipe_id", recipeId);
```

### 5.3. Optymalizacja (opcjonalnie)

Możliwe użycie Supabase RPC lub pojedynczego query z JOIN'ami, ale dla MVP proste zapytania są wystarczające.

## 6. Względy bezpieczeństwa

### 6.1. Uwierzytelnianie (Authentication)

- **Mechanizm**: Supabase Auth JWT token w cookie lub header Authorization
- **Implementacja**: Middleware Astro sprawdza obecność tokenu
- **Weryfikacja**: `await supabase.auth.getUser()`
- **Failure**: Zwróć 401 Unauthorized

### 6.2. Autoryzacja (Authorization)

- **RLS (Row Level Security)**: Włączona na tabeli `recipes`
- **Policy**: `auth.uid() = user_id` - użytkownik widzi tylko swoje przepisy
- **Dodatkowo**: Walidacja `user_id` w query (`eq("user_id", userId)`)
- **IDOR Protection**: Nawet jeśli użytkownik zgadnie UUID, nie zobaczy cudzych danych

### 6.3. Walidacja danych wejściowych

- **UUID Validation**: Zod schema `z.string().uuid()`
- **SQL Injection**: Zabezpieczone przez Supabase client (parametryzowane zapytania)
- **XSS**: Dane zwracane jako JSON, nie renderowane w HTML

### 6.4. Informacje wrażliwe

- **Nie ujawniaj**: Czy przepis istnieje, jeśli nie należy do użytkownika
- **404 dla obu**: "Przepis nie istnieje" i "Przepis należy do innego użytkownika"
- **User ID**: Zwracany w response (OK, bo użytkownik widzi tylko swoje dane)

### 6.5. Rate Limiting

- Zalecane: Implementacja rate limiting na poziomie Vercel/middleware
- MVP: Można pominąć, dodać w przyszłości

## 7. Obsługa błędów

### 7.1. Macierz błędów

| Scenariusz                     | Kod HTTP | Response Body                           | Action                             |
| ------------------------------ | -------- | --------------------------------------- | ---------------------------------- |
| Nieprawidłowy UUID             | 400      | `{"error": "Invalid recipe ID format"}` | Return natychmiast po walidacji    |
| Brak tokenu auth               | 401      | `{"error": "Unauthorized"}`             | Return z middleware                |
| Nieprawidłowy token            | 401      | `{"error": "Unauthorized"}`             | Return po `getUser()`              |
| Przepis nie istnieje           | 404      | `{"error": "Recipe not found"}`         | Return gdy `recipe === null`       |
| Przepis należy do innego usera | 404      | `{"error": "Recipe not found"}`         | Return gdy `recipe === null` (RLS) |
| Błąd bazy danych               | 500      | `{"error": "Internal server error"}`    | Log error, return generic message  |
| Nieoczekiwany błąd             | 500      | `{"error": "Internal server error"}`    | Log error, return generic message  |

### 7.2. Strategia obsługi błędów

**Pattern: Guard Clauses + Early Returns**

```typescript
// 1. Walidacja parametrów
const validation = getRecipeByIdParamsSchema.safeParse({ id });
if (!validation.success) {
  return new Response(JSON.stringify({ error: "Invalid recipe ID format" }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

// 2. Uwierzytelnienie
const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();
if (authError || !user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

// 3. Business logic (może rzucić błąd)
try {
  const recipe = await getRecipeById(supabase, id, user.id);

  if (!recipe) {
    return new Response(JSON.stringify({ error: "Recipe not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 4. Happy path
  return new Response(JSON.stringify(recipe), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
} catch (error) {
  console.error("Error fetching recipe:", error);
  return new Response(JSON.stringify({ error: "Internal server error" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
```

### 7.3. Logowanie błędów

- **Development**: `console.error()` z pełnym stack trace
- **Production**: Integracja z Sentry (zgodnie z CLAUDE.md)
- **Poziomy logowania**:
  - 400/404: INFO (oczekiwane błędy użytkownika)
  - 500: ERROR (nieoczekiwane błędy serwera)

## 8. Rozważania dotyczące wydajności

### 8.1. Potencjalne wąskie gardła

1. **Wiele zapytań do bazy danych** (3 query: recipe, ingredients, meal_plan count)
2. **Brak cache'owania** - każde żądanie idzie do bazy
3. **N+1 problem** - nie występuje (pobieramy wszystkie składniki jednym query)

### 8.2. Strategie optymalizacji

**Dla MVP (obecnie)**:

- Pozostaw 3 osobne zapytania (prostsze w utrzymaniu)
- Indeksy na kolumnach (już istnieją):
  - `recipes.id` (PRIMARY KEY)
  - `recipes.user_id` (dla RLS)
  - `ingredients.recipe_id` (FOREIGN KEY)
  - `meal_plan.recipe_id` (FOREIGN KEY)

**Przyszłe optymalizacje (jeśli potrzebne)**:

1. **Database View lub RPC**: Połączenie 3 zapytań w jedno
2. **Redis Cache**: Cache przepisów na 5-15 minut
3. **Partial Response**: Query parameter `?fields=` do wyboru pól
4. **Pagination składników**: Jeśli przepis ma >50 składników

### 8.3. Oczekiwana wydajność

- **Latencja**: <200ms (Supabase w tym samym regionie co Vercel)
- **Throughput**: ~100 req/s (wystarczające dla MVP)
- **Database load**: Niski (3 proste query z indeksami)

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie walidacji

**Lokalizacja**: `src/lib/validation/recipe.schema.ts`

**Zadanie**: Utwórz lub rozszerz plik ze schematem Zod dla walidacji UUID

```typescript
import { z } from "zod";

export const getRecipeByIdParamsSchema = z.object({
  id: z.string().uuid({ message: "Invalid recipe ID format" }),
});
```

**Testy**:

- Prawidłowy UUID: ✅ Pass
- Nieprawidłowy format: ❌ Fail z message
- Pusty string: ❌ Fail
- Null/undefined: ❌ Fail

---

### Krok 2: Implementacja Service Layer

**Lokalizacja**: `src/lib/services/recipe.service.ts`

**Zadanie**: Utwórz funkcję `getRecipeById` z pełną logiką biznesową

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type { RecipeResponseDto } from "@/types";

/**
 * Pobiera pojedynczy przepis z wszystkimi składnikami i liczbą przypisań do planu posiłków
 * @param supabase - Klient Supabase
 * @param recipeId - UUID przepisu
 * @param userId - UUID użytkownika (dla autoryzacji)
 * @returns RecipeResponseDto lub null jeśli nie znaleziono
 */
export async function getRecipeById(
  supabase: SupabaseClient,
  recipeId: string,
  userId: string
): Promise<RecipeResponseDto | null> {
  // 1. Pobierz przepis (z weryfikacją user_id)
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", recipeId)
    .eq("user_id", userId)
    .single();

  if (recipeError || !recipe) {
    return null;
  }

  // 2. Pobierz składniki posortowane
  const { data: ingredients, error: ingredientsError } = await supabase
    .from("ingredients")
    .select("*")
    .eq("recipe_id", recipeId)
    .order("sort_order", { ascending: true });

  if (ingredientsError) {
    throw new Error(`Failed to fetch ingredients: ${ingredientsError.message}`);
  }

  // 3. Policz przypisania do meal_plan
  const { count, error: countError } = await supabase
    .from("meal_plan")
    .select("*", { count: "exact", head: true })
    .eq("recipe_id", recipeId);

  if (countError) {
    console.error("Failed to count meal plan assignments:", countError);
    // Nie rzucamy błędu - to opcjonalne pole
  }

  // 4. Złóż obiekt RecipeResponseDto
  return {
    ...recipe,
    ingredients: ingredients || [],
    meal_plan_assignments: count ?? 0,
  };
}
```

**Testy jednostkowe** (opcjonalnie dla MVP):

- Przepis istnieje i należy do użytkownika: ✅ Zwraca RecipeResponseDto
- Przepis nie istnieje: ✅ Zwraca null
- Przepis należy do innego użytkownika: ✅ Zwraca null (RLS)
- Brak składników: ✅ Zwraca pusty array
- Błąd bazy danych: ❌ Rzuca Error

---

### Krok 3: Implementacja API Route

**Lokalizacja**: `src/pages/api/recipes/[id].ts`

**Zadanie**: Utwórz plik z handler'em GET

```typescript
import type { APIRoute } from "astro";
import { getRecipeByIdParamsSchema } from "@/lib/validation/recipe.schema";
import { getRecipeById } from "@/lib/services/recipe.service";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  // 1. Walidacja parametru :id
  const validation = getRecipeByIdParamsSchema.safeParse({ id: params.id });

  if (!validation.success) {
    return new Response(JSON.stringify({ error: "Invalid recipe ID format" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = validation.data;

  // 2. Uwierzytelnienie
  const {
    data: { user },
    error: authError,
  } = await locals.supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Business logic
  try {
    const recipe = await getRecipeById(locals.supabase, id, user.id);

    if (!recipe) {
      return new Response(JSON.stringify({ error: "Recipe not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Happy path
    return new Response(JSON.stringify(recipe), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching recipe:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

**Struktura plików**:

```
src/pages/api/recipes/
  └── [id].ts          ← Ten plik
```

---

### Krok 4: Testowanie manualne

**Zadanie**: Przetestuj endpoint używając narzędzi HTTP

**Scenariusze testowe**:

1. **Happy path - prawidłowe żądanie**:

   ```bash
   curl -X GET http://localhost:3000/api/recipes/550e8400-e29b-41d4-a716-446655440000 \
     -H "Authorization: Bearer <valid-token>"
   ```

   **Oczekiwany wynik**: 200 OK z pełnym obiektem RecipeResponseDto

2. **Nieprawidłowy UUID**:

   ```bash
   curl -X GET http://localhost:3000/api/recipes/invalid-uuid \
     -H "Authorization: Bearer <valid-token>"
   ```

   **Oczekiwany wynik**: 400 Bad Request

3. **Brak tokenu**:

   ```bash
   curl -X GET http://localhost:3000/api/recipes/550e8400-e29b-41d4-a716-446655440000
   ```

   **Oczekiwany wynik**: 401 Unauthorized

4. **Przepis nie istnieje**:

   ```bash
   curl -X GET http://localhost:3000/api/recipes/00000000-0000-0000-0000-000000000000 \
     -H "Authorization: Bearer <valid-token>"
   ```

   **Oczekiwany wynik**: 404 Not Found

5. **Przepis należy do innego użytkownika**:
   ```bash
   curl -X GET http://localhost:3000/api/recipes/<other-user-recipe-id> \
     -H "Authorization: Bearer <valid-token>"
   ```
   **Oczekiwany wynik**: 404 Not Found (dzięki RLS)

---

### Krok 5: Weryfikacja bezpieczeństwa

**Zadanie**: Sprawdź, czy wszystkie wymogi bezpieczeństwa są spełnione

**Checklist**:

- [ ] RLS włączony na tabeli `recipes`
- [ ] RLS włączony na tabeli `ingredients`
- [ ] RLS włączony na tabeli `meal_plan`
- [ ] Walidacja UUID przed query
- [ ] Weryfikacja `user_id` w query
- [ ] Nieujawnianie istnienia przepisu innego użytkownika
- [ ] Brak wycieku danych wrażliwych w błędach
- [ ] HTTPS w produkcji (Vercel default)

---

### Krok 6: Dokumentacja i linting

**Zadanie**: Sprawdź jakość kodu i dodaj dokumentację

**Actions**:

1. **Uruchom linter**:

   ```bash
   npm run lint
   npm run format
   ```

2. **Sprawdź TypeScript**:

   ```bash
   npx tsc --noEmit
   ```

3. **Dodaj JSDoc** (już dodane w Kroku 2)

4. **Aktualizuj dokumentację API** (jeśli istnieje separate API docs file)

---

### Krok 7: Code Review Checklist

**Przed merge'em do main**:

- [ ] Kod zgodny z zasadami w `.cursor/rules/`
- [ ] Używa `uppercase` metod (GET)
- [ ] `export const prerender = false`
- [ ] Używa Zod do walidacji
- [ ] Logika w service layer
- [ ] Supabase przez `context.locals.supabase`
- [ ] Guard clauses i early returns
- [ ] Error handling na początku funkcji
- [ ] Testy manualne przeszły
- [ ] Brak błędów lintera
- [ ] Brak błędów TypeScript
- [ ] Dokumentacja zaktualizowana

---

### Krok 8: Deployment

**Zadanie**: Wdrożenie na Vercel

**Steps**:

1. **Commit i push**:

   ```bash
   git add .
   git commit -m "feat: implement GET /api/recipes/:id endpoint"
   git push origin <branch-name>
   ```

2. **Utwórz Pull Request** na GitHub

3. **Vercel Preview**: Automatycznie utworzy preview deployment

4. **Test na preview**: Powtórz testy z Kroku 4 na preview URL

5. **Merge do main**: Automatyczny deployment na production

6. **Monitoring**: Sprawdź logi w Vercel Dashboard

---

## 10. Dodatkowe uwagi

### 10.1. Zgodność z MVP Scope

✅ **In Scope**:

- Recipe CRUD (READ część)
- User authentication
- RLS
- Responsive API

❌ **Out of Scope** (ale przygotowane na przyszłość):

- Cache'owanie
- Rate limiting
- Advanced monitoring

### 10.2. Zależności

**Przed implementacją upewnij się, że istnieją**:

- [ ] Tabele `recipes`, `ingredients`, `meal_plan` w Supabase
- [ ] RLS policies na tych tabelach
- [ ] Middleware Astro dla auth
- [ ] Typy w `src/types.ts` i `src/db/database.types.ts`

**Wykorzystywane przez**:

- Frontend: Komponent szczegółów przepisu
- Inne endpointy: PUT /api/recipes/:id (do aktualizacji)
- Meal plan: Wyświetlanie przepisów w kalendarzu

### 10.3. Przyszłe rozszerzenia

1. **Cache'owanie**: Redis/Vercel KV dla popularnych przepisów
2. **Partial fields**: Query param `?fields=id,name,ingredients`
3. **Include/Exclude**: `?include=meal_plan_assignments` (opcjonalnie)
4. **ETag**: Cache validation headers
5. **Compression**: Gzip dla dużych response'ów

---

## Podsumowanie

Endpoint `GET /api/recipes/:id` jest kluczowym elementem API ShopMate, umożliwiającym pobieranie szczegółowych informacji o przepisach. Implementacja skupia się na:

- **Bezpieczeństwie**: RLS, walidacja UUID, autoryzacja user_id
- **Wydajności**: Indeksy, proste query, przygotowanie na cache
- **Utrzymaniu**: Clean code, service layer, guard clauses
- **Zgodności**: Astro patterns, TypeScript strict, Zod validation

Plan implementacji jest gotowy do wykonania przez zespół programistów w 8 krokach, z wyraźnymi punktami kontrolnymi i testami na każdym etapie.
