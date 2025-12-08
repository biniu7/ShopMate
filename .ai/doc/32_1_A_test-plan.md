# Plan Testów - ShopMate MVP

**Data:** 2025-11-29
**Wersja:** 1.0
**Projekt:** ShopMate - Aplikacja do planowania posiłków i generowania list zakupów

---

## <scratchpad> Analiza projektu

### 1. Zidentyfikowane kluczowe komponenty i moduły

**Frontend:**

- Strony Astro (.astro): Landing page, Dashboard, Kalendarz, Przepisy, Listy zakupów
- Komponenty React (.tsx): Interaktywne elementy UI (kalendarze, formularze, modalne okna)
- Komponenty Shadcn/ui: System komponentów bazujący na Radix UI
- Hooki custom: useCalendar, useRecipeSearch, useDashboard, useWeekNavigation

**Backend:**

- API Endpoints: /api/auth/_, /api/recipes/_, /api/meal-plan/_, /api/shopping-lists/_, /api/ai/\*
- Serwisy biznesowe: recipe.service.ts, meal-plan.service.ts, shopping-list.service.ts, ai-categorization.service.ts, analytics.service.ts
- Middleware: Autentykacja i autoryzacja użytkowników
- Integracja z Supabase: Auth, Database, RLS

**Baza danych:**

- Tabele: recipes, ingredients, meal_plan, shopping_lists, shopping_list_items
- RLS Policies: Izolacja danych użytkowników
- Funkcje bazodanowe: generate_shopping_list

**Integracje zewnętrzne:**

- OpenRouter API / OpenAI API: Kategoryzacja składników AI
- Supabase Auth: Zarządzanie sesjami użytkowników
- @react-pdf/renderer: Generowanie PDF

### 2. Główne funkcjonalności aplikacji

1. **Autentykacja i autoryzacja (FR-001 do FR-004)**
   - Rejestracja użytkownika (email + hasło)
   - Logowanie z sesją persistent
   - Wylogowanie
   - Ochrona tras (middleware)
   - Row Level Security

2. **Zarządzanie przepisami (FR-005 do FR-008)**
   - Tworzenie przepisu z składnikami
   - Wyświetlanie listy przepisów (z wyszukiwaniem, sortowaniem, paginacją)
   - Edycja przepisu
   - Usuwanie przepisu (z cascade na składniki i przypisania do meal plan)

3. **Plan posiłków - Kalendarz (FR-009 do FR-012)**
   - Wyświetlanie kalendarza tygodniowego (7 dni × 4 posiłki)
   - Przypisywanie przepisów do dni i posiłków
   - Edycja przypisań
   - Usuwanie przypisań

4. **Generowanie listy zakupów (FR-013 do FR-018)**
   - Generowanie listy na podstawie kalendarza
   - Generowanie listy na podstawie wybranych przepisów
   - Agregacja składników (sumowanie ilości)
   - AI kategoryzacja składników (7 kategorii)
   - Edycja składników na liście
   - Oznaczanie składników jako kupione

5. **Eksport listy zakupów (FR-019 do FR-020)**
   - Eksport do PDF (z kategoriami, checkboxami)
   - Eksport do TXT (plain text, UTF-8)

6. **Dashboard i statystyki (FR-021 do FR-022)**
   - Wyświetlanie statystyk użytkownika
   - Najnowsze przepisy
   - Nadchodzące posiłki

### 3. Wzorce architektoniczne i struktura projektu

**Architektura warstwowa:**

- **Prezentacja:** Komponenty Astro i React
- **API:** Astro API endpoints (prerender=false)
- **Logika biznesowa:** Serwisy w /lib/services
- **Dostęp do danych:** Supabase client + RLS
- **Walidacja:** Zod schemas w /lib/validation

**Wzorce:**

- Islands Architecture (Astro) - częściowa hydratacja React
- Service Layer Pattern - logika biznesowa oddzielona od API
- Repository Pattern (pośrednio) - Supabase client jako abstrakcja bazy
- Middleware Pattern - autoryzacja na poziomie routing
- DTO Pattern - typy w types.ts

**Separacja odpowiedzialności:**

- `.astro` pliki: Renderowanie po stronie serwera, statyczne komponenty
- `.tsx` pliki: Interaktywne komponenty z hydratacją (client:load, client:idle)
- `src/pages/api/`: API endpoints z walidacją Zod
- `src/lib/services/`: Logika biznesowa z dostępem do Supabase
- `src/lib/validation/`: Schematy Zod
- `src/types.ts`: Typy TypeScript i DTOs

### 4. Technologie testowe odpowiednie dla stosu

**Stack projektu:**

- Astro 5
- React 19
- TypeScript 5
- Supabase (PostgreSQL + Auth)
- Zod
- TanStack Query

**Rekomendowane narzędzia testowe:**

**Unit & Integration Testing:**

- **Vitest** - szybki, kompatybilny z Vite (używany przez Astro), API podobne do Jest
- **@testing-library/react** - testowanie komponentów React
- **@testing-library/user-event** - symulacja interakcji użytkownika
- **@testing-library/jest-dom** - matchers dla DOM assertions

**E2E Testing:**

- **Playwright** - nowoczesny, szybki, cross-browser, doskonałe DX
- Alternatywa: Cypress (ale Playwright jest bardziej aktywnie rozwijany)

**API Testing:**

- **Supertest** - testowanie HTTP endpoints
- **msw (Mock Service Worker)** - mockowanie API w testach

**Database Testing:**

- **Supabase Test Helpers** - testowanie z lokalnym Supabase
- **pg-mem** - in-memory PostgreSQL dla szybkich testów jednostkowych

**Coverage:**

- **c8** lub **istanbul** - pokrycie kodu (wbudowane w Vitest)

### 5. Priorytetyzacja na podstawie krytyczności

**P0 - Krytyczne (blocker):**

1. Autentykacja i autoryzacja (bezpieczeństwo)
2. RLS Policies (izolacja danych)
3. CRUD przepisów (core functionality)
4. Generowanie listy zakupów (główna wartość produktu)
5. Walidacja danych (Zod schemas)

**P1 - Wysokie (major):**

1. Plan posiłków - kalendarz
2. AI kategoryzacja składników (z fallbackiem)
3. Eksport PDF/TXT
4. Middleware (ochrona tras)
5. Agregacja składników w listach

**P2 - Średnie (minor):**

1. Wyszukiwanie i sortowanie przepisów
2. Dashboard i statystyki
3. Paginacja
4. Edycja elementów listy zakupów
5. Oznaczanie jako kupione

**P3 - Niskie (nice to have):**

1. Optymalizacje wydajności
2. Accessibility (WCAG AA)
3. Error boundaries
4. Logging i monitoring

### 6. Potencjalne obszary ryzyka i złożoności

**Wysokie ryzyko:**

1. **Row Level Security (RLS)** - błąd w polityce = wyciek danych
2. **AI kategoryzacja** - zewnętrzna zależność, może zawieść (timeout, rate limit, koszty)
3. **Sesje użytkowników** - refresh token, expiration, concurrent sessions
4. **Cascade deletion** - usuwanie przepisu powinno usunąć składniki i meal plan assignments

**Średnie ryzyko:**

1. **Agregacja składników** - logika sumowania różnych jednostek (kg + g, szt + opakowanie)
2. **Walidacja dat** - week_start_date musi być poniedziałek
3. **Concurrent updates** - race conditions przy edycji tego samego przepisu
4. **PDF generation** - może być wolne dla dużych list

**Niskie ryzyko:**

1. **Performance** - paginacja, lazy loading
2. **Browser compatibility** - React 19 i Astro 5 wymagają nowoczesnych przeglądarek
3. **Accessibilit** - Shadcn/ui jest accessibility-friendly, ale wymaga weryfikacji

</scratchpad>

---

## 1. Wprowadzenie i cel testów

### 1.1 Opis projektu

ShopMate to aplikacja webowa MVP do planowania posiłków i generowania list zakupów. Umożliwia użytkownikom:

- Tworzenie i zarządzanie przepisami kulinarnymi
- Planowanie posiłków w kalendarzu tygodniowym (7 dni × 4 posiłki)
- Automatyczne generowanie list zakupów z agregacją składników
- Kategoryzację składników przy użyciu AI (OpenAI GPT-4o mini)
- Eksport list zakupów do formatów PDF i TXT

**Cele biznesowe:**

- Użytkownik może zaplanować posiłki i wygenerować listę zakupów w <10 minut od rejestracji
- Redukcja marnowania żywności i oszczędność czasu
- Docelowo 1000-10000 użytkowników MVP

### 1.2 Cele testowania

**Główne cele:**

1. **Bezpieczeństwo:** Zapewnienie izolacji danych użytkowników przez Row Level Security
2. **Poprawność funkcjonalna:** Weryfikacja poprawności logiki biznesowej (CRUD, agregacja, kategoryzacja)
3. **Niezawodność:** Zapewnienie odporności na błędy zewnętrznych serwisów (AI, Supabase)
4. **Zgodność z wymaganiami:** Pokrycie wszystkich wymagań funkcjonalnych z PRD
5. **Jakość kodu:** Utrzymanie wysokiego poziomu testów automatycznych (docelowe pokrycie >80%)

**Cele dodatkowe:**

- Zapobieganie regresji przy przyszłych zmianach
- Dokumentacja zachowania systemu przez testy
- Skrócenie czasu weryfikacji w procesie CI/CD

---

## 2. Zakres testów

### 2.1 Co będzie testowane

**Backend:**

- ✅ API Endpoints (autentykacja, przepisy, plan posiłków, listy zakupów, AI)
- ✅ Serwisy biznesowe (recipe.service, meal-plan.service, shopping-list.service, ai-categorization.service)
- ✅ Walidacja danych (Zod schemas)
- ✅ Middleware (autoryzacja, ochrona tras)
- ✅ Integracja z Supabase (Auth, Database, RLS)
- ✅ Logika agregacji składników
- ✅ AI kategoryzacja z fallbackiem

**Frontend:**

- ✅ Komponenty React (formularze, kalendarze, listy)
- ✅ Custom hooks (useCalendar, useRecipeSearch, useDashboard)
- ✅ Interakcje użytkownika (kliknięcia, wypełnianie formularzy)
- ✅ Renderowanie warunkowe i obsługa błędów
- ✅ Stan aplikacji (TanStack Query)

**Integracje:**

