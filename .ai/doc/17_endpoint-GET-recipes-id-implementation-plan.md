# API Endpoint Implementation Plan: GET /api/recipes/:id - Szczegóły przepisu

**Version:** 1.0  
**Date:** 2025-01-25  
**Endpoint:** `GET /api/recipes/:id`  
**Status:** Ready for Implementation

---

## 1. Przegląd punktu końcowego

Endpoint `GET /api/recipes/:id` umożliwia pobranie pełnych szczegółów pojedynczego przepisu wraz z jego składnikami oraz liczbą przypisań w planie posiłków. Endpoint jest zabezpieczony mechanizmem Row Level Security (RLS), co zapewnia że użytkownik może pobrać tylko własne przepisy.

**Główne funkcje:**
- Pobieranie danych przepisu z tabeli `recipes`
- Załadowanie wszystkich składników powiązanych z przepisem (tabela `ingredients`)
- Obliczenie liczby przypisań przepisu w kalendarzu posiłków (tabela `meal_plan`)
- Zwrócenie struktury JSON zgodnej z `RecipeDetailDto`

---

## 2. Szczegóły żądania

### Metoda HTTP
`GET`

### Struktura URL
```
/api/recipes/:id
```

### Parametry ścieżki
- **`id`** (UUID, wymagany): Unikalny identyfikator przepisu do pobrania

### Parametry zapytania
Brak

### Nagłówki żądania
- **`Authorization: Bearer <supabase_jwt_token>`** (wymagany): Token JWT z Supabase Auth
- `Content-Type: application/json` (opcjonalny dla GET)

### Request Body
Brak (metoda GET)

---

## 3. Wykorzystywane typy

### Typy DTO
```typescript
// Import z src/types.ts
import type { RecipeDetailDto } from '@/types';

// Struktura RecipeDetailDto:
// - id: string (UUID)
// - user_id: string (UUID)
// - name: string
// - instructions: string
// - created_at: string (ISO 8601)
// - updated_at: string (ISO 8601)
// - ingredients: Omit<Ingredient, 'recipe_id'>[]
//   - id: string (UUID)
//   - name: string
//   - quantity: number | null
//   - unit: string | null
//   - sort_order: number
// - meal_plan_assignments: number
```

### Typy encji bazodanowych
```typescript
// Import z src/db/database.types.ts
import type { Database } from '@/db/database.types';

type Recipe = Database['public']['Tables']['recipes']['Row'];
type Ingredient = Database['public']['Tables']['ingredients']['Row'];
```

### Typy pomocnicze
```typescript
// Typ dla klienta Supabase (używany w kontekście)
import type { SupabaseClient } from '@/db/supabase.client';
```

---

## 4. Szczegóły odpowiedzi

### Response 200 OK (Sukces)
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Spaghetti Carbonara",
    "instructions": "1. Cook pasta according to package instructions...\n2. Mix eggs with cheese...\n3. Combine with hot pasta...",
    "created_at": "2025-01-20T10:30:00.000Z",
    "updated_at": "2025-01-20T10:30:00.000Z",
    "ingredients": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "spaghetti",
        "quantity": 500,
        "unit": "g",
        "sort_order": 0
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440002",
        "name": "eggs",
        "quantity": 3,
        "unit": "pcs",
        "sort_order": 1
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440003",
        "name": "parmesan cheese",
        "quantity": 100,
        "unit": "g",
        "sort_order": 2
      }
    ],
    "meal_plan_assignments": 2
  }
}
```

### Response 401 Unauthorized (Brak autoryzacji)
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**Kiedy:** 
- Brak tokenu JWT w nagłówku Authorization
- Token JWT jest nieprawidłowy lub wygasły
- Token nie może być zweryfikowany przez Supabase

### Response 404 Not Found (Przepis nie znaleziony)
```json
{
  "error": "NotFound",
  "message": "Recipe not found"
}
```

**Kiedy:**
- Przepis o podanym ID nie istnieje w bazie danych
- Przepis istnieje, ale należy do innego użytkownika (RLS blokuje dostęp)
- ID nie jest prawidłowym UUID

### Response 400 Bad Request (Nieprawidłowe dane wejściowe)
```json
{
  "error": "ValidationError",
  "message": "Invalid recipe ID format",
  "details": {
    "id": ["Invalid UUID format"]
  }
}
```

**Kiedy:**
- Parametr `id` nie jest prawidłowym UUID

### Response 500 Internal Server Error (Błąd serwera)
```json
{
  "error": "InternalServerError",
  "message": "An unexpected error occurred"
}
```

**Kiedy:**
- Błąd połączenia z bazą danych
- Nieoczekiwany błąd w logice serwera
- Błąd w politykach RLS

---

## 5. Przepływ danych

### Diagram przepływu
```
1. Client Request
   ↓
