# Code Review Checklist: PUT /api/recipes/:id

## ✅ Implementation Complete

### Krok 1: Rozszerzenie warstwy serwisu ✅
- [x] Funkcja `updateRecipe()` dodana do `src/lib/services/recipe.service.ts`
- [x] Import `UpdateRecipeDto` dodany do typów
- [x] Funkcja wyeksportowana
- [x] JSDoc documentation kompletna
- [x] 6-krokowy proces implementacji:
  - [x] Weryfikacja istnienia i własności przepisu
  - [x] Aktualizacja przepisu (name, instructions)
  - [x] Usunięcie starych składników (DELETE)
  - [x] Bulk insert nowych składników
  - [x] Pobranie zaktualizowanego przepisu z ingredients
  - [x] Liczenie meal_plan_assignments

---

### Krok 2: Utworzenie pliku endpointu ✅
- [x] Endpoint `PUT` dodany do `src/pages/api/recipes/[id].ts`
- [x] `export const prerender = false` ustawione
- [x] Importy dodane:
  - [x] `RecipeSchema` z validation
  - [x] `updateRecipe` z service
  - [x] `ValidationErrorResponseDto` z types

---

### Krok 3: Implementacja autentykacji ✅
- [x] `supabase.auth.getUser()` wywołane jako pierwszy krok
- [x] Zwraca 401 Unauthorized jeśli brak użytkownika
- [x] Error response zawiera message "User not authenticated"
- [x] userId jest przypisane do zmiennej

---

### Krok 4: Walidacja parametru URL ✅
- [x] `getRecipeByIdParamsSchema.safeParse()` używane
- [x] Zwraca 400 Bad Request dla invalid UUID
- [x] Error message: "Invalid recipe ID format"

---

### Krok 5: Parsowanie i walidacja body ✅
- [x] `request.json()` w try-catch
- [x] Zwraca 400 dla invalid JSON
- [x] `RecipeSchema.safeParse()` używane do walidacji
- [x] Zwraca 400 z ValidationErrorResponseDto
- [x] Details zawierają `validation.error.flatten().fieldErrors`

---

### Krok 6: Wywołanie serwisu i obsługa odpowiedzi ✅
- [x] `updateRecipe()` wywołane w try-catch
- [x] Null check - zwraca 404 jeśli przepis nie istnieje
- [x] Success case - zwraca 200 z RecipeResponseDto
- [x] Error case - zwraca 500 Internal Server Error
- [x] console.error dla błędów bazy danych
- [x] TODO komentarz dla Sentry logging

---

## 📋 Szczegółowy Checklist

### Wszystkie przypadki błędów obsłużone
- [x] 401 Unauthorized - brak autentykacji
- [x] 400 Bad Request - invalid UUID format
- [x] 400 Bad Request - invalid JSON body
- [x] 400 Bad Request - validation error (Zod)
- [x] 404 Not Found - przepis nie istnieje lub nie należy do użytkownika
- [x] 500 Internal Server Error - błąd bazy danych

### Walidacja Zod działa poprawnie
- [x] RecipeSchema importowany
- [x] safeParse() używane (nie parse())
- [x] Sprawdzenie `validation.success`
- [x] Error details w formacie `flatten().fieldErrors`
- [x] Waliduje:
  - [x] name (3-100 znaków)
  - [x] instructions (10-5000 znaków)
  - [x] ingredients (min 1, max 50)
  - [x] ingredient.name (1-100 znaków)
  - [x] ingredient.quantity (positive lub null)
  - [x] ingredient.unit (max 50 znaków lub null)
  - [x] ingredient.sort_order (int, min 0)

### RLS weryfikowane
- [x] Weryfikacja ownership na poziomie aplikacji (service)
- [x] `.eq("user_id", userId)` w query
- [x] Zwraca null jeśli przepis nie należy do użytkownika
- [x] Endpoint interpretuje null jako 404

### Logowanie błędów
- [x] `console.error()` dla błędów bazy danych
- [x] Kontekst dodany w message (np. "Failed to update recipe")
- [x] TODO komentarz dla Sentry

### Kod zgodny z zasadami projektu
- [x] Early returns dla error conditions
- [x] Guard clauses używane
- [x] Happy path na końcu funkcji
- [x] Brak niepotrzebnych else statements
- [x] Error handling na początku funkcji

### TypeScript
- [x] Kompiluje bez błędów (`npx tsc --noEmit`)
- [x] Typy importowane z `@/types`
- [x] Brak `any` types
- [x] Brak non-null assertions (!) w finalnym kodzie

### ESLint/Prettier
- [x] `npm run lint` zwraca tylko warnings (console.error)
- [x] Prettier auto-fix wykonane
- [x] Brak błędów krytycznych

### Dokumentacja
- [x] JSDoc dla funkcji `updateRecipe()`
- [x] JSDoc dla endpointu PUT
- [x] Komentarze dla każdego kroku procesu
- [x] @param, @returns, @throws opisane

---

## 🔍 Security Checklist