- ✅ Komunikacja z Supabase
- ✅ Komunikacja z OpenRouter/OpenAI API
- ✅ Generowanie PDF (@react-pdf/renderer)
- ✅ Generowanie TXT

**Baza danych:**

- ✅ RLS Policies (testy integracyjne)
- ✅ Funkcje bazodanowe (generate_shopping_list)
- ✅ Cascade deletion

**E2E (End-to-End):**

- ✅ Pełne flow użytkownika: rejestracja → dodanie przepisu → plan posiłków → generowanie listy → eksport
- ✅ Krytyczne ścieżki biznesowe

### 2.2 Co jest poza zakresem

**Wyłączone z MVP (zgodnie z PRD):**

- ❌ Import przepisów z JPG/PDF/DOCX
- ❌ Natywne aplikacje mobilne (iOS, Android)
- ❌ Udostępnianie przepisów między użytkownikami
- ❌ Integracje zewnętrzne (Trello, Google Calendar)
- ❌ Wsparcie wielojęzyczne (tylko polski)
- ❌ Zaawansowane planowanie (szablony, drag-drop)
- ❌ Powiadomienia push/email
- ❌ Zarządzanie dietami i alergiami
- ❌ 2FA (two-factor authentication)
- ❌ Konwersja jednostek miar
- ❌ Śledzenie cen produktów
- ❌ Funkcje społecznościowe

**Tymczasowo wyłączone (do późniejszych faz):**

- ⏸️ Testy wydajnościowe (performance) - dopiero po MVP
- ⏸️ Testy obciążeniowe (load testing) - dopiero po MVP
- ⏸️ Penetration testing - dopiero przed produkcją
- ⏸️ Accessibility testing (pełne WCAG AA) - częściowo w MVP, pełna weryfikacja później
- ⏸️ Cross-browser testing (tylko Chrome/Firefox/Safari w MVP)
- ⏸️ Mobile responsiveness testing (podstawowa weryfikacja w Playwright)

---

## 3. Strategia testowania

### 3.1 Piramida testów

Zastosujemy klasyczną piramidę testów:

```
       /\
      /  \     E2E Tests (10%)
     /____\    - Pełne flow użytkownika
    /      \   - Krytyczne ścieżki biznesowe
   /        \
  /__________\ Integration Tests (30%)
 /            \ - API endpoints z bazą danych
/              \- Komponenty React z API
/________________\ Unit Tests (60%)
                   - Funkcje utils
                   - Serwisy biznesowe
                   - Walidacja Zod
                   - Komponenty w izolacji
```

**Uzasadnienie:**

- **60% Unit Tests:** Szybkie, łatwe w utrzymaniu, precyzyjne diagnozowanie błędów
- **30% Integration Tests:** Weryfikacja komunikacji między modułami
- **10% E2E Tests:** Pokrycie krytycznych flow, wolne ale symulują rzeczywiste użycie

### 3.2 Rodzaje testów

#### 3.2.1 Testy jednostkowe (Unit Tests)

**Cel:** Testowanie pojedynczych funkcji/metod w izolacji

**Narzędzia:** Vitest + @testing-library/react

**Zakres:**

- Funkcje utils (date.ts, text.ts, calendar.ts)
- Schematy walidacji Zod
- Logika w serwisach (bez wywołań Supabase - mockowane)
- Pure functions w komponentach React
- Custom hooks (z renderHook)

**Przykłady:**

- `calendar.ts`: Funkcja `getWeekDates()` zwraca poprawne daty
- `recipe.schema.ts`: Schema odrzuca niepoprawne dane
- `ai-categorization.service.ts`: Fallback do "Inne" gdy AI zwraca błąd

#### 3.2.2 Testy integracyjne (Integration Tests)

**Cel:** Testowanie komunikacji między modułami

**Narzędzia:** Vitest + Supertest + Supabase Test Helpers

**Zakres:**

- API endpoints z rzeczywistą bazą danych (Supabase lokalnie)
- Serwisy z Supabase client
- RLS policies (czy użytkownik A nie widzi danych użytkownika B)
- Komponenty React z TanStack Query i API
- Middleware z Supabase Auth

**Przykłady:**

- `POST /api/recipes` tworzy przepis w bazie i zwraca ID
- `DELETE /api/recipes/:id` usuwa składniki (cascade)
- RLS: Użytkownik nie może pobrać przepisu innego użytkownika
- `ShoppingListGenerateView` wywołuje API i wyświetla wynik

#### 3.2.3 Testy E2E (End-to-End)

**Cel:** Testowanie pełnych flow użytkownika w przeglądarce

**Narzędzia:** Playwright

**Zakres:**

- Rejestracja → Logowanie → Dashboard
- Tworzenie przepisu → Wyświetlanie w liście
- Planowanie posiłków → Generowanie listy zakupów
- Eksport listy do PDF
- Edycja i usuwanie danych

**Przykłady:**

- **Happy Path:** Użytkownik rejestruje się, tworzy 3 przepisy, przypisuje do kalendarza, generuje listę, eksportuje PDF
- **Error Path:** Użytkownik próbuje utworzyć przepis z pustą nazwą → widzi błąd walidacji

#### 3.2.4 Testy komponentów (Component Tests)

**Cel:** Testowanie komponentów React w izolacji

**Narzędzia:** Vitest + @testing-library/react + @testing-library/user-event

**Zakres:**

- Renderowanie komponentów
- Interakcje użytkownika (kliknięcia, wypełnianie formularzy)
- Props i state
- Conditional rendering
- Error boundaries

**Przykłady:**

- `RecipeCard`: Wyświetla nazwę i liczbę składników
- `RecipeForm`: Waliduje dane przed submitem
- `Calendar`: Wyświetla 7 dni × 4 posiłki

#### 3.2.5 Testy API (API Tests)

**Cel:** Testowanie HTTP endpoints bez UI

**Narzędzia:** Vitest + Supertest (lub fetch w Vitest)

**Zakres:**

- Request validation (Zod)
- Response format (JSON)
- HTTP status codes (200, 400, 401, 404, 500)
- Autoryzacja (middleware)
- Error handling

**Przykłady:**

- `POST /api/auth/register` zwraca 400 dla niepoprawnego email
- `GET /api/recipes` zwraca 401 bez tokenu autoryzacji
- `DELETE /api/recipes/:id` zwraca 404 dla nieistniejącego ID

#### 3.2.6 Testy bezpieczeństwa (Security Tests)

**Cel:** Weryfikacja izolacji danych i ochrony przed atakami

**Narzędzia:** Vitest + Supabase Test Helpers + manualne testy

**Zakres:**

- RLS Policies (czy użytkownik widzi tylko swoje dane)
- SQL Injection (walidacja Zod + parametryzowane queries Supabase)
- XSS (React auto-escaping, brak dangerouslySetInnerHTML)
- CSRF (httpOnly cookies, SameSite attribute)
- Ochrona API endpoints (middleware)

**Przykłady:**

- Użytkownik A nie może pobrać przepisu użytkownika B
- POST /api/recipes odrzuca request bez tokenu
- Middleware przekierowuje niezalogowanych użytkowników do /login

---

## 4. Środowisko testowe

### 4.1 Narzędzia i frameworki

#### 4.1.1 Framework testowy

**Vitest 2.x**

- **Dlaczego:** Natywnie wspiera Vite (używany przez Astro), kompatybilny z ESM, ultra-szybki
- **Instalacja:** `npm install -D vitest @vitest/ui`
- **Konfiguracja:** `vitest.config.ts` z aliasami TypeScript (@/...)
- **Wsparcie:** TypeScript, ESM, coverage (c8), watch mode

#### 4.1.2 Testy komponentów React

**@testing-library/react 16.x**

- **Dlaczego:** Standardowe narzędzie do testowania React, philosophy: "test jak użytkownik"
- **Instalacja:** `npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event`
- **Dodatki:**
  - `@testing-library/jest-dom`: Custom matchers (toBeInTheDocument, toHaveValue)
  - `@testing-library/user-event`: Symulacja interakcji użytkownika
  - `@testing-library/react-hooks`: Testowanie custom hooks (wbudowane w React 18+)

#### 4.1.3 Testy E2E

**Playwright 1.x**

- **Dlaczego:** Nowoczesny, szybki, cross-browser, doskonałe DX, auto-wait
- **Instalacja:** `npm install -D @playwright/test`
- **Browsers:** Chromium, Firefox, WebKit (Safari)
- **Features:**
  - Auto-screenshots na błędach
  - Video recording
  - Network mocking
  - Parallel execution
  - Trace viewer

#### 4.1.4 Mockowanie API

**MSW (Mock Service Worker) 2.x**

- **Dlaczego:** Mockowanie API na poziomie network (nie invasive), działa w Node i browser
- **Instalacja:** `npm install -D msw`
- **Use cases:**
  - Mockowanie Supabase API w testach jednostkowych
  - Mockowanie OpenAI API w testach integracyjnych
  - Symulacja błędów (timeout, 500, rate limit)

#### 4.1.5 Testowanie bazy danych

**Supabase Local Development**

- **Dlaczego:** Testowanie z rzeczywistym PostgreSQL (lokalnie przez Docker)
- **Setup:** `supabase init`, `supabase start`
- **Features:**
  - Automatyczne migracje
  - Seed data
  - RLS testing
  - Funkcje bazodanowe

**pg-mem (opcjonalnie)**

- **Dlaczego:** In-memory PostgreSQL dla ultra-szybkich testów jednostkowych
- **Instalacja:** `npm install -D pg-mem`
- **Use case:** Testy serwisów bez lokalnego Supabase

#### 4.1.6 Coverage

**c8 (wbudowane w Vitest)**

- **Konfiguracja:** `vitest.config.ts` → `test.coverage`
- **Formaty:** HTML, JSON, LCOV
- **Thresholds:** Minimum 80% pokrycia kodu (configurable)

### 4.2 Konfiguracja środowisk

#### 4.2.1 Środowisko lokalne (Development)

**Wymagania:**

- Node.js 20.x
- Docker Desktop (dla Supabase local)
- Git

**Setup:**

```bash
# Install dependencies
npm install

# Start Supabase locally
supabase start

# Run tests
npm run test        # Unit + Integration
npm run test:e2e    # E2E (Playwright)
npm run test:coverage # With coverage report
```

**Zmienne środowiskowe (.env.test):**