2. Astro API Route Handler (/src/pages/api/recipes/[id].ts)
   ↓
3. Middleware (Authentication Check)
   ↓
4. Validation (UUID format)
   ↓
5. Service Layer (/src/lib/services/recipe.service.ts)
   ↓
6. Supabase Client (z context.locals)
   ↓
7. PostgreSQL Database
   - Query: recipes table (with RLS)
   - Query: ingredients table (with JOIN)
   - Query: meal_plan table (COUNT)
   ↓
8. Data Transformation (DTO mapping)
   ↓
9. JSON Response
   ↓
10. Client
```

### Szczegółowy opis przepływu

#### Krok 1: Odbieranie żądania
- Astro odbiera żądanie GET na `/api/recipes/:id`
- Parametr `id` jest ekstrahowany z URL

#### Krok 2: Weryfikacja autoryzacji
- Middleware sprawdza obecność tokenu JWT w `context.locals.supabase`
- Jeśli brak tokenu → zwróć 401 Unauthorized
- Token jest automatycznie weryfikowany przez Supabase client

#### Krok 3: Walidacja parametru ID
- Sprawdzenie czy `id` jest prawidłowym UUID
- Użycie Zod schema do walidacji: `z.string().uuid()`
- Jeśli nieprawidłowy → zwróć 400 Bad Request

#### Krok 4: Wywołanie service layer
- Przekazanie `id` i `supabase client` do `RecipeService.getRecipeById()`
- Service layer enkapsuluje logikę biznesową

#### Krok 5: Zapytanie do bazy danych
**Query 1: Pobranie przepisu z składnikami**
```sql
SELECT 
  r.*,
  json_agg(
    json_build_object(
      'id', i.id,
      'name', i.name,
      'quantity', i.quantity,
      'unit', i.unit,
      'sort_order', i.sort_order
    ) ORDER BY i.sort_order
  ) as ingredients
FROM recipes r
LEFT JOIN ingredients i ON r.id = i.recipe_id
WHERE r.id = :id
GROUP BY r.id;
```

**Query 2: Zliczenie przypisań w meal_plan**
```sql
SELECT COUNT(*) 
FROM meal_plan 
WHERE recipe_id = :id;
```

**Uwaga:** RLS automatycznie filtruje wyniki - zwrócony zostanie tylko przepis należący do zalogowanego użytkownika.

#### Krok 6: Obsługa pustego wyniku
- Jeśli query nie zwrócił danych → przepis nie istnieje lub nie należy do użytkownika
- Zwróć 404 Not Found

#### Krok 7: Transformacja danych
- Mapowanie wyników bazy danych na `RecipeDetailDto`
- Usunięcie `recipe_id` z obiektów ingredients (zgodnie z typem DTO)
- Dodanie `meal_plan_assignments` z wyniku drugiego query

#### Krok 8: Zwrócenie odpowiedzi
- Opakowanie danych w obiekt `{ data: RecipeDetailDto }`
- Ustawienie statusu 200 OK
- Zwrócenie JSON response

---

## 6. Względy bezpieczeństwa

### Uwierzytelnianie (Authentication)
**Mechanizm:** Supabase Auth z JWT tokens

**Implementacja:**
- Token JWT przechowywany w httpOnly cookies (automatycznie przez Supabase)
- Middleware Astro ekstrahuje użytkownika z `context.locals.supabase`
- Każde żądanie wymaga prawidłowego tokenu JWT

**Sprawdzenie autoryzacji:**
```typescript
export const GET = async ({ params, locals }: APIContext) => {
  const supabase = locals.supabase;
  
  // Sprawdź czy użytkownik jest zalogowany
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Authentication required'
      }),
      { status: 401 }
    );
  }
  
  // ... dalszy kod
};
```

### Autoryzacja (Authorization)
**Mechanizm:** PostgreSQL Row Level Security (RLS)

**Polityki RLS:**
```sql
-- recipes table
CREATE POLICY recipes_select ON recipes
  FOR SELECT
  USING (auth.uid() = user_id);