### Authentication
- [x] Token weryfikowany przez Supabase middleware
- [x] `auth.getUser()` wywołane przed operacjami
- [x] Brak hardcoded credentials

### Authorization
- [x] Weryfikacja ownership (user_id) przed update
- [x] RLS włączone na tabelach recipes i ingredients
- [x] Defense in depth (app level + DB level)

### Input Validation
- [x] Wszystkie parametry walidowane (UUID, body)
- [x] Zod schemas używane
- [x] Max limits (50 ingredients, 5000 chars instructions)

### SQL Injection Protection
- [x] Supabase parametryzowane zapytania używane
- [x] Brak surowego SQL
- [x] Brak string concatenation w queries

---

## 🎯 Business Logic Verification

### Full Replacement Strategy
- [x] DELETE all old ingredients
- [x] INSERT new ingredients (bulk)
- [x] Nowe UUID dla ingredients
- [x] `updated_at` automatycznie aktualizowane (DB trigger)

### Data Integrity
- [x] Bulk insert zamiast pojedynczych INSERT
- [x] Ingredients sorted by sort_order przed return
- [x] meal_plan_assignments count included

### Error Recovery
- [x] Logowanie błędów częściowych transakcji
- [x] Clear error messages dla użytkownika
- [x] Nie ujawnia implementation details w error messages

---

## 🧪 Testing Checklist

### Manual Tests Prepared
- [x] Dokumentacja testowa utworzona
- [x] 11 scenariuszy testowych zdefiniowanych
- [x] cURL examples provided
- [ ] ⏳ Testy wykonane (wymaga autentykacji)

### Propagation Tests
- [ ] ⏳ Meal Plan Live Update verified
- [ ] ⏳ Shopping List Snapshot verified

---

## 📊 Performance Checklist

### Database Optimization
- [x] Bulk insert używane
- [x] Single query dla recipe + ingredients (nested select)
- [x] Indeksy istnieją (user_id, recipe_id)

### Potential Bottlenecks
- [x] DELETE + INSERT akceptowalne dla MVP (dokumentowane)
- [x] COUNT query optymalizowane (`head: true`)
- [x] Brak N+1 queries

---

## 📝 Documentation Checklist

- [x] Implementation plan (.ai/doc/17_4_endpoint-PUT-id-recipes-implementation-plan.md)
- [x] Manual tests guide (.ai/doc/18_4_manual-tests-PUT-recipes-id.md)
- [x] Code review checklist (.ai/doc/18_4_code-review-checklist.md)
- [x] JSDoc w kodzie
- [x] Inline comments dla skomplikowanej logiki

---

## ⚠️ Known Limitations (Accepted for MVP)

### Brak Transakcyjności
- **Problem:** Supabase JS SDK nie obsługuje natywnych transakcji
- **Konsekwencja:** W rzadkich przypadkach przepis może być zaktualizowany, ale składniki nie
- **Mitigacja:**
  - Logowanie do console.error
  - TODO dla Sentry
  - Future enhancement: Database Functions (PL/pgSQL)
- **Status:** ✅ Akceptowalne dla MVP

### Propagacja zmian
- **Meal Plans:** Zmiany propagują (live update) - OK
- **Shopping Lists:** Zmiany NIE propagują (snapshot) - OK
- **Status:** ✅ Zgodne ze specyfikacją

---

## 🚀 Ready for Deployment

### Pre-Merge Checklist
- [x] Code review completed
- [x] TypeScript kompiluje
- [x] Linter passed (tylko warnings)
- [x] Dokumentacja complete
- [x] No security issues
- [ ] ⏳ Manual tests passed
- [ ] ⏳ Propagation tests passed

### Deployment Checklist
- [ ] ⏳ Merge do master branch
- [ ] ⏳ CI/CD pipeline verification
- [ ] ⏳ Deployment preview check
- [ ] ⏳ Smoke test na produkcji
- [ ] ⏳ Monitoring setup (Vercel Analytics)

---

## 📌 Notes

1. **console.error warnings** - Akceptowalne zgodnie z projektem (używane do logowania błędów)
2. **Prettier auto-fix** - Wykonane, formatowanie zgodne
3. **Brak testów jednostkowych** - Nie wymagane w MVP, manualne testy wystarczające
4. **Sentry integration** - TODO komentarze dodane, do implementacji w przyszłości

---

## ✅ Final Status

**Implementation:** ✅ COMPLETE
**Code Quality:** ✅ PASS
**Security:** ✅ PASS
**Documentation:** ✅ COMPLETE
**Manual Tests:** ⏳ PENDING (wymaga user authentication)
**Ready for Production:** ⏳ AFTER TESTS

---

## Next Steps

1. ✅ Wykonaj manualne testy z autentykacją (guide: `.ai/doc/18_4_manual-tests-PUT-recipes-id.md`)
2. ✅ Zweryfikuj propagację zmian (meal plan + shopping list)
3. ✅ Merge do master branch
4. ✅ Deploy i monitoring