```
SUPABASE_URL=http://localhost:54321
SUPABASE_KEY=<anon-key-from-supabase-start>
OPENAI_API_KEY=<test-key-or-mock>
```

#### 4.2.2 Środowisko CI/CD (GitHub Actions)

**Pipeline:**

1. Checkout code
2. Install dependencies (`npm ci`)
3. Start Supabase (Supabase CLI in CI)
4. Run linting (`npm run lint`)
5. Run unit + integration tests (`npm run test`)
6. Run E2E tests (`npx playwright test`)
7. Upload coverage reports (Codecov)
8. Build aplikacji (`npm run build`)

**Konfiguracja (.github/workflows/test.yml):**

- Triggers: push, pull_request
- Parallel jobs: lint, test, e2e
- Artifacts: coverage reports, Playwright traces

#### 4.2.3 Środowisko Staging (opcjonalnie)

**Deployment:**

- Vercel Preview Deployment
- Supabase Preview Branch

**Testy:**

- Smoke tests E2E na staging
- Manual testing przez QA

---

## 5. Priorytetyzacja testów

### 5.1 Kryteria priorytetyzacji

1. **Krytyczność biznesowa:** Czy funkcjonalność jest core value proposition?
2. **Ryzyko bezpieczeństwa:** Czy błąd może prowadzić do wycieku danych?
3. **Złożoność:** Czy kod jest skomplikowany i podatny na błędy?
4. **Częstotliwość użycia:** Czy użytkownik korzysta z tego często?
5. **Wpływ na użytkownika:** Czy błąd zablokuje użytkownika?

### 5.2 Priorytety testów

#### P0 - Krytyczne (muszą być przed MVP)

**Autentykacja i bezpieczeństwo:**

- ✅ RLS Policies dla wszystkich tabel
- ✅ Middleware: ochrona tras, autoryzacja
- ✅ API: weryfikacja tokenu w każdym endpoint
- ✅ Testy: Użytkownik A nie widzi danych użytkownika B

**CRUD przepisów:**

- ✅ Tworzenie przepisu z składnikami (transakcja)
- ✅ Pobieranie listy przepisów (paginacja, wyszukiwanie)
- ✅ Edycja przepisu (update ingredients)
- ✅ Usuwanie przepisu (cascade deletion)

**Generowanie listy zakupów:**

- ✅ Agregacja składników (sumowanie ilości)
- ✅ Wywołanie AI kategoryzacji
- ✅ Fallback do "Inne" gdy AI fail
- ✅ Zapis listy do bazy

**Walidacja danych:**

- ✅ Wszystkie Zod schemas
- ✅ API: zwracanie 400 dla niepoprawnych danych

#### P1 - Wysokie (powinny być w MVP)

**Plan posiłków:**

- ✅ Przypisywanie przepisów do kalendarza
- ✅ Pobieranie meal plan dla tygodnia
- ✅ Usuwanie przypisań

**AI kategoryzacja:**

- ✅ Retry logic (2 próby, exponential backoff)
- ✅ Timeout handling (10s)
- ✅ Walidacja kategorii

**Eksport:**

- ✅ Generowanie PDF z kategoriami
- ✅ Generowanie TXT (UTF-8)
- ✅ Poprawność formatu

**Komponenty React:**

- ✅ RecipeForm: walidacja i submit
- ✅ Calendar: wyświetlanie tygodnia
- ✅ ShoppingListGenerateView: wizard flow

#### P2 - Średnie (nice to have w MVP)

**Dodatkowe funkcje:**

- ⚠️ Dashboard: statystyki użytkownika
- ⚠️ Wyszukiwanie przepisów (debouncing)
- ⚠️ Sortowanie przepisów
- ⚠️ Edycja pozycji listy zakupów
- ⚠️ Oznaczanie jako kupione

**Optymalizacje:**

- ⚠️ Caching (TanStack Query)
- ⚠️ Lazy loading komponentów
- ⚠️ Optimistic updates

#### P3 - Niskie (post-MVP)

**Polishing:**

- ⏸️ Error boundaries
- ⏸️ Accessibility (WCAG AA)
- ⏸️ Performance optimizations
- ⏸️ Analytics tracking

---

## 6. Komponenty do przetestowania

### 6.1 Backend - API Endpoints

#### 6.1.1 Autentykacja (`/api/auth/*`)