-- ingredients table (przez recipes)
CREATE POLICY ingredients_select ON ingredients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = ingredients.recipe_id
        AND recipes.user_id = auth.uid()
    )
  );
```

**Korzyści:**
- Automatyczna filtracja na poziomie bazy danych
- Niemożliwe obejście w kodzie aplikacji
- Bezpieczeństwo nawet przy SQL injection
- Zgodność z GDPR (izolacja danych użytkowników)

### Walidacja danych wejściowych
**Parametr ID:**
- Walidacja formatu UUID za pomocą Zod
- Schema: `z.object({ id: z.string().uuid() })`

```typescript
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid('Invalid UUID format')
});

// W handler'ze
const validation = paramsSchema.safeParse(params);
if (!validation.success) {
  return new Response(
    JSON.stringify({
      error: 'ValidationError',
      message: 'Invalid recipe ID format',
      details: validation.error.flatten().fieldErrors
    }),
    { status: 400 }
  );
}
```

### Ochrona przed atakami

**SQL Injection:**
- Supabase używa parameterized queries
- RLS policies zapobiegają dostępowi do danych innych użytkowników

**XSS (Cross-Site Scripting):**
- JSON response automatycznie escapuje znaki specjalne
- Brak renderowania HTML w API response

**CSRF (Cross-Site Request Forgery):**
- API używa JWT tokens w httpOnly cookies
- Same-Site cookie policy

**Rate Limiting:**
- Supabase default: 100 requests/min na użytkownika
- Dla production: rozważyć dodatkowy rate limiting w middleware

---

## 7. Obsługa błędów

### Tabela scenariuszy błędów

| Scenariusz | HTTP Status | Error Code | Message | Szczegóły |
|------------|-------------|------------|---------|-----------|
| Brak tokenu JWT | 401 | Unauthorized | Authentication required | Użytkownik nie jest zalogowany |
| Token JWT wygasł | 401 | Unauthorized | Authentication required | Token wymaga odświeżenia |
| Nieprawidłowy format UUID | 400 | ValidationError | Invalid recipe ID format | Parametr `id` nie jest UUID |
| Przepis nie istnieje | 404 | NotFound | Recipe not found | Brak przepisu o podanym ID |
| Przepis należy do innego użytkownika | 404 | NotFound | Recipe not found | RLS blokuje dostęp (dla bezpieczeństwa zwracamy 404 zamiast 403) |
| Błąd połączenia z bazą | 500 | InternalServerError | An unexpected error occurred | Problem z Supabase |
| Timeout zapytania | 500 | InternalServerError | Database query timeout | Zapytanie trwało zbyt długo |
| Nieoczekiwany błąd | 500 | InternalServerError | An unexpected error occurred | Ogólny błąd serwera |

### Implementacja obsługi błędów

```typescript
try {
  // Logika pobierania przepisu
  const recipe = await RecipeService.getRecipeById(supabase, validatedId);
  
  if (!recipe) {
    return new Response(
      JSON.stringify({
        error: 'NotFound',
        message: 'Recipe not found'
      }),
      { status: 404 }
    );
  }
  
  return new Response(
    JSON.stringify({ data: recipe }),
    { status: 200 }
  );
  
} catch (error) {
  // Logowanie błędu do Sentry (production)
  console.error('Error fetching recipe:', error);
  
  // Zwróć ogólny błąd (nie ujawniaj szczegółów technicznych)
  return new Response(
    JSON.stringify({
      error: 'InternalServerError',
      message: 'An unexpected error occurred'
    }),
    { status: 500 }
  );
}
```

### Logowanie błędów
**Development:**
- `console.error()` dla wszystkich błędów
- Szczegółowe stack traces w konsoli

**Production:**
- Integracja z Sentry dla error tracking
- Logowanie tylko krytycznych błędów
- Maskowanie wrażliwych danych (user IDs, tokens)

---

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

**1. Zapytania N+1**
- **Problem:** Osobne zapytanie dla ingredients i meal_plan count
- **Rozwiązanie:** Użycie JOIN i agregacji w jednym zapytaniu
- **Optymalizacja:** 
  ```sql
  SELECT 
    r.*,
    COALESCE(json_agg(i.*) FILTER (WHERE i.id IS NOT NULL), '[]') as ingredients,
    COUNT(DISTINCT mp.id) as meal_plan_assignments
  FROM recipes r
  LEFT JOIN ingredients i ON r.id = i.recipe_id
  LEFT JOIN meal_plan mp ON r.id = mp.recipe_id
  WHERE r.id = :id
  GROUP BY r.id;
  ```

**2. Brak cache**
- **Problem:** Każde żądanie wykonuje query do bazy
- **Rozwiązanie (future):** Cache Redis dla często pobieranych przepisów
- **MVP:** Brak cache - prostota ważniejsza niż optymalizacja

**3. Indeksy bazodanowe**
- **Wymagane indeksy:**
  - `recipes.id` (PRIMARY KEY - automatyczny)
  - `ingredients.recipe_id` (FOREIGN KEY - automatyczny)
  - `meal_plan.recipe_id` (indeks dla COUNT query)
- **Sprawdzenie:** `CREATE INDEX idx_meal_plan_recipe_id ON meal_plan(recipe_id);`

**4. RLS overhead**
- **Problem:** RLS policies dodają ~10-30% overhead do query
- **Akceptowalne dla MVP:** Bezpieczeństwo > performance
- **Dla scale (100k+ users):** Rozważyć app-level authorization

### Strategie optymalizacji

**Immediate (MVP):**
1. ✅ Użycie LEFT JOIN zamiast osobnych queries
2. ✅ Proper database indexes (już istniejące)
3. ✅ Limit payload size (ingredients max 50)
4. ✅ Supabase connection pooling (automatic)

**Future (post-MVP):**
1. ⏳ Redis cache dla hot recipes (LRU policy)
2. ⏳ GraphQL dla selective field loading
3. ⏳ Read replicas dla high traffic
4. ⏳ CDN caching dla public recipes (jeśli dodamy sharing)

### Monitoring wydajności

**Metryki do śledzenia:**
- Query execution time (target: <100ms p95)
- Response time całego endpointu (target: <200ms p95)
- Database connection pool usage
- RLS policy evaluation time

**Narzędzia:**
- Supabase Dashboard → Database Performance
- Sentry Performance Monitoring
- Custom timing logs w development

---

## 9. Etapy wdrożenia

### Krok 1: Utworzenie struktury plików
**Lokalizacja:** `src/pages/api/recipes/[id].ts`

**Działania:**
- Utworzenie pliku route handler'a w Astro
- Dodanie `export const prerender = false` (wymagane dla API routes)
- Import typów z `src/types.ts` i `src/db/database.types.ts`

```typescript
// src/pages/api/recipes/[id].ts
export const prerender = false;