**Endpoints:**

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/reset-password`
- `POST /api/auth/update-password`

**Testy:**

- ✅ Rejestracja: walidacja email i hasła, tworzenie użytkownika
- ✅ Logowanie: poprawne credentials → 200 + cookie
- ✅ Logowanie: niepoprawne credentials → 401
- ✅ Wylogowanie: usunięcie sesji
- ✅ Cookies: httpOnly, SameSite, Secure

#### 6.1.2 Przepisy (`/api/recipes/*`)

**Endpoints:**

- `GET /api/recipes` (lista z paginacją, wyszukiwaniem, sortowaniem)
- `POST /api/recipes` (utworzenie z składnikami)
- `GET /api/recipes/:id` (szczegóły z ingredients i meal_plan_assignments)
- `PUT /api/recipes/:id` (edycja z update ingredients)
- `DELETE /api/recipes/:id` (cascade deletion)

**Testy:**

- ✅ GET: paginacja (page, limit), wyszukiwanie (search), sortowanie (sort)
- ✅ POST: walidacja (min 1 składnik, max 50), transakcja (recipe + ingredients)
- ✅ POST: rollback gdy ingredients fail
- ✅ GET :id: zwraca 404 dla nieistniejącego, 403 dla cudzego przepisu
- ✅ PUT: update recipe + replace all ingredients
- ✅ DELETE: cascade delete ingredients + meal_plan

#### 6.1.3 Plan posiłków (`/api/meal-plan/*`)

**Endpoints:**

- `GET /api/meal-plan?week_start_date=YYYY-MM-DD`
- `POST /api/meal-plan` (przypisanie przepisu)
- `DELETE /api/meal-plan/:id`

**Testy:**

- ✅ GET: filtrowanie po week_start_date (musi być poniedziałek)
- ✅ POST: walidacja day_of_week (1-7), meal_type (breakfast, ...)
- ✅ POST: weryfikacja że recipe_id istnieje
- ✅ DELETE: tylko własne przypisania

#### 6.1.4 Listy zakupów (`/api/shopping-lists/*`)

**Endpoints:**

- `POST /api/shopping-lists/preview` (preview bez zapisu)
- `POST /api/shopping-lists` (generowanie i zapis)
- `GET /api/shopping-lists` (historia list)
- `GET /api/shopping-lists/:id` (szczegóły listy)
- `DELETE /api/shopping-lists/:id`
- `PATCH /api/shopping-lists/:list_id/items/:item_id` (edycja pozycji)

**Testy:**

- ✅ Preview: agregacja składników z wielu przepisów
- ✅ Preview: sumowanie ilości (np. 2 jajka + 3 jajka = 5 jajek)
- ✅ POST: wywołanie AI kategoryzacji
- ✅ POST: fallback do "Inne" gdy AI fail
- ✅ GET: tylko własne listy
- ✅ PATCH items: edycja quantity, category, is_checked

#### 6.1.5 AI Kategoryzacja (`/api/ai/categorize-ingredients`)

**Endpoint:**

- `POST /api/ai/categorize-ingredients`

**Testy:**

- ✅ Request: array of ingredient names
- ✅ Response: map of name → category
- ✅ Walidacja kategorii (7 dozwolonych)
- ✅ Fallback do "Inne" dla invalid category
- ✅ Timeout handling (10s)
- ✅ Retry logic (2 attempts)

### 6.2 Backend - Serwisy

#### 6.2.1 recipe.service.ts

**Funkcje:**

- `createRecipe()`
- `getRecipesList()`
- `getRecipeById()`
- `updateRecipe()`
- `deleteRecipe()`

**Testy:**

- ✅ createRecipe: transakcja (recipe + ingredients atomic)
- ✅ createRecipe: rollback gdy ingredients fail
- ✅ getRecipesList: paginacja, wyszukiwanie, sortowanie
- ✅ getRecipeById: zwraca null dla nieistniejącego
- ✅ updateRecipe: replace all ingredients (delete old + insert new)
- ✅ deleteRecipe: cascade delete ingredients + meal_plan

#### 6.2.2 ai-categorization.service.ts

**Funkcje:**

- `categorizeIngredientsWithRetry()`

**Testy:**

- ✅ Wywołanie OpenRouter API
- ✅ Retry 2x z exponential backoff (1s, 2s)
- ✅ Timeout 10s
- ✅ Fallback do "Inne" przy błędzie
- ✅ Walidacja kategorii (tylko dozwolone 7)
- ✅ Max 100 ingredients per request

#### 6.2.3 shopping-list.service.ts

**Funkcje:**

- `generateShoppingListPreview()`
- `createShoppingList()`

**Testy:**

- ✅ Agregacja składników: sumowanie quantities
- ✅ Agregacja: zachowanie unit (kg, g, szt)
- ✅ Integracja z AI categorization
- ✅ Zapis listy i items w bazie (transakcja)

#### 6.2.4 meal-plan.service.ts

**Funkcje:**

- `getMealPlanForWeek()`
- `createMealPlanAssignment()`
- `deleteMealPlanAssignment()`

**Testy:**

- ✅ getMealPlanForWeek: grupowanie po dniach i posiłkach
- ✅ createMealPlanAssignment: walidacja recipe_id istnieje
- ✅ deleteMealPlanAssignment: tylko własne assignments

### 6.3 Backend - Middleware

#### 6.3.1 src/middleware/index.ts

**Funkcje:**

- Session check i refresh
- Ochrona tras (redirect do /login)
- Redirect zalogowanych z /login do /dashboard

**Testy:**

- ✅ Niezalogowany użytkownik: redirect do /login?redirect=...
- ✅ Zalogowany użytkownik na /login: redirect do /dashboard
- ✅ Public paths (/login, /register, /api/auth/\*): dostępne bez logowania
- ✅ Protected paths: wymagają sesji
- ✅ Session refresh: automatyczne odnowienie tokenu

### 6.4 Backend - Walidacja (Zod Schemas)

#### 6.4.1 recipe.schema.ts

**Schemas:**

- `createRecipeSchema`
- `recipeListQuerySchema`

**Testy:**

- ✅ name: min 3, max 100 chars, trim
- ✅ instructions: min 10, max 5000 chars
- ✅ ingredients: min 1, max 50
- ✅ ingredient.name: required, 1-100 chars
- ✅ ingredient.quantity: optional, positive number
- ✅ ingredient.unit: optional, max 50 chars
- ✅ ingredient.sort_order: int, min 0

#### 6.4.2 meal-plan.schema.ts

**Schemas:**

- `mealPlanQuerySchema`
- `createMealPlanSchema`

**Testy:**

- ✅ week_start_date: YYYY-MM-DD, valid date, musi być poniedziałek
- ✅ day_of_week: int 1-7
- ✅ meal_type: enum (breakfast, second_breakfast, lunch, dinner)
- ✅ recipe_id: valid UUID

#### 6.4.3 shopping-list.schema.ts

**Schemas:**

- `shoppingListPreviewSchema`
- `createShoppingListSchema`
- `updateShoppingListItemSchema`

**Testy:**

- ✅ name: max 200 chars, default "Lista zakupów"
- ✅ items: max 100
- ✅ item.ingredient_name: 1-100 chars
- ✅ item.category: enum (7 categories), default "Inne"
- ✅ item.is_checked: boolean, default false

#### 6.4.4 auth.schema.ts

**Schemas:**

- `registerSchema`
- `loginSchema`

**Testy:**

- ✅ email: valid email format, lowercase, trim
- ✅ password: min 8, max 100 chars
- ✅ confirmPassword: matches password (register only)

### 6.5 Frontend - Komponenty React

#### 6.5.1 Komponenty formularzy

**RecipeForm.tsx**

- ✅ Renderowanie pól (name, instructions, ingredients)
- ✅ Walidacja przed submitem (React Hook Form + Zod)
- ✅ Dodawanie/usuwanie składników
- ✅ Submit: wywołanie API
- ✅ Wyświetlanie błędów walidacji

**LoginForm / SignupForm**

- ✅ Walidacja email i hasła
- ✅ Submit: wywołanie API /api/auth/login
- ✅ Redirect po sukcesie
- ✅ Wyświetlanie błędów (niepoprawne credentials)

#### 6.5.2 Komponenty wyświetlania danych

**RecipeCard.tsx**

- ✅ Wyświetlanie nazwy przepisu
- ✅ Liczba składników
- ✅ Przyciski: Edit, Delete
- ✅ Kliknięcie: nawigacja do szczegółów

**RecipesList.tsx**

- ✅ Wyświetlanie listy przepisów
- ✅ Paginacja (przełączanie stron)
- ✅ Wyszukiwanie (debouncing)
- ✅ Sortowanie (dropdown)
- ✅ Empty state (brak przepisów)

**Calendar.tsx / CalendarGrid.tsx**

- ✅ Wyświetlanie 7 dni × 4 posiłki
- ✅ Przypisane przepisy w komórkach
- ✅ Kliknięcie komórki: otwarcie modal wyboru przepisu
- ✅ Usuwanie przypisania (X button)

#### 6.5.3 Komponenty interaktywne

**RecipePickerModal.tsx**

- ✅ Wyświetlanie listy przepisów do wyboru
- ✅ Wyszukiwanie przepisów
- ✅ Wybór przepisu: zamknięcie modal + callback
- ✅ Anulowanie: zamknięcie bez zmian

**ShoppingListGenerateView.tsx**

- ✅ Wizard flow: Step1 → Step2 → Step3 → Step4
- ✅ Wybór źródła: kalendarz vs. przepisy
- ✅ Wybór przepisów (checkboxes)
- ✅ Generowanie preview
- ✅ Edycja pozycji
- ✅ Zapis listy

**ShoppingListExport.tsx**

- ✅ Button: Eksportuj PDF
- ✅ Button: Eksportuj TXT
- ✅ Loading state podczas generowania
- ✅ Download pliku

#### 6.5.4 Custom Hooks

**useCalendar.ts**

- ✅ Fetch meal plan dla tygodnia
- ✅ Dodawanie przypisania
- ✅ Usuwanie przypisania
- ✅ Loading states
- ✅ Error handling

**useRecipeSearch.ts**

- ✅ Debouncing search query (500ms)
- ✅ Fetch recipes z API
- ✅ Cache results (TanStack Query)

**useDashboard.ts**

- ✅ Fetch statystyk użytkownika
- ✅ Fetch ostatnich przepisów
- ✅ Fetch nadchodzących posiłków

**useWeekNavigation.ts**

- ✅ Nawigacja: poprzedni/następny tydzień
- ✅ Obliczanie week_start_date (poniedziałek)
- ✅ Formatowanie dat

### 6.6 Frontend - Strony Astro

**Testowanie stron Astro:**

- ⚠️ Strony Astro (.astro) są renderowane po stronie serwera
- ⚠️ Testy E2E (Playwright) pokrywają routing i SSR
- ⚠️ Unit testing stron Astro jest trudny - skupiamy się na komponentach React

**Pokrycie E2E:**

- ✅ `/` - Landing page
- ✅ `/login` - Logowanie
- ✅ `/register` - Rejestracja
- ✅ `/dashboard` - Dashboard
- ✅ `/recipes` - Lista przepisów
- ✅ `/recipes/new` - Tworzenie przepisu
- ✅ `/recipes/:id` - Szczegóły przepisu
- ✅ `/calendar` - Kalendarz posiłków
- ✅ `/shopping-lists` - Historia list
- ✅ `/shopping-lists/generate` - Generowanie listy

### 6.7 Baza danych

#### 6.7.1 Row Level Security (RLS) Policies

**Tabele:**

- recipes
- ingredients (przez recipe_id)
- meal_plan
- shopping_lists
- shopping_list_items (przez shopping_list_id)

**Testy:**

- ✅ SELECT: Użytkownik widzi tylko swoje rekordy
- ✅ INSERT: Użytkownik może tworzyć tylko pod swoim user_id
- ✅ UPDATE: Użytkownik może edytować tylko swoje rekordy
- ✅ DELETE: Użytkownik może usuwać tylko swoje rekordy
- ✅ Test negatywny: Użytkownik A nie może pobrać/edytować danych użytkownika B

#### 6.7.2 Funkcje bazodanowe

**generate_shopping_list()**

- ✅ Przyjmuje items (JSON), name, week_start_date
- ✅ Tworzy shopping_list i shopping_list_items
- ✅ Zwraca UUID utworzonej listy
- ✅ Transakcja (atomic insert)

#### 6.7.3 Cascade Deletion

**Testy:**

- ✅ Usunięcie recipe → usuwa ingredients
- ✅ Usunięcie recipe → usuwa meal_plan assignments
- ✅ Usunięcie shopping_list → usuwa shopping_list_items

### 6.8 Integracje zewnętrzne

#### 6.8.1 Supabase

**Auth:**

- ✅ signInWithPassword()
- ✅ signUp()
- ✅ signOut()
- ✅ getUser() (session refresh)

**Database:**

- ✅ Queries z RLS
- ✅ Insert, Update, Delete
- ✅ Select z join (recipes + ingredients)

**Mockowanie:**

- ✅ MSW dla mockowania Supabase REST API w testach jednostkowych
- ✅ Supabase Local dla testów integracyjnych

#### 6.8.2 OpenRouter / OpenAI API

**Endpoints:**

- `POST https://openrouter.ai/api/v1/chat/completions`

**Testy:**

- ✅ Mockowanie odpowiedzi AI (MSW)
- ✅ Timeout simulation
- ✅ Rate limit simulation (429)
- ✅ Server error simulation (500)
- ✅ Invalid response format

#### 6.8.3 PDF Generation (@react-pdf/renderer)

**Testy:**

- ✅ Generowanie PDF dla listy zakupów
- ✅ Poprawność struktury (header, kategorie, items, footer)
- ✅ Formatowanie tekstu (polskie znaki UTF-8)
- ✅ Checkbox symbols (☐)
- ✅ Download do przeglądarki

---

## 7. Typy testów dla każdego komponentu

### 7.1 Macierz testów

| Komponent        | Unit | Integration | E2E | Component | API | Security |
| ---------------- | ---- | ----------- | --- | --------- | --- | -------- |
| **Backend**      |
| API Endpoints    | -    | ✅          | ✅  | -         | ✅  | ✅       |
| Serwisy          | ✅   | ✅          | -   | -         | -   | -        |
| Middleware       | ✅   | ✅          | ✅  | -         | -   | ✅       |
| Zod Schemas      | ✅   | -           | -   | -         | -   | -        |
| **Frontend**     |
| Komponenty React | -    | -           | ✅  | ✅        | -   | -        |
| Custom Hooks     | ✅   | ✅          | -   | -         | -   | -        |
| Utils Functions  | ✅   | -           | -   | -         | -   | -        |
| **Database**     |
| RLS Policies     | -    | ✅          | -   | -         | -   | ✅       |
| Functions        | ✅   | ✅          | -   | -         | -   | -        |
| **Integracje**   |
| Supabase         | -    | ✅          | ✅  | -         | -   | -        |
| OpenAI API       | ✅   | ✅          | -   | -         | -   | -        |
| PDF Generation   | ✅   | ✅          | ✅  | -         | -   | -        |

### 7.2 Szczegółowe typy testów

#### 7.2.1 API Endpoints

**Unit Tests:**

- ❌ Nie stosujemy (endpoints testujemy jako integration)

**Integration Tests:**

- ✅ Request validation (Zod schema)
- ✅ Response format (JSON)
- ✅ HTTP status codes
- ✅ Database interaction (z lokalnym Supabase)
- ✅ Error handling

**E2E Tests:**

- ✅ Pełne flow użytkownika przez API
- ✅ CRUD operations w sekwencji

**API Tests:**

- ✅ Wszystkie endpoints
- ✅ Authorization headers
- ✅ Request/response bodies

**Security Tests:**

- ✅ Brak tokenu → 401
- ✅ Cudzy zasób → 403
- ✅ RLS enforcement

**Przykład (POST /api/recipes):**

```typescript
// Integration Test
describe("POST /api/recipes", () => {
  it("should create recipe with ingredients", async () => {
    const response = await request(app)
      .post("/api/recipes")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "Scrambled Eggs",
        instructions: "Beat eggs, cook in pan.",
        ingredients: [
          { name: "jajka", quantity: 2, unit: "szt", sort_order: 0 },
          { name: "masło", quantity: 10, unit: "g", sort_order: 1 },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe("Scrambled Eggs");
    expect(response.body.data.ingredients).toHaveLength(2);

    // Verify in database
    const recipe = await supabase.from("recipes").select("*, ingredients(*)").eq("id", response.body.data.id).single();

    expect(recipe.data.ingredients).toHaveLength(2);
  });

  it("should return 400 for invalid data", async () => {
    const response = await request(app)
      .post("/api/recipes")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "A" }); // Too short, missing ingredients

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Validation failed");
  });

  it("should return 401 without token", async () => {
    const response = await request(app)
      .post("/api/recipes")
      .send({ name: "Test", instructions: "Test", ingredients: [] });

    expect(response.status).toBe(401);
  });
});
```

#### 7.2.2 Serwisy (Services)

**Unit Tests:**

- ✅ Logika biznesowa w izolacji (mockowane Supabase client)
- ✅ Edge cases
- ✅ Error handling

**Integration Tests:**

- ✅ Interakcja z rzeczywistą bazą danych (Supabase local)
- ✅ Transakcje
- ✅ Cascade operations

**Przykład (recipe.service.ts):**

```typescript
// Unit Test (mockowany Supabase)
describe("createRecipe (unit)", () => {
  it("should rollback recipe if ingredients insert fails", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "recipe-123", name: "Test" },
              error: null,
            }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    };

    // Mock ingredients insert to fail
    mockSupabase.from.mockReturnValueOnce({
      insert: vi.fn().mockResolvedValue({
        error: { message: "Ingredients insert failed" },
      }),
    });

    await expect(createRecipe(mockSupabase, "user-123", recipeData)).rejects.toThrow("Failed to create ingredients");

    // Verify recipe was deleted (cleanup)
    expect(mockSupabase.from).toHaveBeenCalledWith("recipes");
    expect(mockSupabase.from().delete).toHaveBeenCalled();
  });
});

// Integration Test (rzeczywisty Supabase)
describe("createRecipe (integration)", () => {
  it("should create recipe with ingredients in database", async () => {
    const recipe = await createRecipe(supabase, userId, {
      name: "Pancakes",
      instructions: "Mix and fry.",
      ingredients: [
        { name: "mąka", quantity: 200, unit: "g", sort_order: 0 },
        { name: "mleko", quantity: 250, unit: "ml", sort_order: 1 },
      ],
    });

    expect(recipe.id).toBeDefined();
    expect(recipe.ingredients).toHaveLength(2);

    // Verify in DB
    const { data } = await supabase.from("recipes").select("*, ingredients(*)").eq("id", recipe.id).single();

    expect(data.ingredients).toHaveLength(2);
  });
});
```

#### 7.2.3 Komponenty React

**Component Tests:**

- ✅ Renderowanie
- ✅ Props
- ✅ Interakcje użytkownika (user-event)
- ✅ Conditional rendering
- ✅ Error states

**Integration Tests:**

- ✅ Integracja z TanStack Query
- ✅ Wywołania API (mockowane przez MSW)

**E2E Tests:**

- ✅ Pełne flow w przeglądarce

**Przykład (RecipeForm.tsx):**

```typescript
// Component Test
describe('RecipeForm', () => {
  it('should render all fields', () => {
    render(<RecipeForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/nazwa przepisu/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/instrukcje/i)).toBeInTheDocument();
    expect(screen.getByText(/składniki/i)).toBeInTheDocument();
  });

  it('should validate before submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<RecipeForm onSubmit={onSubmit} />);

    // Submit without filling fields
    await user.click(screen.getByRole('button', { name: /zapisz/i }));

    // Expect validation errors
    expect(await screen.findByText(/nazwa jest wymagana/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should add ingredient on button click', async () => {
    const user = userEvent.setup();
    render(<RecipeForm onSubmit={vi.fn()} />);

    // Initially 1 ingredient row
    expect(screen.getAllByTestId('ingredient-row')).toHaveLength(1);

    // Click "Dodaj składnik"
    await user.click(screen.getByRole('button', { name: /dodaj składnik/i }));

    // Now 2 ingredient rows
    expect(screen.getAllByTestId('ingredient-row')).toHaveLength(2);
  });

  it('should call onSubmit with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<RecipeForm onSubmit={onSubmit} />);

    // Fill form
    await user.type(screen.getByLabelText(/nazwa przepisu/i), 'Scrambled Eggs');
    await user.type(screen.getByLabelText(/instrukcje/i), 'Beat eggs and cook in pan.');
    await user.type(screen.getByLabelText(/składnik/i), 'jajka');

    // Submit
    await user.click(screen.getByRole('button', { name: /zapisz/i }));

    // Expect onSubmit called
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Scrambled Eggs',
          instructions: 'Beat eggs and cook in pan.',
          ingredients: [expect.objectContaining({ name: 'jajka' })],
        })
      );
    });
  });
});
```

#### 7.2.4 Custom Hooks

**Unit Tests:**

- ✅ Logika hooka (renderHook z @testing-library/react)
- ✅ State changes
- ✅ Return values

**Integration Tests:**

- ✅ Integracja z TanStack Query
- ✅ API calls (mockowane przez MSW)

**Przykład (useWeekNavigation.ts):**

```typescript
describe("useWeekNavigation", () => {
  it("should initialize with current week", () => {
    const { result } = renderHook(() => useWeekNavigation());

    const today = new Date();
    const expectedMonday = getMonday(today);

    expect(result.current.weekStartDate).toBe(format(expectedMonday, "yyyy-MM-dd"));
  });

  it("should navigate to next week", () => {
    const { result } = renderHook(() => useWeekNavigation());

    const initialDate = result.current.weekStartDate;

    act(() => {
      result.current.goToNextWeek();
    });

    const expectedNextMonday = addDays(new Date(initialDate), 7);

    expect(result.current.weekStartDate).toBe(format(expectedNextMonday, "yyyy-MM-dd"));
  });

  it("should navigate to previous week", () => {
    const { result } = renderHook(() => useWeekNavigation());

    const initialDate = result.current.weekStartDate;

    act(() => {
      result.current.goToPreviousWeek();
    });

    const expectedPrevMonday = addDays(new Date(initialDate), -7);

    expect(result.current.weekStartDate).toBe(format(expectedPrevMonday, "yyyy-MM-dd"));
  });
});
```

#### 7.2.5 Zod Schemas

**Unit Tests:**

- ✅ Valid data → success
- ✅ Invalid data → error z opisem
- ✅ Edge cases (min/max, optional fields)

**Przykład (recipe.schema.ts):**

```typescript
describe("createRecipeSchema", () => {
  it("should accept valid recipe data", () => {
    const valid = {
      name: "Scrambled Eggs",
      instructions: "Beat eggs, cook in pan with butter.",
      ingredients: [
        { name: "jajka", quantity: 2, unit: "szt", sort_order: 0 },
        { name: "masło", quantity: 10, unit: "g", sort_order: 1 },
      ],
    };

    const result = createRecipeSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject recipe with name too short", () => {
    const invalid = {
      name: "Ab", // < 3 chars
      instructions: "Test instructions.",
      ingredients: [{ name: "test", sort_order: 0 }],
    };

    const result = createRecipeSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("min 3");
    }
  });

  it("should reject recipe without ingredients", () => {
    const invalid = {
      name: "Test Recipe",
      instructions: "Test instructions.",
      ingredients: [],
    };

    const result = createRecipeSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject recipe with > 50 ingredients", () => {
    const ingredients = Array.from({ length: 51 }, (_, i) => ({
      name: `ingredient-${i}`,
      sort_order: i,
    }));

    const invalid = {
      name: "Test Recipe",
      instructions: "Test instructions.",
      ingredients,
    };

    const result = createRecipeSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
```

#### 7.2.6 RLS Policies

**Integration Tests:**

- ✅ Testy z 2 użytkownikami (user A, user B)
- ✅ Izolacja danych (A nie widzi danych B)

**Security Tests:**

- ✅ Próba odczytu cudzych danych → empty result
- ✅ Próba edycji cudzych danych → error
- ✅ Próba usunięcia cudzych danych → error

**Przykład (RLS dla recipes):**

```typescript
describe("RLS: recipes table", () => {
  let userAClient: SupabaseClient;
  let userBClient: SupabaseClient;
  let recipeA: { id: string };

  beforeEach(async () => {
    // Create 2 users and get their clients
    userAClient = await createTestUser("userA@test.com");
    userBClient = await createTestUser("userB@test.com");

    // User A creates a recipe
    const { data } = await userAClient
      .from("recipes")
      .insert({ name: "Recipe A", instructions: "Instructions A" })
      .select()
      .single();

    recipeA = data;
  });

  it("should allow user to read their own recipes", async () => {
    const { data, error } = await userAClient.from("recipes").select("*").eq("id", recipeA.id).single();

    expect(error).toBeNull();
    expect(data.name).toBe("Recipe A");
  });

  it("should NOT allow user to read other user recipes", async () => {
    const { data, error } = await userBClient.from("recipes").select("*").eq("id", recipeA.id).single();

    // RLS filters out the row - returns empty
    expect(data).toBeNull();
  });

  it("should NOT allow user to update other user recipes", async () => {
    const { error } = await userBClient.from("recipes").update({ name: "Hacked Name" }).eq("id", recipeA.id);

    expect(error).toBeDefined();
    expect(error.message).toContain("policy");
  });

  it("should NOT allow user to delete other user recipes", async () => {
    const { error } = await userBClient.from("recipes").delete().eq("id", recipeA.id);

    expect(error).toBeDefined();
  });
});
```

#### 7.2.7 E2E Tests

**Playwright Tests:**

- ✅ Pełne flow użytkownika
- ✅ Multi-step processes
- ✅ Renderowanie stron
- ✅ Nawigacja

**Przykład (Happy Path: Tworzenie przepisu):**

```typescript
// e2e/recipe-crud.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Recipe CRUD", () => {
  test("should create, view, edit and delete recipe", async ({ page }) => {
    // 1. Register and login
    await page.goto("/register");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.fill('input[name="confirmPassword"]', "password123");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/dashboard");

    // 2. Navigate to create recipe
    await page.click('a[href="/recipes/new"]');
    await expect(page).toHaveURL("/recipes/new");

    // 3. Fill recipe form
    await page.fill('input[name="name"]', "Scrambled Eggs");
    await page.fill('textarea[name="instructions"]', "Beat eggs and cook in pan.");
    await page.fill('input[name="ingredients.0.name"]', "jajka");
    await page.fill('input[name="ingredients.0.quantity"]', "2");
    await page.fill('input[name="ingredients.0.unit"]', "szt");

    // 4. Add second ingredient
    await page.click('button:text("Dodaj składnik")');
    await page.fill('input[name="ingredients.1.name"]', "masło");
    await page.fill('input[name="ingredients.1.quantity"]', "10");
    await page.fill('input[name="ingredients.1.unit"]', "g");

    // 5. Submit form
    await page.click('button[type="submit"]');

    // 6. Verify redirect to recipe details
    await expect(page).toHaveURL(/\/recipes\/[a-f0-9-]+/);
    await expect(page.locator("h1")).toHaveText("Scrambled Eggs");
    await expect(page.locator("text=jajka")).toBeVisible();
    await expect(page.locator("text=masło")).toBeVisible();

    // 7. Edit recipe
    await page.click('button:text("Edytuj")');
    await page.fill('input[name="name"]', "Scrambled Eggs Deluxe");
    await page.click('button[type="submit"]');

    await expect(page.locator("h1")).toHaveText("Scrambled Eggs Deluxe");

    // 8. Delete recipe
    await page.click('button:text("Usuń")');
    await page.click('button:text("Potwierdź")'); // Confirm dialog

    // 9. Verify redirect to recipes list
    await expect(page).toHaveURL("/recipes");
    await expect(page.locator("text=Scrambled Eggs Deluxe")).not.toBeVisible();
  });
});
```

---

## 8. Narzędzia i frameworki testowe

### 8.1 Wybrane narzędzia

#### 8.1.1 Vitest 2.x

**Dlaczego Vitest:**

- ✅ Natywne wsparcie dla Vite (używany przez Astro)
- ✅ Ultra-szybki (cache, parallel execution)
- ✅ Kompatybilny z ESM out-of-the-box
- ✅ API podobne do Jest (łatwa migracja)
- ✅ Wbudowane coverage (c8)
- ✅ Watch mode z HMR
- ✅ TypeScript first-class support

**Instalacja:**

```bash
npm install -D vitest @vitest/ui c8
```

**Konfiguracja (vitest.config.ts):**

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom", // For React components
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "c8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: ["node_modules/", "tests/", "**/*.d.ts", "**/*.config.*", "**/mockData/**"],
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**Setup file (tests/setup.ts):**

```typescript
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

#### 8.1.2 @testing-library/react

**Dlaczego Testing Library:**

- ✅ Philosophy: "Test jak użytkownik"
- ✅ Accessibility-first (getByRole, getByLabelText)
- ✅ Nie testuje implementacji, tylko behavior
- ✅ Doskonałe wsparcie dla React hooks

**Instalacja:**

```bash
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**Przykład użycia:**

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('example', async () => {
  const user = userEvent.setup();
  render(<MyComponent />);

  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(screen.getByText(/success/i)).toBeInTheDocument();
});
```

#### 8.1.3 Playwright

**Dlaczego Playwright:**

- ✅ Nowoczesny, aktywnie rozwijany (Microsoft)
- ✅ Cross-browser (Chromium, Firefox, WebKit)
- ✅ Auto-wait (no flaky tests)
- ✅ Parallel execution
- ✅ Screenshots + video recording
- ✅ Network mocking
- ✅ Trace viewer (debugging)

**Instalacja:**

```bash
npm install -D @playwright/test
npx playwright install
```

**Konfiguracja (playwright.config.ts):**

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

#### 8.1.4 MSW (Mock Service Worker)

**Dlaczego MSW:**

- ✅ Mockowanie API na poziomie network
- ✅ Działa w Node i browser
- ✅ Nie invasive (brak zmian w kodzie produkcyjnym)
- ✅ Realistyczne mockowanie (HTTP responses)

**Instalacja:**

```bash
npm install -D msw
```

**Setup (tests/mocks/handlers.ts):**

```typescript
import { http, HttpResponse } from "msw";

export const handlers = [
  // Mock Supabase Auth
  http.post("https://*.supabase.co/auth/v1/token", () => {
    return HttpResponse.json({
      access_token: "mock-token",
      user: { id: "user-123", email: "test@example.com" },
    });
  }),

  // Mock OpenAI API
  http.post("https://api.openai.com/v1/chat/completions", () => {
    return HttpResponse.json({
      choices: [
        {
          message: {
            content: JSON.stringify({
              0: "Nabiał",
              1: "Warzywa",
            }),
          },
        },
      ],
    });
  }),

  // Mock GET /api/recipes
  http.get("/api/recipes", () => {
    return HttpResponse.json({
      data: [
        { id: "1", name: "Recipe 1", ingredients_count: 3 },
        { id: "2", name: "Recipe 2", ingredients_count: 5 },
      ],
      pagination: { page: 1, limit: 10, total: 2, total_pages: 1 },
    });
  }),
];
```

**Setup MSW server (tests/mocks/server.ts):**

```typescript
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Cleanup after all tests
afterAll(() => server.close());
```

#### 8.1.5 Supabase Local Development

**Setup:**

```bash
# Install Supabase CLI
npm install -D supabase

# Initialize project
npx supabase init

# Start local Supabase (requires Docker)
npx supabase start
```

**Output:**

```
API URL: http://localhost:54321
GraphQL URL: http://localhost:54321/graphql/v1
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
Inbucket URL: http://localhost:54324
anon key: eyJhbGciOi...
service_role key: eyJhbGciOi...
```

**Migrations (supabase/migrations/):**

- Automatyczne wykonywanie migracji przy `supabase start`
- Możliwość seedowania danych testowych

**Testy z Supabase Local:**

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "http://localhost:54321",
  "eyJhbGciOi..." // anon key
);

describe("Recipe CRUD with Supabase", () => {
  it("should create recipe in local DB", async () => {
    const { data, error } = await supabase
      .from("recipes")
      .insert({ name: "Test Recipe", instructions: "Test" })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.name).toBe("Test Recipe");
  });
});
```

### 8.2 Struktura katalogów testowych

```
ShopMate/
├── src/
│   ├── lib/
│   │   ├── services/
│   │   │   ├── recipe.service.ts
│   │   │   └── recipe.service.test.ts  ← Unit tests
│   │   └── validation/
│   │       ├── recipe.schema.ts
│   │       └── recipe.schema.test.ts
│   └── components/
│       ├── RecipeForm.tsx
│       └── RecipeForm.test.tsx  ← Component tests
├── tests/
│   ├── setup.ts  ← Vitest setup
│   ├── mocks/
│   │   ├── server.ts  ← MSW server
│   │   ├── handlers.ts  ← MSW handlers
│   │   └── data.ts  ← Mock data
│   ├── integration/
│   │   ├── api/
│   │   │   ├── recipes.test.ts
│   │   │   ├── meal-plan.test.ts
│   │   │   └── shopping-lists.test.ts
│   │   └── rls/
│   │       ├── recipes-rls.test.ts
│   │       └── shopping-lists-rls.test.ts
│   └── utils/
│       ├── test-helpers.ts
│       └── supabase-helpers.ts
├── e2e/
│   ├── auth.spec.ts
│   ├── recipe-crud.spec.ts
│   ├── meal-plan.spec.ts
│   └── shopping-list.spec.ts
├── vitest.config.ts
└── playwright.config.ts
```

### 8.3 Scripts w package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:integration": "vitest tests/integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:ci": "vitest run && playwright test"
  }
}
```

---

## 9. Kryteria akceptacji

### 9.1 Pokrycie kodu (Code Coverage)

**Minimalne wymagania:**

| Metryka        | Minimum (MVP) | Docelowe (Post-MVP) |
| -------------- | ------------- | ------------------- |
| **Statements** | 80%           | 90%                 |
| **Branches**   | 75%           | 85%                 |
| **Functions**  | 80%           | 90%                 |
| **Lines**      | 80%           | 90%                 |

**Wyjątki (niższe pokrycie akceptowalne):**

- Pliki konfiguracyjne (vitest.config.ts, playwright.config.ts)
- Pliki .astro (trudne do unit testowania - pokryte przez E2E)
- Mock data
- Type definitions (.d.ts)

**Weryfikacja:**

```bash
npm run test:coverage
```

**CI/CD:**

- Coverage report uploading do Codecov
- Pull Request comments z coverage diff
- Fail build jeśli coverage spada poniżej 80%

### 9.2 Testy muszą przechodzić

**Zero tolerancji dla fail:**

- ✅ Wszystkie testy jednostkowe (unit)
- ✅ Wszystkie testy integracyjne (integration)
- ✅ Wszystkie testy E2E (Playwright)
- ✅ Wszystkie testy RLS (security)

**CI/CD:**

- Pull Request nie może być zmergowany jeśli testy fail
- GitHub Actions: status check required

### 9.3 Bezpieczeństwo

**Obowiązkowe testy bezpieczeństwa:**

1. **RLS Policies (wszystkie tabele)**
   - ✅ User A nie widzi danych User B
   - ✅ User nie może edytować/usuwać cudzych danych
   - ✅ Public endpoints (auth) są dostępne bez tokenu
   - ✅ Protected endpoints wymagają tokenu

2. **Autoryzacja API**
   - ✅ Brak tokenu → 401
   - ✅ Nieprawidłowy token → 401
   - ✅ Dostęp do cudzego zasobu → 403

3. **Walidacja danych**
   - ✅ Wszystkie Zod schemas mają testy
   - ✅ SQL injection prevention (parametryzowane queries)
   - ✅ XSS prevention (React auto-escaping)

**Definicja "Done" dla security:**

- Wszystkie testy RLS przechodzą
- Wszystkie testy autoryzacji przechodzą
- Code review przez 2 developerów
- Manual security testing (penetration testing przed produkcją)

### 9.4 Wydajność testów

**Czas wykonania (lokalne):**

- ✅ Unit tests: <30 sekund
- ✅ Integration tests: <2 minuty
- ✅ E2E tests: <5 minut

**CI/CD (GitHub Actions):**

- ✅ Całkowity czas pipeline: <10 minut
- ✅ Parallel execution (lint, test, e2e w osobnych jobs)

**Optymalizacje:**

- Parallel execution (Vitest threads, Playwright workers)
- Cache dependencies (npm ci --cache)
- Reuse Supabase instance (nie restartować między testami)

### 9.5 Dokumentacja testów

**Każdy test powinien mieć:**

- ✅ Czytelny opis (describe, it)
- ✅ Arrange-Act-Assert struktura
- ✅ Komentarze dla skomplikowanej logiki
- ✅ Mockowanie jasno opisane

**Przykład dobrze udokumentowanego testu:**

```typescript
describe("createRecipe", () => {
  /**
   * Test: Recipe creation should be atomic (transaction)
   * If ingredients insert fails, recipe should be rolled back
   */
  it("should rollback recipe if ingredients insert fails", async () => {
    // Arrange: Mock Supabase to fail on ingredients insert
    const mockSupabase = createMockSupabase({
      recipesInsertSuccess: true,
      ingredientsInsertFail: true,
    });

    const recipeData = {
      name: "Test Recipe",
      instructions: "Test instructions.",
      ingredients: [{ name: "test", sort_order: 0 }],
    };

    // Act: Attempt to create recipe
    await expect(createRecipe(mockSupabase, "user-123", recipeData)).rejects.toThrow("Failed to create ingredients");

    // Assert: Verify recipe was deleted (cleanup)
    expect(mockSupabase.from("recipes").delete).toHaveBeenCalledWith(
      expect.objectContaining({ id: expect.any(String) })
    );
  });
});
```

### 9.6 Regression Prevention

**Każdy bug fix musi mieć test:**

- ✅ Zidentyfikuj bug
- ✅ Napisz failing test (reprodukcja błędu)
- ✅ Napraw bug
- ✅ Test przechodzi
- ✅ Commit test + fix razem

**Przykład:**

```typescript
// Bug: Usuwanie przepisu nie usuwa przypisań w meal_plan

describe("deleteRecipe - bug fix", () => {
  /**
   * Regression test for bug #42: Deleting recipe left orphaned meal_plan entries
   * Fix: Added ON DELETE CASCADE to meal_plan.recipe_id foreign key
   */
  it("should cascade delete meal_plan assignments", async () => {
    // Arrange: Create recipe and assign to meal plan
    const recipe = await createRecipe(supabase, userId, recipeData);
    await createMealPlanAssignment(supabase, userId, {
      recipe_id: recipe.id,
      week_start_date: "2025-11-25",
      day_of_week: 1,
      meal_type: "breakfast",
    });

    // Act: Delete recipe
    await deleteRecipe(supabase, recipe.id, userId);

    // Assert: Meal plan assignment should be deleted
    const { data: assignments } = await supabase.from("meal_plan").select("*").eq("recipe_id", recipe.id);

    expect(assignments).toHaveLength(0);
  });
});
```

---

## 10. Harmonogram i zasoby

### 10.1 Fazy wdrożenia testów

#### Faza 1: Setup i infrastruktura (1 tydzień)

**Zadania:**

- ✅ Instalacja Vitest, Testing Library, Playwright
- ✅ Konfiguracja vitest.config.ts, playwright.config.ts
- ✅ Setup MSW (mockowanie API)
- ✅ Setup Supabase Local
- ✅ Konfiguracja CI/CD (GitHub Actions)
- ✅ Dokumentacja (README dla testów)

**Zasoby:**

- 1 developer (full-time)

**Deliverables:**

- ✅ Środowisko testowe gotowe
- ✅ Przykładowy test (smoke test)
- ✅ CI/CD pipeline z testami

#### Faza 2: Testy P0 - Krytyczne (2 tygodnie)

**Zadania:**

- ✅ Testy Zod schemas (wszystkie)
- ✅ Testy RLS policies (wszystkie tabele)
- ✅ Testy API endpoints: autentykacja, przepisy
- ✅ Testy serwisów: recipe.service, ai-categorization.service
- ✅ Testy middleware (autoryzacja)
- ✅ E2E: Rejestracja → Tworzenie przepisu

**Zasoby:**

- 2 developers (full-time)

**Deliverables:**

- ✅ Pokrycie kodu: >60%
- ✅ Wszystkie testy P0 przechodzą
- ✅ Security tests (RLS) przechodzą

#### Faza 3: Testy P1 - Wysokie (2 tygodnie)

**Zadania:**

- ✅ Testy API: meal-plan, shopping-lists
- ✅ Testy serwisów: meal-plan.service, shopping-list.service
- ✅ Testy komponentów React: RecipeForm, Calendar, ShoppingListGenerateView
- ✅ Testy custom hooks: useCalendar, useRecipeSearch
- ✅ E2E: Plan posiłków → Generowanie listy → Eksport PDF

**Zasoby:**

- 2 developers (full-time)

**Deliverables:**

- ✅ Pokrycie kodu: >75%
- ✅ Wszystkie testy P1 przechodzą
- ✅ E2E pokrywa kluczowe flow

#### Faza 4: Testy P2/P3 i polishing (1 tydzień)

**Zadania:**

- ✅ Testy dashboard, statystyki
- ✅ Testy dodatkowych komponentów
- ✅ Refactoring testów (DRY, helper functions)
- ✅ Dokumentacja testów
- ✅ Code review

**Zasoby:**

- 1 developer (full-time)

**Deliverables:**

- ✅ Pokrycie kodu: >80%
- ✅ Wszystkie testy przechodzą
- ✅ Dokumentacja kompletna

### 10.2 Całkowity harmonogram

**Łącznie: 6 tygodni (1.5 miesiąca)**

| Faza          | Czas       | Tygodnie     | Zasoby |
| ------------- | ---------- | ------------ | ------ |
| Faza 1: Setup | 1 tydzień  | Tydzień 1    | 1 dev  |
| Faza 2: P0    | 2 tygodnie | Tygodnie 2-3 | 2 devs |
| Faza 3: P1    | 2 tygodnie | Tygodnie 4-5 | 2 devs |
| Faza 4: P2/P3 | 1 tydzień  | Tydzień 6    | 1 dev  |

**Równoległe wykonanie:**

- Fazy 2-3 można częściowo równoleglizować (jeden dev na backend tests, drugi na frontend tests)
- Faza 4 może być rozłożona na cały projekt (continuous improvement)

### 10.3 Wymagane zasoby

#### 10.3.1 Zasoby ludzkie

**Team:**

- 2 Full-Stack Developers (TypeScript, React, Astro, Supabase)
- 1 QA Engineer (opcjonalnie, do code review testów)

**Umiejętności wymagane:**

- TypeScript / JavaScript (ES6+)
- React 18+ i hooks
- Vitest / Jest
- Testing Library
- Playwright
- Supabase (PostgreSQL, RLS)
- Git (branching, pull requests)

**Training (jeśli zespół nie ma doświadczenia):**

- Vitest: 1 dzień (tutorial + dokumentacja)
- Testing Library: 1 dzień
- Playwright: 1 dzień
- Supabase Local: 0.5 dnia

#### 10.3.2 Zasoby techniczne

**Lokalne:**

- Docker Desktop (dla Supabase local)
- Node.js 20.x
- 8GB RAM minimum (16GB zalecane dla Playwright)

**CI/CD:**

- GitHub Actions (darmowe dla public repos, 2000 min/miesiąc dla private)
- Codecov (darmowe dla open-source)

**Opcjonalnie:**

- BrowserStack / Sauce Labs (do cross-browser testing w chmurze)
- Percy (visual regression testing)

#### 10.3.3 Koszty

**Narzędzia (darmowe w MVP):**

- ✅ Vitest, Testing Library, Playwright - open-source
- ✅ MSW - open-source
- ✅ Supabase Local - darmowe
- ✅ GitHub Actions - darmowe (2000 min/miesiąc)
- ✅ Codecov - darmowe (open-source)

**Całkowite koszty infrastruktury testowej: $0**

**Koszt pracy (szacunkowy):**

- 2 devs × 6 tygodni = 12 person-weeks
- Przy stawce $50/h × 40h/tydzień = $2000/tydzień
- **Łącznie: $24,000**

(Uwaga: To szacunek dla niezależnego zespołu. W firmie koszty są niższe - czas developerów już wliczony w budżet.)

### 10.4 Maintenance (utrzymanie testów)

**Po wdrożeniu:**

- 10% czasu developera = utrzymanie testów
- Nowe feature → nowy test (napisany razem z kodem)
- Bug fix → regression test
- Refactoring → aktualizacja testów

**Code review:**

- Każdy PR wymaga testów
- Code review sprawdza jakość testów
- Minimum 1 approval przed merge

---

## 11. Zarządzanie ryzykiem

### 11.1 Zidentyfikowane ryzyka

#### Ryzyko 1: Row Level Security (RLS) - Wysokie

**Opis:**
Błąd w RLS policy może prowadzić do wycieku danych użytkowników (user A widzi dane user B).

**Prawdopodobieństwo:** Średnie
**Wpływ:** Krytyczny (GDPR violation, utrata zaufania)

**Mitigation:**

1. **Testy RLS dla wszystkich tabel** (P0)
   - Test: User A nie widzi danych User B
   - Test: User nie może edytować cudzych danych
2. **Code review przez 2 developerów** (4-eyes principle)
3. **Penetration testing przed produkcją**
4. **Monitoring w produkcji** (Sentry alerts dla 403 errors)

**Contingency plan:**

- Jeśli wyciek zostanie wykryty: natychmiastowy hotfix + rollback
- Komunikacja z użytkownikami (GDPR notification)
- Audit log (tracking who accessed what)

#### Ryzyko 2: AI Kategoryzacja - Średnie

**Opis:**
OpenAI API może zawieść (timeout, rate limit, downtime), co zablokuje generowanie list zakupów.

**Prawdopodobieństwo:** Średnie (zewnętrzna zależność)
**Wpływ:** Średni (core feature, ale jest fallback)

**Mitigation:**

1. **Fallback do "Inne"** - wszystkie składniki otrzymują kategorię "Inne" gdy AI fail
2. **Retry logic** - 2 próby z exponential backoff (1s, 2s)
3. **Timeout** - 10s max per request
4. **Circuit breaker** - jeśli >50% requestów fail w 5 min, wyłącz AI na 10 min i użyj fallback
5. **Monitoring** - Sentry tracking AI errors, dashboard z success rate

**Contingency plan:**

- Jeśli OpenAI ma długi downtime: przełączenie na inny model (Claude, Gemini) lub wyłączenie AI (fallback only)
- User może manualnie edytować kategorie po wygenerowaniu listy

**Testy:**

- ✅ Timeout simulation (MSW delay response 15s)
- ✅ Rate limit simulation (MSW return 429)
- ✅ Server error simulation (MSW return 500)
- ✅ Invalid response format
- ✅ Fallback correctness (wszystkie składniki → "Inne")

#### Ryzyko 3: Supabase Downtime - Niskie

**Opis:**
Supabase (database + auth) jest single point of failure. Downtime blokuje całą aplikację.

**Prawdopodobieństwo:** Niskie (Supabase SLA 99.9%)
**Wpływ:** Krytyczny (całkowita niedostępność)

**Mitigation:**

1. **Backups** - automatyczne daily backups (Supabase)
2. **Monitoring** - uptime monitoring (UptimeRobot, Pingdom)
3. **Graceful degradation** - wyświetlanie cached data (TanStack Query cache)
4. **Error messaging** - user-friendly message "Service temporarily unavailable"

**Contingency plan:**

- Supabase ma własne redundancy i failover
- W razie długiego downtime: rozważenie migracji na własny PostgreSQL (Neon, AWS RDS)

**Testy:**

- ✅ Supabase error handling (MSW mock Supabase API errors)
- ✅ Offline behavior (service worker cache - post-MVP)

#### Ryzyko 4: Agregacja składników - Średnie

**Opis:**
Logika sumowania składników jest złożona (różne jednostki: kg, g, szt). Błąd może prowadzić do niepoprawnych ilości.

**Prawdopodobieństwo:** Średnie (skomplikowana logika)
**Wpływ:** Niski (user może manualnie poprawić)

**Mitigation:**

1. **Testy edge cases:**
   - ✅ Sumowanie tej samej jednostki (2 jajka + 3 jajka = 5 jajek)
   - ✅ Różne jednostki (200g + 1kg = 200g + 1kg, nie sumujemy)
   - ✅ Null quantity (składnik bez ilości)
2. **Code review** - szczególna uwaga na logikę agregacji
3. **Manual testing** - QA sprawdza różne scenariusze

**Contingency plan:**

- Jeśli błąd zostanie wykryty: hotfix + regression test
- User może edytować pozycje na liście przed zapisem

#### Ryzyko 5: Performance - PDF Generation - Niskie

**Opis:**
Generowanie PDF dla dużej listy (>100 składników) może być wolne, blokując UI.

**Prawdopodobieństwo:** Niskie (MVP: max 50 składników per recipe × 20 recipes = 1000 max)
**Wpływ:** Niski (UX degradation, ale nie blocker)

**Mitigation:**

1. **Loading state** - spinner podczas generowania
2. **Worker thread** - generowanie PDF w Web Worker (post-MVP)
3. **Pagination** - limit 100 składników per PDF (split do multiple PDFs)

**Contingency plan:**

- Jeśli performance problem: optymalizacja @react-pdf/renderer
- Alternatywa: server-side PDF generation (Astro endpoint)

**Testy:**

- ✅ Performance test: generowanie PDF dla 100 składników < 3s
- ⏸️ Load testing (post-MVP)

#### Ryzyko 6: Concurrent Updates - Niskie

**Opis:**
Race condition: dwóch użytkowników edytuje ten sam przepis jednocześnie. Jeden overwrite drugi.

**Prawdopodobieństwo:** Bardzo niskie (MVP: single user per account)
**Wpływ:** Niski (loss of unsaved changes)

**Mitigation:**

1. **Optimistic locking** - `updated_at` timestamp check before update
2. **Conflict detection** - jeśli `updated_at` się zmienił, pokaż warning
3. **Autosave** - periodically save draft (post-MVP)

**Contingency plan:**

- MVP: akceptujemy last-write-wins
- Post-MVP: implementacja optimistic locking

**Testy:**

- ⏸️ Concurrent update test (post-MVP)

#### Ryzyko 7: Browser Compatibility - Niskie

**Opis:**
React 19, Astro 5, modern JS features mogą nie działać w starszych przeglądarkach.

**Prawdopodobieństwo:** Niskie (target: Chrome, Firefox, Safari - modern versions)
**Wpływ:** Niski (mała część użytkowników)

**Mitigation:**

1. **Transpilation** - Vite automatycznie transpiluje do ES2020
2. **Polyfills** - dodanie polyfills dla starszych browsers (post-MVP)
3. **Browser support policy** - dokumentacja: "Chrome 100+, Firefox 100+, Safari 15+"

**Contingency plan:**

- Jeśli zgłoszenia o compatibility: dodanie polyfills lub transpilacja do ES2015

**Testy:**

- ✅ Playwright: testowanie na Chromium, Firefox, WebKit
- ⏸️ BrowserStack (cross-browser testing) - post-MVP

### 11.2 Monitoring i alerting

**W produkcji:**

1. **Sentry (Error Tracking)**
   - Frontend errors (JavaScript exceptions)
   - Backend errors (API 500s)
   - RLS violations (403 errors)
   - AI categorization failures

2. **Plausible / Google Analytics**
   - User flow tracking
   - Drop-off points (gdzie użytkownicy opuszczają aplikację)
   - Feature usage (ile list zakupów generowanych)

3. **Supabase Dashboard**
   - Database performance (slow queries)
   - API rate limits
   - Storage usage

4. **UptimeRobot**
   - Uptime monitoring (ping co 5 min)
   - Alert jeśli downtime >2 min

**Alerty:**

- Email/Slack notification dla:
  - Downtime >5 min
  - Error rate >5% w 10 min
  - RLS violation (403) >10 w 1 min
  - AI categorization failure rate >50% w 5 min

### 11.3 Rollback strategy

**W razie krytycznego błędu w produkcji:**

1. **Immediate rollback:**

   ```bash
   # Vercel: rollback do poprzedniego deployment
   vercel rollback

   # Supabase: rollback migracji bazy danych
   supabase db reset --linked
   ```

2. **Hotfix:**
   - Create hotfix branch from main
   - Fix bug + add regression test
   - Fast-track PR review (1 approval)
   - Deploy hotfix

3. **Post-mortem:**
   - Analiza root cause
   - Dokumentacja (co poszło nie tak, jak naprawiliśmy)
   - Akcje prewencyjne (nowe testy, code review guidelines)

---

## 12. Podsumowanie

### 12.1 Kluczowe wnioski

1. **Strategia testowania jest dopasowana do stosu technologicznego:**
   - Vitest dla unit/integration tests (kompatybilny z Vite/Astro)
   - @testing-library/react dla komponentów React
   - Playwright dla E2E (nowoczesny, szybki)
   - Supabase Local dla testów z bazą danych

2. **Priorytety są jasno zdefiniowane:**
   - P0 (Krytyczne): RLS, autentykacja, CRUD, generowanie list
   - P1 (Wysokie): Plan posiłków, AI kategoryzacja, eksport
   - P2/P3 (Niższe): Dashboard, optymalizacje

3. **Bezpieczeństwo jest priorytetem:**
   - Testy RLS dla wszystkich tabel
   - Testy autoryzacji dla wszystkich API endpoints
   - Code review + penetration testing

4. **Harmonogram jest realistyczny:**
   - 6 tygodni na pełne pokrycie testowe
   - Równoległe wykonanie możliwe (backend + frontend teams)

5. **Ryzyka są zidentyfikowane i zaadresowane:**
   - RLS: testy + code review
   - AI: fallback + retry logic
   - Supabase: monitoring + backups

### 12.2 Metryki sukcesu

**Po zakończeniu wdrożenia testów, projekt będzie uznany za sukces jeśli:**

✅ **Pokrycie kodu:** >80% (statements, branches, functions, lines)
✅ **Zero failing tests:** Wszystkie testy przechodzą (unit, integration, E2E)
✅ **Security tests:** Wszystkie testy RLS i autoryzacji przechodzą
✅ **CI/CD:** Pipeline <10 min, automatyczne sprawdzanie testów w PR
✅ **Dokumentacja:** README z instrukcjami uruchamiania testów
✅ **Regression prevention:** Każdy bug fix ma test

### 12.3 Następne kroki

**Natychmiast (Faza 1 - Setup):**

1. Instalacja Vitest, Testing Library, Playwright
2. Konfiguracja vitest.config.ts, playwright.config.ts
3. Setup Supabase Local + MSW
4. Konfiguracja GitHub Actions (CI/CD)
5. Pierwszy smoke test (sprawdzenie że środowisko działa)

**Krótkoterminowo (Fazy 2-3 - P0/P1):**

1. Testy Zod schemas (wszystkie)
2. Testy RLS policies (wszystkie tabele)
3. Testy API endpoints (autentykacja, przepisy, listy)
4. Testy serwisów (recipe, ai-categorization, shopping-list)
5. Testy komponentów React (RecipeForm, Calendar, ShoppingListGenerateView)
6. E2E: Kluczowe flow użytkownika

**Długoterminowo (Faza 4 i Post-MVP):**

1. Testy P2/P3 (dashboard, dodatkowe funkcje)
2. Performance testing
3. Load testing (dla 10k users)
4. Visual regression testing (Percy)
5. Accessibility testing (WCAG AA full compliance)
6. Continuous improvement (refactoring, optymalizacje)

---

## Załączniki

### A. Referencje

**Dokumentacja:**

- [Vitest](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)
- [MSW](https://mswjs.io/)
- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)

**Artykuły:**

- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Piramida testów](https://martinfowler.com/articles/practical-test-pyramid.html)
- [E2E Testing Strategy](https://www.epicweb.dev/talks/e2e-testing-on-the-modern-web)

### B. Przykładowe testy (snippets)

Zobacz sekcje 7.2.1 - 7.2.7 dla szczegółowych przykładów.

### C. Glosariusz

- **Unit Test:** Test pojedynczej funkcji/metody w izolacji
- **Integration Test:** Test komunikacji między modułami
- **E2E Test:** Test pełnego flow użytkownika w przeglądarce
- **Component Test:** Test komponentu React w izolacji
- **RLS (Row Level Security):** Polityki PostgreSQL ograniczające dostęp do wierszy
- **Mock:** Symulacja zachowania zewnętrznej zależności
- **Coverage:** % kodu pokrytego testami
- **Regression Test:** Test zapobiegający powrotowi naprawionego błędu
- **Flaky Test:** Test który losowo fail (bad practice)
- **AAA:** Arrange-Act-Assert (struktura testu)

---

**Koniec dokumentu**

Plan testów opracował: Claude Code (Anthropic)
Data: 2025-11-29
Wersja: 1.0