import type { APIContext } from 'astro';
import type { RecipeDetailDto } from '@/types';
```

### Krok 2: Utworzenie walidacji Zod
**Lokalizacja:** `src/pages/api/recipes/[id].ts` (inline) lub `src/lib/validation/recipe.validation.ts`

**Schema:**
```typescript
import { z } from 'zod';

const getRecipeParamsSchema = z.object({
  id: z.string().uuid('Invalid UUID format')
});
```

### Krok 3: Implementacja RecipeService
**Lokalizacja:** `src/lib/services/recipe.service.ts`

**Funkcja:** `getRecipeById(supabase: SupabaseClient, id: string): Promise<RecipeDetailDto | null>`

**Logika:**
```typescript
export class RecipeService {
  static async getRecipeById(
    supabase: SupabaseClient,
    id: string
  ): Promise<RecipeDetailDto | null> {
    // 1. Query recipe with ingredients
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select(`
        *,
        ingredients (
          id,
          name,
          quantity,
          unit,
          sort_order
        )
      `)
      .eq('id', id)
      .single();

    if (recipeError || !recipe) {
      return null;
    }

    // 2. Count meal plan assignments
    const { count, error: countError } = await supabase
      .from('meal_plan')
      .select('*', { count: 'exact', head: true })
      .eq('recipe_id', id);

    if (countError) {
      throw new Error('Failed to count meal plan assignments');
    }

    // 3. Transform to DTO
    return {
      ...recipe,
      ingredients: recipe.ingredients || [],
      meal_plan_assignments: count || 0
    };
  }
}
```

### Krok 4: Implementacja GET handler'a
**Lokalizacja:** `src/pages/api/recipes/[id].ts`

**Struktura:**
```typescript
export const GET = async ({ params, locals }: APIContext) => {
  // 1. Authentication check
  const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
  
  if (authError || !user) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Authentication required'
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 2. Validate params
  const validation = getRecipeParamsSchema.safeParse(params);
  
  if (!validation.success) {
    return new Response(
      JSON.stringify({
        error: 'ValidationError',
        message: 'Invalid recipe ID format',
        details: validation.error.flatten().fieldErrors
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 3. Fetch recipe
  try {
    const recipe = await RecipeService.getRecipeById(
      locals.supabase,
      validation.data.id
    );

    if (!recipe) {
      return new Response(
        JSON.stringify({
          error: 'NotFound',
          message: 'Recipe not found'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Return success response
    return new Response(
      JSON.stringify({ data: recipe }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching recipe:', error);
    
    return new Response(
      JSON.stringify({
        error: 'InternalServerError',
        message: 'An unexpected error occurred'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

### Krok 5: Testy jednostkowe (opcjonalne dla MVP)
**Lokalizacja:** `src/lib/services/recipe.service.test.ts`

**Scenariusze testowe:**
- ✅ Pobieranie istniejącego przepisu zwraca pełne dane
- ✅ Pobieranie nieistniejącego przepisu zwraca null
- ✅ RLS blokuje dostęp do przepisu innego użytkownika
- ✅ Składniki są sortowane według sort_order
- ✅ meal_plan_assignments jest poprawnie zliczany

### Krok 6: Testy integracyjne
**Narzędzie:** Vitest + Supabase Test Client

**Scenariusze:**
- E2E test: GET /api/recipes/:id z prawidłowym tokenem
- E2E test: GET /api/recipes/:id bez tokenu (401)
- E2E test: GET /api/recipes/:id z nieprawidłowym UUID (400)
- E2E test: GET /api/recipes/:id dla nieistniejącego przepisu (404)

### Krok 7: Dokumentacja API
**Lokalizacja:** `.ai/doc/15_api-plan.md` (już istnieje)

**Do zaktualizowania:**
- ✅ Przykłady request/response są aktualne
- ✅ Kody błędów są udokumentowane
- ✅ Typy DTO są zgodne z implementacją

### Krok 8: Code review checklist
**Przed mergem do main:**
- [ ] Wszystkie typy TypeScript są poprawne
- [ ] RLS policies są przetestowane
- [ ] Error handling pokrywa wszystkie scenariusze
- [ ] Brak console.log() w produkcyjnym kodzie (tylko console.error)
- [ ] Response headers zawierają `Content-Type: application/json`
- [ ] Kod jest zgodny z zasadami w `.cursor/rules/`
- [ ] Brak hardcoded values (używaj environment variables)

### Krok 9: Deployment
**Środowisko staging:**
1. Deploy do Vercel preview environment
2. Smoke tests: curl/Postman dla podstawowych scenariuszy
3. Sprawdzenie logów w Supabase Dashboard

**Środowisko production:**
1. Merge PR do main
2. Automatic deploy przez Vercel
3. Monitoring przez Sentry
4. Health check: GET /api/recipes/:id z testowym ID

---

## 10. Checklist implementacji

### Przed rozpoczęciem
- [ ] Przeczytanie całego planu implementacji
- [ ] Sprawdzenie czy baza danych ma wszystkie wymagane indeksy
- [ ] Weryfikacja że RLS policies są włączone na tabelach `recipes`, `ingredients`, `meal_plan`
- [ ] Upewnienie się że Supabase client jest poprawnie skonfigurowany w `context.locals`

### Podczas implementacji
- [ ] Utworzenie pliku `src/pages/api/recipes/[id].ts`
- [ ] Dodanie `export const prerender = false`
- [ ] Implementacja walidacji Zod dla parametru `id`
- [ ] Utworzenie `RecipeService.getRecipeById()` w `src/lib/services/recipe.service.ts`
- [ ] Implementacja GET handler'a z pełną obsługą błędów
- [ ] Dodanie typów TypeScript (import z `src/types.ts`)
- [ ] Test manualny przez Postman/curl

### Po implementacji
- [ ] Code review z focus na security (RLS, auth)
- [ ] Testy integracyjne (minimum 4 scenariusze)
- [ ] Sprawdzenie performance w Supabase Dashboard
- [ ] Dokumentacja API jest aktualna
- [ ] Deploy do staging i smoke tests
- [ ] Deploy do production
- [ ] Monitoring pierwszych 24h (Sentry alerts)

---

**Plan przygotowany przez:** AI Architecture Assistant  
**Data:** 2025-01-25  
**Ostatnia aktualizacja:** 2025-01-25

