# Architektura UI dla ShopMate MVP

**Data:** 2025-11-06
**Wersja:** 1.0
**Status:** Gotowa do implementacji
**Bazuje na:** PRD v1.0, API Plan v1.0, Notatki z sesji planowania UI

---

## 1. Przegląd struktury UI

### 1.1 Cele Architektury

ShopMate MVP to aplikacja webowa umożliwiająca tworzenie list zakupów na podstawie przepisów przypisanych do kalendarza tygodniowego. Architektura UI została zaprojektowana z myślą o:

1. **Osiągnięciu kluczowego celu biznesowego:** Użytkownik może zaplanować tydzień posiłków i wygenerować listę zakupów w **mniej niż 10 minut** od rejestracji
2. **Minimalizacji JavaScript bundle:** Wykorzystanie Astro islands architecture dla optymalizacji performance (cel: bundle <100KB, LCP <2.5s)
3. **Accessibility-first design:** Zgodność z WCAG AA dla szerokiego grona użytkowników
4. **Mobile-first approach:** Responsywny interfejs z dedykowanymi wzorcami dla mobile, tablet i desktop
5. **Intuicyjnym UX:** Minimalna liczba kliknięć do kluczowych akcji (max 3 kliknięcia), jasne feedback dla użytkownika

### 1.2 Strategia Renderowania

Aplikacja wykorzystuje **"static first" approach** z selektywną hydratacją:

- **Strony główne (.astro):** Landing page, login, register, dashboard jako statyczne layouty Astro
- **Interaktywne komponenty (.tsx):** RecipeForm, Calendar, ShoppingListWizard jako React islands z `client:load` lub `client:visible`
- **Lazy loading:** Ciężkie komponenty (kalendarz, modale) ładowane on-demand z `React.lazy()` + `Suspense`

### 1.3 Architektura komponentów

```
src/
├── layouts/                    # Layouty stron
│   ├── BaseLayout.astro        # Główny layout z meta tags, scripts
│   ├── AuthLayout.astro        # Layout dla login/register
│   └── AppLayout.astro         # Layout dla authenticated pages
│
├── pages/                      # File-based routing (Astro)
│   ├── index.astro             # Landing page
│   ├── login.astro
│   ├── register.astro
│   ├── dashboard.astro
│   ├── recipes/
│   │   ├── index.astro         # Lista przepisów
│   │   ├── new.astro           # Dodaj przepis
│   │   └── [id].astro          # Szczegóły + edycja
│   ├── calendar.astro
│   └── shopping-lists/
│       ├── index.astro         # Historia
│       ├── generate.astro      # Wizard
│       └── [id].astro          # Szczegóły + eksport
│
├── components/
│   ├── ui/                     # Shadcn/ui primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Dialog.tsx
│   │   └── ... (inne Shadcn komponenty)
│   │
│   ├── layout/                 # Komponenty layoutu
│   │   ├── Sidebar.tsx
│   │   ├── BottomNav.tsx
│   │   ├── Header.tsx
│   │   └── Breadcrumbs.tsx
│   │
│   └── features/               # Feature-specific komponenty
│       ├── recipes/
│       │   ├── RecipeForm.tsx
│       │   ├── RecipeCard.tsx
│       │   ├── RecipeList.tsx
│       │   └── RecipePickerModal.tsx
│       ├── calendar/
│       │   ├── Calendar.tsx
│       │   ├── WeekNavigator.tsx
│       │   ├── CalendarGrid.tsx
│       │   └── MealCell.tsx
│       └── shopping-lists/
│           ├── ShoppingListWizard.tsx
│           ├── ShoppingListPreview.tsx
│           ├── CategorySection.tsx
│           └── ExportButtons.tsx
│
├── lib/
│   ├── api/                    # API client i query keys
│   ├── hooks/                  # Custom React hooks
│   ├── utils.ts                # Utility functions (cn(), etc.)
│   └── validation/             # Zod schemas
│
└── middleware/
    └── auth.ts                 # Authentication middleware
```

### 1.4 State Management

| Typ danych                                       | Narzędzie      | Uzasadnienie                              |
| ------------------------------------------------ | -------------- | ----------------------------------------- |
| **Server state** (przepisy, kalendarz, listy)    | TanStack Query | Cache, synchronizacja, background refetch |
| **UI state** (modal open, form inputs)           | React useState | Lokalny, efemeryczny stan                 |
| **URL state** (week_start_date, search, filters) | URL params     | Shareable, bookmarkable, SEO-friendly     |
| **Auth state**                                   | Supabase Auth  | Provider pattern, SSR-compatible          |

---

## 2. Lista widoków

### 2.1 Widoki publiczne (niezalogowani użytkownicy)

#### 2.1.1 Landing Page

**Ścieżka:** `/`

**Główny cel:** Przekonać użytkownika do rejestracji poprzez jasną komunikację value proposition

**Kluczowe informacje:**

- Value proposition: "Zaplanuj posiłki, wygeneruj listę zakupów w 10 minut"
- Features: Kalendarz tygodniowy, AI kategoryzacja, eksport PDF
- Social proof: Testimonials (opcjonalne w MVP)
- CTA: "Rozpocznij za darmo"

**Kluczowe komponenty:**

- `<HeroSection>` - Hero z headline, subheadline, CTA button
- `<FeaturesSection>` - 3 kolumny z ikonami i opisami
- `<HowItWorksSection>` - 3-step process (Dodaj przepisy → Planuj → Generuj listę)
- `<CTASection>` - Final CTA przed footer
- `<Footer>` - Links, copyright

**UX considerations:**

- Hero CTA musi być visible bez scrollowania (above the fold)
- Features sekcja z ikonami wizualnymi (łatwiejsze zrozumienie)
- Mobile: single column, desktop: multi-column grid

**Accessibility:**

- Semantic HTML: `<header>`, `<main>`, `<section>`, `<footer>`
- CTA buttons min 44px height (touch-friendly)
- Alt text dla wszystkich obrazów i ikon

**Security:**

- Brak danych wrażliwych
- CSP headers dla external resources

---

#### 2.1.2 Login

**Ścieżka:** `/login`

**Główny cel:** Zalogować użytkownika do aplikacji

**Kluczowe informacje:**

- Email (input)
- Hasło (input type="password")
- Link "Nie pamiętam hasła" → `/reset-password`
- Link "Nie masz konta? Zarejestruj się" → `/register`
- Query param `?redirect=/calendar` dla powrotu po logowaniu

**Kluczowe komponenty:**

- `<LoginForm>` (React component, client:load)
  - `<Input>` email (Zod validation)
  - `<Input>` password (show/hide toggle)
  - `<Button>` "Zaloguj się" (disabled podczas submit)
  - `<FormMessage>` dla błędów walidacji
  - Link do reset hasła
  - Link do rejestracji

**UX considerations:**

- Auto-focus na email input
- Enter key submits form
- Loading state: disabled button + spinner
- Error handling: "Nieprawidłowy email lub hasło" (nie ujawniaj czy email istnieje)
- Success: redirect do `?redirect` lub `/dashboard`

**Accessibility:**

- Label powiązane z input (`htmlFor`)
- Error messages z `aria-describedby`
- Password toggle button z `aria-label`

**Security:**

- Supabase Auth (httpOnly cookies, JWT)
- Rate limiting (Supabase default: 100 req/min)
- HTTPS only

---

#### 2.1.3 Register

**Ścieżka:** `/register`

**Główny cel:** Utworzyć konto użytkownika

**Kluczowe informacje:**

- Email (validation: email format, lowercase, trim)
- Hasło (validation: 8-100 znaków, min 1 wielka litera, 1 cyfra)
- Potwierdzenie hasła (musi być identyczne)
- Link "Masz już konto? Zaloguj się" → `/login`

**Kluczowe komponenty:**

- `<RegisterForm>` (React component, client:load)
  - `<Input>` email
  - `<Input>` password (strength indicator)
  - `<Input>` confirmPassword
  - `<Button>` "Zarejestruj się"
  - Link do login

**UX considerations:**

- Password strength indicator (weak/medium/strong)
- Real-time validation (debounce 300ms)
- Success: auto-login + redirect do `/dashboard` + Toast "Witaj w ShopMate!"
- Error handling: komunikaty inline pod polami

**Accessibility:**

- Form z semantic `<form>` element
- Labels visible (nie tylko placeholders)
- Error messages announced z `aria-live="polite"`

**Security:**

- Zod schema validation (client + server)
- Supabase Auth email verification (opcjonalne w MVP)
- Password hashing (Supabase automatic)

---

#### 2.1.4 Reset Password

**Ścieżka:** `/reset-password`

**Główny cel:** Umożliwić resetowanie zapomnianego hasła

**Kluczowe informacje:**

- Email (input) - strona wysyłania linku
- Nowe hasło + potwierdzenie - strona po kliknięciu w link

**Kluczowe komponenty:**

- `<ResetPasswordForm>` (2 wersje):
  - **Step 1 (Request):** Email input + "Wyślij link"
  - **Step 2 (Reset):** Nowe hasło + Potwierdzenie + "Zmień hasło"

**UX considerations:**

- Step 1 success: "Sprawdź email. Link resetujący jest ważny przez 24h"
- Step 2 success: "Hasło zmienione" + redirect do `/login`
- Error: "Link wygasł" + CTA "Wyślij ponownie"

**Accessibility:**

- Clear instructions w każdym kroku
- Success messages z `role="status"`

**Security:**

- Supabase magic link (24h expiry)
- Rate limiting na wysyłanie emaili (max 3/hour)

---

### 2.2 Widoki chronione (zalogowani użytkownicy)

#### 2.2.1 Dashboard

**Ścieżka:** `/dashboard`

**Główny cel:** Przegląd stanu aplikacji i szybki dostęp do kluczowych akcji

**Kluczowe informacje:**

- Liczba przepisów użytkownika
- Liczba zaplanowanych posiłków w bieżącym tygodniu
- Liczba zapisanych list zakupów
- Ostatnie 3 przepisy (quick access)
- Nadchodzące posiłki na dziś i jutro

**Kluczowe komponenty:**

- `<StatsCards>` - 3 karty ze statystykami
  - `<StatCard icon="ChefHat" label="Przepisy" value={recipesCount} />`
  - `<StatCard icon="Calendar" label="Zaplanowane posiłki" value={mealPlansCount} />`
  - `<StatCard icon="ShoppingCart" label="Listy zakupów" value={shoppingListsCount} />`
- `<QuickActions>` - 3 CTA buttons
  - "Dodaj przepis" → `/recipes/new`
  - "Zaplanuj tydzień" → `/calendar`
  - "Generuj listę" → `/shopping-lists/generate`
- `<RecentRecipes>` - 3 ostatnie przepisy (cards z preview)
- `<UpcomingMeals>` - Posiłki na dziś i jutro (timeline view)

**UX considerations:**

- Dla nowego użytkownika (0 przepisów): Empty state z onboarding hints
  - "Zacznij od dodania pierwszego przepisu" + duży CTA button
  - Tooltip: "Będziesz mógł przypisać go do kalendarza"
- Quick actions sticky na mobile (bottom bar)
- Stats jako skeleton podczas ładowania

**Accessibility:**

- Stats cards z `aria-label` opisującym wartość
- Links opisowe (nie tylko ikony)

**Security:**

- Middleware sprawdza auth (redirect do `/login` jeśli brak sesji)
- RLS: fetch tylko danych zalogowanego użytkownika

---

#### 2.2.2 Recipes List

**Ścieżka:** `/recipes`

**Główny cel:** Przeglądanie, wyszukiwanie i zarządzanie przepisami użytkownika

**Kluczowe informacje:**

- Lista wszystkich przepisów użytkownika
- Search query (URL param `?search=pasta`)
- Sort (URL param `?sort=name_asc`)
- Pagination/Infinite scroll

**Kluczowe komponenty:**

- `<RecipesHeader>` (sticky top)
  - `<SearchBar>` - Input z debounce 300ms, ikona search
  - `<SortDropdown>` - Select: "Alfabetycznie A-Z" | "Z-A" | "Najnowsze" | "Najstarsze"
  - `<Button>` "Dodaj przepis" (primary, sticky w prawym dolnym rogu mobile)
- `<RecipesList>` (main content)
  - Grid: 3 kolumny (desktop), 2 (tablet), 1 (mobile)
  - `<RecipeCard>` × n
    - Nazwa przepisu (truncate 50 znaków)
    - Liczba składników (badge)
    - Data dodania (relative time: "2 dni temu")
    - Hover: Prefetch recipe details (TanStack Query)
    - Click: Navigate to `/recipes/:id`
- `<LoadMoreButton>` - "Załaduj więcej" (pojawia się przy scroll 80%)
- `<LoadingState>` - Skeleton cards podczas fetch
- `<EmptyState>` - "Brak przepisów" + ilustracja + CTA

**UX considerations:**

- Search z live results (debounce 300ms)
- URL state dla search i sort (bookmarkable)
- ARIA live region: "Załadowano 40 z 120 przepisów"
- Infinite scroll z fallback button (WCAG AA compliance)
- Skeleton screens podczas ładowania (lepsze niż spinner)

**Accessibility:**

- Search input z `aria-label="Wyszukaj przepisy"`
- Recipe cards jako `<article>` z semantic HTML
- Sort dropdown z `<label>` visible
- "Load more" button focusable z klawiatury

**Security:**

- RLS: tylko przepisy zalogowanego użytkownika
- Search query sanitization (Zod)

**API Integration:**

- GET `/api/recipes?search={query}&sort={sort}&page={page}&limit=20`
- TanStack Query:
  ```typescript
  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ["recipes", search, sort],
    queryFn: ({ pageParam = 1 }) => fetchRecipes({ page: pageParam, search, sort }),
    staleTime: 5 * 60 * 1000, // 5 minut
  });
  ```

---

#### 2.2.3 Recipe Create

**Ścieżka:** `/recipes/new`

**Główny cel:** Dodać nowy przepis do kolekcji użytkownika

**Kluczowe informacje:**

- Nazwa przepisu (3-100 znaków)
- Instrukcje (10-5000 znaków, textarea)
- Lista składników (dynamiczna, min 1, max 50)
  - Ilość (opcjonalna, numeryczna)
  - Jednostka (opcjonalna, max 50 znaków)
  - Nazwa (wymagana, 1-100 znaków)

**Kluczowe komponenty:**

- `<RecipeForm>` (React component, client:load)
  - `<Input>` nazwa (validation inline)
  - `<Textarea>` instrukcje (auto-resize, character counter)
  - `<IngredientsList>` (dynamic field array)
    - `<IngredientRow>` × n
      - `<Input>` ilość (type="number", placeholder="200")
      - `<Input>` jednostka (placeholder="g")
      - `<Input>` nazwa (placeholder="mąka")
      - `<Button>` "×" usuń składnik (icon button, destructive)
    - `<Button>` "+ Dodaj składnik" (secondary)
  - `<FormActions>` (sticky bottom)
    - `<Button>` "Anuluj" (ghost) → Navigate back
    - `<Button>` "Zapisz przepis" (primary, disabled if invalid)

**UX considerations:**

- Auto-focus na nazwa input
- Validation w czasie rzeczywistym (Zod schema)
- Character counter przy textarea (5000/5000)
- Składniki: min 1 wymagany (nie można usunąć ostatniego)
- Składniki: drag-and-drop reordering (opcjonalne w MVP)
- Success: Toast "Przepis dodany" + redirect do `/recipes/:id`
- Error: Toast + retry button

**Accessibility:**

- Form z semantic `<form>`
- Labels powiązane z inputs
- Error messages z `aria-describedby`
- "Dodaj składnik" button z clear label

**Security:**

- Zod validation (client + server)
- Max 50 składników (protection against abuse)
- RLS: przepis przypisany do zalogowanego użytkownika

**API Integration:**

- POST `/api/recipes` (body: RecipeSchema)
- TanStack Query mutation:
  ```typescript
  const createRecipe = useMutation({
    mutationFn: (recipe) => api.createRecipe(recipe),
    onSuccess: (newRecipe) => {
      queryClient.invalidateQueries(["recipes"]);
      navigate(`/recipes/${newRecipe.id}`);
      toast.success("Przepis dodany pomyślnie");
    },
  });
  ```

---

#### 2.2.4 Recipe Details

**Ścieżka:** `/recipes/:id`

**Główny cel:** Wyświetlić pełne szczegóły przepisu i umożliwić edycję/usunięcie

**Kluczowe informacje:**

- Nazwa przepisu
- Data dodania i ostatniej edycji
- Lista składników (ilość, jednostka, nazwa)
- Instrukcje (full text z zachowaniem newlines)
- Liczba przypisań w kalendarzu (info message jeśli >0)

**Kluczowe komponenty:**

- `<RecipeHeader>` (sticky top)
  - Breadcrumbs: "Przepisy > Nazwa przepisu"
  - `<Button>` "Edytuj" → `/recipes/:id/edit`
  - `<Button>` "Usuń" (destructive) → Confirmation dialog
- `<RecipeDetails>` (main content)
  - `<RecipeName>` - h1, nazwa przepisu
  - `<RecipeMeta>` - Data dodania, edycji (small text, gray)
  - `<IngredientsSection>`
    - Heading: "Składniki ({count})"
    - `<IngredientsList>` - lista z bullet points
      - `{quantity} {unit} {name}` (np. "200 g mąki")
  - `<InstructionsSection>`
    - Heading: "Instrukcje"
    - Paragraph z preserved newlines (white-space: pre-wrap)
  - `<AssignmentsInfo>` (jeśli >0 przypisań)
    - Info alert: "Ten przepis jest przypisany do 3 posiłków w kalendarzu"
    - Link: "Zobacz kalendarz" → `/calendar`
- `<DeleteConfirmationDialog>` (modal)
  - Title: "Usuń przepis?"
  - Description: "Ten przepis jest przypisany do {count} posiłków. Usunięcie spowoduje usunięcie przypisań."
  - Actions:
    - `<Button>` "Anuluj" (default focus)
    - `<Button>` "Usuń przepis i przypisania" (destructive)

**UX considerations:**

- Breadcrumbs dla orientacji użytkownika
- Składniki jako checklist (opcjonalnie do dodania w przyszłości)
- Instrukcje z czytelną typografią (line-height 1.6)
- Delete confirmation z jasnym komunikatem o konsekwencjach
- Success po usunięciu: redirect do `/recipes` + Toast

**Accessibility:**

- Semantic headings (h1, h2)
- Lists z `<ul>` dla składników
- Delete button z `aria-label="Usuń przepis {name}"`
- Dialog z focus trap

**Security:**

- RLS: tylko przepisy zalogowanego użytkownika
- 404 jeśli przepis nie istnieje lub nie należy do użytkownika

**API Integration:**

- GET `/api/recipes/:id`
- DELETE `/api/recipes/:id`
- TanStack Query:

  ```typescript
  const { data: recipe } = useQuery({
    queryKey: ["recipe", recipeId],
    queryFn: () => api.getRecipe(recipeId),
    staleTime: 10 * 60 * 1000,
  });

  const deleteRecipe = useMutation({
    mutationFn: (id) => api.deleteRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["recipes"]);
      queryClient.invalidateQueries(["meal-plan"]); // Może być przypisany
      navigate("/recipes");
      toast.success("Przepis usunięty");
    },
  });
  ```

---

#### 2.2.5 Recipe Edit

**Ścieżka:** `/recipes/:id/edit` (lub modal/inline w Recipe Details)

**Główny cel:** Edytować istniejący przepis

**Kluczowe informacje:**

- Wszystkie pola z Recipe Create, wypełnione aktualnymi danymi
- Info message: "Zmiany zaktualizują wszystkie przypisania w kalendarzu"

**Kluczowe komponenty:**

- Identyczne jak `<RecipeForm>` w Recipe Create
- Dodatkowo:
  - `<InfoAlert>` - "Zmiany propagują się do kalendarza"
  - Button label: "Zapisz zmiany" (zamiast "Zapisz przepis")

**UX considerations:**

- Wypełniony formularz z aktualnymi danymi
- Validation identyczna jak Create
- Success: redirect do `/recipes/:id` + Toast "Przepis zaktualizowany"
- Cancel: pytanie "Odrzucić zmiany?" jeśli formularz dirty

**Accessibility:**

- Identyczne jak Recipe Create

**Security:**

- RLS: tylko przepisy zalogowanego użytkownika
- Validation identyczna jak Create

**API Integration:**

- PUT `/api/recipes/:id` (full replacement)
- TanStack Query mutation z invalidation:
  ```typescript
  const updateRecipe = useMutation({
    mutationFn: ({ id, recipe }) => api.updateRecipe(id, recipe),
    onSuccess: (updatedRecipe) => {
      queryClient.invalidateQueries(["recipe", updatedRecipe.id]);
      queryClient.invalidateQueries(["recipes"]);
      queryClient.invalidateQueries(["meal-plan"]); // Live update
      navigate(`/recipes/${updatedRecipe.id}`);
      toast.success("Przepis zaktualizowany pomyślnie");
    },
  });
  ```

---

#### 2.2.6 Calendar

**Ścieżka:** `/calendar?week=2025-01-20`

**Główny cel:** Planować posiłki na tydzień poprzez przypisywanie przepisów do konkretnych dni i posiłków

**Kluczowe informacje:**

- Zakres tygodnia (poniedziałek - niedziela)
- 7 dni × 4 posiłki = 28 komórek
- Typy posiłków: Śniadanie, Drugie śniadanie, Obiad, Kolacja
- Przypisane przepisy w komórkach (nazwa, przycisk ×)
- URL state: `?week=YYYY-MM-DD` (deep linking)

**Kluczowe komponenty:**

1. **`<Calendar>` (main container, React component, client:load)**

   **Desktop (≥1024px):**
   - Grid layout: 7 kolumn (dni) × 4 wiersze (posiłki)
   - Fixed header row z nazwami dni
   - Fixed left column z nazwami posiłków

   **Tablet (768-1023px):**
   - Horizontal scroll container
   - Fixed width kolumn

   **Mobile (<768px):**
   - Accordion: każdy dzień jako `<details>` element
   - 4 posiłki wewnątrz każdego dnia

2. **`<WeekNavigator>` (sticky top)**
   - `<Button>` "← Poprzedni tydzień" → week - 7 dni
   - `<span>` "Tydzień 20-26 stycznia 2025" (center, bold)
   - `<Button>` "Bieżący tydzień" → today's week
   - `<Button>` "Następny tydzień →" → week + 7 dni
   - URL update: `/calendar?week=2025-01-27`

3. **`<CalendarGrid>` (responsive layout)**
   - Desktop: CSS Grid (7 columns)
   - Tablet: Horizontal scroll + flexbox
   - Mobile: Accordion (vertical stack)

4. **`<DayColumn>` (desktop/tablet)**
   - Header: Dzień tygodnia + data (np. "Pon 20.01")
   - `<MealCell>` × 4

5. **`<MealCell>` (pojedyncza komórka)**

   **Stan 1: Pusta komórka**
   - `<Button>` "Przypisz przepis" (secondary, full width)
   - Click: Open `<RecipePickerModal>`

   **Stan 2: Przypisany przepis**
   - `<RecipeAssignment>`
     - Nazwa przepisu (truncate 30 znaków)
     - Hover: tooltip z pełną nazwą
     - Click na nazwę: Podgląd przepisu (modal/slide-over)
     - `<Button>` "×" usuń przypisanie (top-right corner, icon button)
       - Click: Optimistic delete (natychmiastowe UI update)
       - Rollback jeśli API error

6. **`<RecipePickerModal>` (lazy loaded, client:idle)**
   - Size: Large (max 900px width desktop, fullscreen mobile)
   - Header:
     - Title: "Wybierz przepis"
     - Close button (×)
   - Content:
     - `<SearchBar>` - search przepisów (debounce 300ms)
     - `<RecipeList>` - lista przepisów (infinite scroll)
       - `<RecipeCard>` clickable
       - Click: Przypisz przepis + zamknij modal + optimistic update
   - Footer: `<Button>` "Anuluj"
   - Backdrop click: zamknij (ale toast "Anulowano")
   - Escape key: zamknij

**UX considerations:**

- Dzisiejszy dzień highlighted (border, background color)
- Puste komórki z hover state (border dashed)
- Week navigator sticky dla łatwej nawigacji
- Deep linking: bookmarkable URLs dla konkretnych tygodni
- Optimistic UI dla assign/delete (instant feedback)
- Loading: skeleton calendar podczas fetch
- Empty state (cały tydzień pusty): hint "Kliknij komórkę aby przypisać przepis"

**Accessibility:**

- Każda komórka z `aria-label="Przypisz przepis do Poniedziałek Śniadanie"`
- Modal z focus trap
- Keyboard navigation: Tab między komórkami, Enter otwiera modal
- ARIA live region: "Przepis przypisany do Poniedziałek Obiad"

**Security:**

- RLS: tylko meal plan zalogowanego użytkownika
- Recipe picker: tylko przepisy użytkownika

**API Integration:**

- GET `/api/meal-plan?week_start_date=2025-01-20`
- POST `/api/meal-plan` (body: { recipe_id, week_start_date, day_of_week, meal_type })
- DELETE `/api/meal-plan/:id`
- TanStack Query:

  ```typescript
  const { data: mealPlan } = useQuery({
    queryKey: ["meal-plan", weekStartDate],
    queryFn: () => api.getMealPlan(weekStartDate),
    staleTime: 0, // Zawsze fresh
    refetchOnWindowFocus: true,
  });

  const assignRecipe = useMutation({
    mutationFn: (assignment) => api.assignRecipe(assignment),
    onMutate: async (newAssignment) => {
      // Optimistic update
      await queryClient.cancelQueries(["meal-plan"]);
      const previous = queryClient.getQueryData(["meal-plan"]);
      queryClient.setQueryData(["meal-plan"], (old) => [...old, newAssignment]);
      return { previous };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["meal-plan"], context.previous);
      toast.error("Nie udało się przypisać przepisu");
    },
    onSettled: () => {
      queryClient.invalidateQueries(["meal-plan"]);
    },
  });
  ```

**Performance optimizations:**

- Prefetch sąsiednich tygodni podczas nawigacji
- Recipe picker modal lazy loaded
- Virtual scrolling dla długiej listy przepisów (opcjonalne)

---

#### 2.2.7 Shopping Lists History

**Ścieżka:** `/shopping-lists`

**Główny cel:** Przeglądanie wszystkich zapisanych list zakupów użytkownika

**Kluczowe informacje:**

- Lista wszystkich zapisanych list (sorted by created_at DESC)
- Każda lista: nazwa, data utworzenia, zakres dat (jeśli z kalendarza), liczba składników

**Kluczowe komponenty:**

- `<ShoppingListsHeader>` (sticky top)
  - Breadcrumbs: "Listy zakupów"
  - `<Button>` "Generuj nową listę" (primary, sticky mobile) → `/shopping-lists/generate`
- `<ShoppingListsList>` (main content)
  - `<ShoppingListCard>` × n
    - Nazwa listy (truncate 60 znaków)
    - Data utworzenia (relative time: "2 dni temu")
    - Zakres dat: "Tydzień 20-26 stycznia" (jeśli z kalendarza)
    - Liczba składników: badge "23 składniki"
    - Click: Navigate to `/shopping-lists/:id`
    - `<Button>` "Usuń" (icon button, top-right) → Confirmation dialog
  - Grid: 2 kolumny (desktop), 1 (mobile)
- `<DeleteConfirmationDialog>`
  - Title: "Usuń listę zakupów?"
  - Description: "Czy na pewno usunąć listę '{name}'?"
  - Actions: "Anuluj" | "Usuń listę"
- `<EmptyState>` (jeśli 0 list)
  - Ilustracja
  - "Nie masz jeszcze list zakupów. Wygeneruj pierwszą!"
  - `<Button>` "Generuj listę"

**UX considerations:**

- Cards clickable (cała powierzchnia, nie tylko tekst)
- Hover state na cards
- Delete button z confirmation (prevent accidental deletion)
- Pagination jeśli >20 list (opcjonalne w MVP)

**Accessibility:**

- Cards jako `<article>` z semantic HTML
- Delete button z `aria-label="Usuń listę {name}"`

**Security:**

- RLS: tylko listy zalogowanego użytkownika

**API Integration:**

- GET `/api/shopping-lists?page=1&limit=20`
- DELETE `/api/shopping-lists/:id`

---

#### 2.2.8 Shopping List Generate (Wizard)

**Ścieżka:** `/shopping-lists/generate`

**Główny cel:** Wygenerować nową listę zakupów poprzez 4-etapowy wizard

**Kluczowe informacje:**

- Tryb generowania (z kalendarza / z przepisów)
- Wybrane posiłki lub przepisy
- Preview składników z AI kategoryzacją
- Edycja przed zapisem

**Kluczowe komponenty:**

**`<ShoppingListWizard>` (main container, React component, client:load)**

**Struktura 4 etapów:**

---

**ETAP 1: Wybór trybu**

**Komponenty:**

- `<ProgressBar>` - 4 steps, current: 1
- `<ModeSelector>`
  - Radio group: "Z kalendarza" (default) | "Z przepisów"
  - Pod każdym: opis
    - "Z kalendarza": "Wybierz posiłki z kalendarza tygodniowego"
    - "Z przepisów": "Wybierz dowolne przepisy z kolekcji"
  - `<Button>` "Dalej" (disabled jeśli nic nie wybrane)

**UX:**

- Auto-select "Z kalendarza" jako default
- Button "Dalej" always enabled (przejście do Step 2)

---

**ETAP 2a: Selekcja z kalendarza**

**Komponenty:**

- `<ProgressBar>` - current: 2
- `<CalendarSelector>`
  - Mini-widok kalendarza (read-only)
  - Checkbox przy każdym dniu/posiłku
  - Shortcut: `<Button>` "Zaznacz cały tydzień" (akcja masowa)
  - Counter: "Zaznaczono 12 posiłków" (live update)
  - Walidacja: Jeśli puste komórki → warning "3 posiłki nie mają przypisanych przepisów" (ale pozwól kontynuować)
- `<Button>` "Wstecz" (secondary)
- `<Button>` "Generuj listę" (primary, disabled jeśli 0 zaznaczonych)

**UX:**

- Checkbox group z select all
- Visual feedback: zaznaczone checkboxy
- Warning alert (żółty) jeśli puste komórki, ale nie blokuj

---

**ETAP 2b: Selekcja z przepisów**

**Komponenty:**

- `<ProgressBar>` - current: 2
- `<RecipeSelector>`
  - `<SearchBar>` - search przepisów (debounce 300ms)
  - Lista przepisów z checkboxami
  - Counter: "Zaznaczono 5 przepisów"
- `<Button>` "Wstecz"
- `<Button>` "Generuj listę" (disabled jeśli 0 zaznaczonych)

**UX:**

- Live search
- Checkbox przy każdym przepisie
- Tooltip na disabled button: "Zaznacz minimum 1 przepis"

---

**ETAP 3: Loading state**

**Komponenty:**

- `<ProgressBar>` - animated progress
  - "Pobieram składniki... 40%"
  - "Agregacja... 70%"
  - "Kategoryzacja AI... 90%"
- `<Spinner>` (center)
- Komunikat: "Kategoryzuję składniki..." (podczas AI call)

**UX:**

- Progress bar animated (smooth transition)
- Nie można anulować (loading state)
- Jeśli AI timeout: Toast info "Automatyczna kategoryzacja niedostępna. Możesz ręcznie przypisać kategorie." + kontynuuj z "Inne"

---

**ETAP 4: Preview i edycja**

**Komponenty:**

- `<ProgressBar>` - current: 4
- `<ShoppingListPreview>`
  - Lista składników pogrupowana po kategoriach (7 sekcji)
  - `<CategorySection>` × 7 (collapsible)
    - Header: Nazwa kategorii (np. "Nabiał") + liczba składników
    - `<IngredientRow>` × n
      - Checkbox (niezaznaczony default)
      - Inline editable: ilość (input), jednostka (input), nazwa (input)
      - Dropdown: zmiana kategorii (7 opcji)
      - `<Button>` "×" usuń składnik (icon button)
  - `<Button>` "+ Dodaj składnik" → Mini-form: nazwa, ilość, jednostka, kategoria
- `<FormActions>` (sticky bottom)
  - `<Button>` "Wstecz"
  - `<Button>` "Anuluj" → redirect do `/shopping-lists`
  - `<Button>` "Zapisz listę" (primary) → Open dialog z nazwą

**UX:**

- Kategorie collapsible (accordion)
- Inline editing z auto-save (local state, nie API)
- Drag-and-drop między kategoriami (opcjonalne w MVP)
- Success: Dialog z nazwą listy → Zapis → Redirect do `/shopping-lists/:id`

---

**`<SaveListDialog>` (modal)**

- Title: "Zapisz listę zakupów"
- Input: Nazwa listy (default: "Lista zakupów - {data}")
- Validation: max 200 znaków
- Actions: "Anuluj" | "Zapisz" (primary)
- Success: Close modal + redirect + Toast "Lista zapisana"

**UX considerations:**

- Wizard z clear progress indicator (breadcrumbs/steps)
- Back navigation: powrót do poprzedniego etapu (zachowanie stanu)
- Walidacja na każdym etapie przed przejściem dalej
- Optimistic UI podczas edycji preview (local state)
- Success flow: redirect do saved list

**Accessibility:**

- Progress bar z `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Each step z `aria-label="Krok 2 z 4: Wybierz posiłki"`
- Checkboxes z labels
- Inline editing z focus management

**Security:**

- Validation na każdym etapie
- Max 20 przepisów, max 100 składników

**API Integration:**

- POST `/api/shopping-lists/preview` (etap 3) - zwraca preview z AI kategoryzacją
- POST `/api/shopping-lists` (etap 4) - zapisuje ostateczną listę

---

#### 2.2.9 Shopping List Details

**Ścieżka:** `/shopping-lists/:id`

**Główny cel:** Wyświetlić szczegóły listy zakupów, umożliwić zaznaczanie składników i eksport

**Kluczowe informacje:**

- Nazwa listy
- Data utworzenia
- Zakres dat (jeśli z kalendarza)
- Składniki pogrupowane po kategoriach (7 sekcji)
- Checkboxy dla składników (is_checked state)

**Kluczowe komponenty:**

- `<ShoppingListHeader>` (sticky top)
  - Breadcrumbs: "Listy zakupów > Nazwa listy"
  - `<ExportButtons>`
    - `<Button>` "Eksportuj PDF" (primary) → Open preview modal
    - `<Button>` "Eksportuj TXT" (secondary) → Direct download
  - `<Button>` "Usuń listę" (destructive) → Confirmation
- `<ShoppingListDetails>` (main content)
  - Title: Nazwa listy (h1)
  - Meta: Data utworzenia, zakres dat (small text)
  - `<CategorySection>` × 7 (collapsible accordion)
    - Header: Nazwa kategorii + liczba składników
    - `<IngredientItem>` × n
      - `<Checkbox>` - is_checked (toggle z optimistic update)
      - Ilość + jednostka + nazwa (np. "200 g mąki")
      - Checked state: line-through text, muted color
- `<PDFPreviewModal>` (lazy loaded)
  - Size: Fullscreen (mobile), large modal (desktop)
  - Content: `<iframe>` z renderowanym PDF
  - Actions: "Pobierz PDF" | "Anuluj"
  - Loading: Skeleton + "Generuję PDF..."

**UX considerations:**

- Checkboxy duże, touch-friendly (min 44px)
- Checked items na dół sekcji (opcjonalne)
- Kategorie collapsible dla łatwiejszego scrollowania
- PDF preview przed pobraniem (user confirmation)
- TXT direct download (no preview)
- Filename: `{nazwa-listy}-{data}.pdf|txt` (lowercase, spacje → myślniki)

**Accessibility:**

- Checkboxes z labels
- Kategorie jako accordion z `aria-expanded`
- PDF preview modal z focus trap

**Security:**

- RLS: tylko listy zalogowanego użytkownika
- 404 jeśli lista nie istnieje

**API Integration:**

- GET `/api/shopping-lists/:id`
- PATCH `/api/shopping-lists/:list_id/items/:item_id` (toggle checkbox)
  - Optimistic update: toggle natychmiast, rollback on error
- DELETE `/api/shopping-lists/:id`

**Export Implementation:**

- PDF: `@react-pdf/renderer` (client-side generation)
  - Layout: A4 pionowy, Helvetica
  - Header: "Lista zakupów - {nazwa}", data
  - Kategorie: bold, uppercase
  - Składniki: checkbox ☐, ilość, jednostka, nazwa
  - Footer: "Wygenerowano przez ShopMate"
- TXT: plaintext
  - Header: "LISTA ZAKUPÓW SHOPMATE", separator (50x =)
  - Kategorie: uppercase, separator (20x -)
  - Składniki: ilość jednostka nazwa (jedna linia)
  - Footer: separator, timestamp
  - Encoding: UTF-8

---

## 3. Mapa podróży użytkownika

### 3.1 Critical Path (Onboarding - cel <10 minut)

**Cel:** Użytkownik od rejestracji do pierwszej listy zakupów w mniej niż 10 minut.

```
START: Landing Page (/)

KROK 1: Rejestracja
├─ Klik CTA "Rozpocznij za darmo"
├─ Formularz rejestracji (/register)
│  └─ Email, hasło, potwierdzenie (validation inline)
├─ Submit: "Zarejestruj się"
├─ Success: Toast "Witaj w ShopMate!"
└─ Auto-redirect: /dashboard

KROK 2: Dashboard (pierwszy raz)
├─ Empty state: "Brak przepisów"
├─ Onboarding hint: "Zacznij od dodania pierwszego przepisu"
├─ Quick action highlighted: "Dodaj przepis"
└─ Klik: → /recipes/new

KROK 3: Dodanie pierwszego przepisu
├─ Uproszczony formularz (tylko nazwa + składniki)
│  └─ Przykład: "Omlet" + ["jajka", "ser", "mleko"]
├─ Submit: "Zapisz przepis"
├─ Success: Toast "Przepis dodany"
├─ Redirect: /recipes/:id
└─ CTA: "Przypisz do kalendarza"

KROK 4: Przypisanie do kalendarza
├─ Redirect: /calendar (dzisiejszy dzień highlighted)
├─ Hint: "Kliknij komórkę aby przypisać przepis"
├─ Klik: Meal Cell (np. Obiad dziś)
├─ Modal: Recipe Picker (pokazuje "Omlet")
├─ Klik: "Omlet"
├─ Optimistic UI: Przepis pojawia się w komórce
└─ Success: Toast "Przepis przypisany"

KROK 5: Szybkie dodanie kolejnych przepisów (opcjonalne)
├─ Kalendarz: CTA "Dodaj więcej przepisów"
├─ Repeat: Dodaj 2-3 przepisy i przypisz
└─ Cel: Min 3-5 posiłków zaplanowanych

KROK 6: Generowanie listy zakupów
├─ Kalendarz: CTA "Generuj listę z tego tygodnia"
├─ Redirect: /shopping-lists/generate
├─ Wizard Step 1: Auto-select "Z kalendarza"
│  └─ Klik: "Dalej"
├─ Wizard Step 2: Shortcut "Zaznacz cały tydzień"
│  └─ Klik: "Generuj listę"
├─ Wizard Step 3: Loading (AI kategoryzacja)
│  └─ Progress bar: "Kategoryzuję składniki... 90%"
├─ Wizard Step 4: Preview
│  └─ Składniki pogrupowane, edycja opcjonalna
├─ Klik: "Zapisz listę"
└─ Dialog: Nazwa listy (default OK)

KROK 7: Eksport PDF
├─ Redirect: /shopping-lists/:id
├─ Klik: "Eksportuj PDF"
├─ Modal: PDF Preview
├─ Klik: "Pobierz PDF"
└─ Success: Plik pobrany, Toast "PDF pobrany"

KONIEC: Sukces! ✓
└─ Użytkownik ma pierwszą listę zakupów gotową do użycia
```

**Metryki sukcesu:**

- **Czas:** <10 minut (critical)
- **Kroki:** 7 głównych akcji (goal: max 10)
- **Kliknięcia do kluczowych akcji:**
  - Dodaj przepis: 2 kliknięcia (Dashboard → Dodaj przepis)
  - Przypisz do kalendarza: 2 kliknięcia (Komórka → Przepis)
  - Generuj listę: 3 kliknięcia (CTA → Zaznacz → Generuj)
  - Eksport PDF: 2 kliknięcia (Eksportuj → Pobierz)

---

### 3.2 Weekly Planning Flow

**Cel:** Zaplanowanie posiłków na nadchodzący tydzień.

```
START: /calendar

KROK 1: Nawigacja do tygodnia
├─ Week Navigator: "Następny tydzień →"
├─ URL update: ?week=2025-02-03
└─ Fetch meal plan dla nowego tygodnia

KROK 2: Przypisywanie przepisów
├─ FOR EACH dzień (Poniedziałek - Niedziela):
│  ├─ FOR EACH posiłek (Śniadanie, Drugie śniadanie, Obiad, Kolacja):
│  │  ├─ Klik: "Przypisz przepis"
│  │  ├─ Modal: Recipe Picker
│  │  │  └─ Search lub scroll → Select przepis
│  │  ├─ Optimistic UI: Przepis w komórce
│  │  └─ Toast: "Przepis przypisany"
│  └─ Repeat dla innych posiłków

KROK 3: Przegląd tygodnia
├─ Sprawdź czy wszystkie posiłki zaplanowane
├─ Jeśli puste komórki: dozwolone (optional meals)
└─ Visual: Zaplanowane posiłki widoczne w kalendarzu

KROK 4: Generowanie listy
├─ Kalendarz: CTA "Generuj listę z tego tygodnia"
└─ Redirect: /shopping-lists/generate (auto-preselect current week)

KONIEC: Lista zakupów wygenerowana
```

**Użyteczne wzorce:**

- **Copy week:** Skopiuj tydzień (out of scope MVP, ale łatwe do dodania)
- **Templates:** Szablony tygodniowe (np. "Tydzień wegetariański")
- **Drag-and-drop:** Przesuwanie przepisów między komórkami (opcjonalne)

---

### 3.3 Recipe Management Flow

**Cel:** Zarządzanie kolekcją przepisów (dodawanie, edycja, usuwanie).

```
START: /recipes

KROK 1: Wyszukiwanie przepisu
├─ Search bar: wpisz "pasta"
├─ Live results (debounce 300ms)
└─ Wyświetl filtered list

KROK 2: Wyświetlenie szczegółów
├─ Hover: Prefetch details (TanStack Query)
├─ Klik: Recipe Card
├─ Redirect: /recipes/:id
└─ Wyświetl: Nazwa, składniki, instrukcje

KROK 3a: Edycja przepisu
├─ Klik: "Edytuj"
├─ Formularz z wypełnionymi danymi
├─ Modyfikacja: zmień ilość składnika
├─ Submit: "Zapisz zmiany"
├─ Optimistic UI: Update recipe details
└─ Toast: "Przepis zaktualizowany"

KROK 3b: Usunięcie przepisu
├─ Klik: "Usuń"
├─ Dialog confirmation: "Ten przepis jest przypisany do 3 posiłków"
├─ Klik: "Usuń przepis i przypisania"
├─ API call: DELETE /api/recipes/:id (cascade)
├─ Invalidate queries: recipes, meal-plan
├─ Redirect: /recipes
└─ Toast: "Przepis usunięty wraz z 3 przypisaniami"

KONIEC: Kolekcja przepisów zaktualizowana
```

---

### 3.4 Shopping List Export Flow

**Cel:** Eksportowanie listy zakupów do PDF lub TXT.

```
START: /shopping-lists/:id

KROK 1: Zaznaczanie składników (optional)
├─ Toggle checkboxy podczas zakupów
├─ Optimistic UI: checkbox + line-through
└─ API: PATCH /api/shopping-lists/:list_id/items/:item_id

KROK 2a: Eksport PDF
├─ Klik: "Eksportuj PDF"
├─ Loading: "Generuję PDF..." (skeleton)
├─ @react-pdf/renderer: generate PDF blob
├─ Modal: PDF Preview (iframe)
├─ Klik: "Pobierz PDF"
├─ Download: [nazwa-listy]-[data].pdf
└─ Toast: "PDF pobrany"

KROK 2b: Eksport TXT
├─ Klik: "Eksportuj TXT"
├─ Generate TXT content (string)
├─ Direct download: [nazwa-listy]-[data].txt (UTF-8)
└─ Toast: "TXT pobrany"

KONIEC: Lista zakupów wyeksportowana
```

---

### 3.5 Error Recovery Flows

**Cel:** Graceful handling błędów API i edge cases.

**Scenariusz 1: API Network Error**

```
Action: Submit recipe form
├─ API call: POST /api/recipes
├─ Error: Network timeout
├─ Toast: "Brak połączenia. Sprawdź internet i spróbuj ponownie."
├─ Retry button: Klik → Retry (exponential backoff)
├─ Success: Recipe created
└─ Toast: "Przepis dodany pomyślnie"
```

**Scenariusz 2: AI Categorization Failure**

```
Action: Generate shopping list
├─ Wizard Step 3: AI categorization call
├─ Error: OpenAI timeout (10s)
├─ Fallback: All items → category "Inne"
├─ Toast info: "Automatyczna kategoryzacja niedostępna. Możesz ręcznie przypisać kategorie."
├─ Wizard Step 4: Preview z wszystkimi "Inne"
├─ User: Ręcznie zmienia kategorie (dropdown)
└─ Success: Save list with user-selected categories
```

**Scenariusz 3: Delete Recipe with Assignments**

```
Action: Delete recipe
├─ Klik: "Usuń"
├─ API: GET /api/recipes/:id (check assignments count)
├─ Dialog: "Ten przepis jest przypisany do 5 posiłków. Usunięcie spowoduje usunięcie przypisań."
├─ User: Klik "Usuń przepis i przypisania"
├─ API: DELETE /api/recipes/:id (cascade)
├─ Success: Invalidate queries + redirect
└─ Toast: "Przepis usunięty wraz z 5 przypisaniami"
```

---

## 4. Układ i struktura nawigacji

### 4.1 Desktop Navigation (≥1024px)

```
┌─────────────────────────────────────────────────────┐
│  Sidebar (fixed left)        Header (sticky top)    │
│  ┌──────────────┐            ┌──────────────────┐   │
│  │ Logo         │            │ Breadcrumbs      │   │
│  │              │            │                  │   │
│  │ Dashboard    │            │ User Menu  ↓     │   │
│  │ Przepisy     │            └──────────────────┘   │
│  │ Kalendarz    │                                    │
│  │ Listy        │            Main Content            │
│  │              │            ┌──────────────────┐   │
│  │ --- separator            │                  │   │
│  │              │            │                  │   │
│  │ Wyloguj      │            │                  │   │
│  └──────────────┘            │                  │   │
│                               │                  │   │
│                               └──────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Sidebar (fixed, left, width: 240px):**

- Logo (top) → Link to `/dashboard`
- Navigation links:
  - Dashboard → `/dashboard` (icon: Home)
  - Przepisy → `/recipes` (icon: ChefHat)
  - Kalendarz → `/calendar` (icon: Calendar)
  - Listy zakupów → `/shopping-lists` (icon: ShoppingCart)
- Separator (hr)
- Wyloguj (bottom) → Logout action (icon: LogOut)

**Active state:**

- Background: primary-50
- Border-left: primary-600 (4px)
- Text: primary-700, font-weight: 600

**Header (sticky top):**

- Breadcrumbs (left): "Przepisy > Nazwa przepisu"
- User menu (right): Avatar dropdown
  - Username + email
  - Link: Ustawienia (out of scope MVP)
  - Link: Wyloguj

---

### 4.2 Tablet Navigation (768-1023px)

```
┌─────────────────────────────────────────────────────┐
│  Top Bar                                             │
│  ┌──────────────────────────────────────────────┐   │
│  │ Logo  Dashboard Przepisy Kalendarz  Listy    │   │
│  │                              Hamburger  ☰    │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Main Content                                        │
│  ┌──────────────────────────────────────────────┐   │
│  │                                              │   │
│  │                                              │   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Top Bar (sticky top):**

- Logo (left)
- Main links (inline, center):
  - Dashboard, Przepisy, Kalendarz, Listy
- Hamburger (right) → Opens drawer
  - Secondary actions: Ustawienia, Wyloguj

**Drawer (Shadcn Sheet, slide from right):**

- User info (top)
- Secondary links
- Wyloguj (bottom)

---

### 4.3 Mobile Navigation (<768px)

```
┌─────────────────────────────────────────────────────┐
│  Top Header (sticky)                                 │
│  ┌──────────────────────────────────────────────┐   │
│  │ ☰ Hamburger    Page Title       Avatar  ⚙   │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Main Content (scrollable)                           │
│  ┌──────────────────────────────────────────────┐   │
│  │                                              │   │
│  │                                              │   │
│  │                                              │   │
│  │                                              │   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Bottom Navigation Bar (fixed)                       │
│  ┌──────────────────────────────────────────────┐   │
│  │  🍳      📅      🛒       📋                   │   │
│  │ Przepisy Kalendarz Lista  Historia           │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Top Header (sticky top, height: 56px):**

- Hamburger icon (left) → Opens drawer
- Page title (center, bold)
- Avatar icon (right) → User menu dropdown

**Hamburger Drawer (Shadcn Sheet, slide from left):**

- User info card (avatar, name, email)
- Links:
  - Dashboard
  - Ustawienia (out of scope MVP)
- Separator
- Wyloguj (destructive)

**Bottom Navigation Bar (fixed bottom, height: 64px):**

- 4 główne akcje (equal width):
  - Przepisy → `/recipes` (icon: ChefHat)
  - Kalendarz → `/calendar` (icon: Calendar)
  - Lista → `/shopping-lists/generate` (icon: ShoppingCart, **highlighted**)
  - Historia → `/shopping-lists` (icon: List)
- Active state: primary color + bold label + indicator (border-top 3px)

**Design considerations:**

- Tap targets: min 44px height/width
- Icons + labels (accessibility)
- Active state visual (nie tylko color)
- Bottom bar sticky (nie scrolluje z contentem)

---

### 4.4 Breadcrumbs (wszystkie urządzenia)

**Format:** Parent > Current Page

**Przykłady:**

- Dashboard: brak breadcrumbs (root)
- `/recipes`: "Przepisy"
- `/recipes/:id`: "Przepisy > Nazwa przepisu"
- `/recipes/:id/edit`: "Przepisy > Nazwa przepisu > Edycja"
- `/calendar`: "Kalendarz > Tydzień 20-26 stycznia"
- `/shopping-lists`: "Listy zakupów"
- `/shopping-lists/generate`: "Listy zakupów > Generuj"
- `/shopping-lists/:id`: "Listy zakupów > Nazwa listy"

**Implementacja:**

```tsx
<nav aria-label="Breadcrumbs">
  <ol className="flex items-center space-x-2">
    <li>
      <Link href="/recipes">Przepisy</Link>
    </li>
    <li aria-hidden="true">›</li>
    <li aria-current="page">Nazwa przepisu</li>
  </ol>
</nav>
```

**Accessibility:**

- `<nav>` z `aria-label="Breadcrumbs"`
- Current page z `aria-current="page"`
- Separator z `aria-hidden="true"`

---

### 4.5 Deep Linking i URL State

**Query params dla state:**

| Widok          | Query params             | Przykład                              | Cel                               |
| -------------- | ------------------------ | ------------------------------------- | --------------------------------- |
| Calendar       | `week`                   | `/calendar?week=2025-01-20`           | Deep link do konkretnego tygodnia |
| Recipes        | `search`, `sort`, `page` | `/recipes?search=pasta&sort=name_asc` | Bookmarkable search results       |
| Shopping Lists | `page`                   | `/shopping-lists?page=2`              | Pagination state                  |

**Korzyści:**

- **Bookmarkable:** Użytkownik może zapisać link do konkretnego widoku
- **Shareable:** Łatwe dzielenie się linkami (np. "Zobacz mój plan na ten tydzień")
- **Browser navigation:** Back/Forward działa intuicyjnie
- **SEO:** (opcjonalne w MVP, ale architektura ready)

**Implementacja (Astro):**

```astro
---
const url = Astro.url;
const weekParam = url.searchParams.get("week");
const weekStartDate = weekParam || getCurrentWeekStartDate();
---
```

**Implementacja (React z useSearchParams):**

```tsx
import { useSearchParams } from "react-router-dom";

const [searchParams, setSearchParams] = useSearchParams();
const week = searchParams.get("week") || getCurrentWeekStartDate();

const handleWeekChange = (newWeek: string) => {
  setSearchParams({ week: newWeek });
};
```

---

## 5. Kluczowe komponenty

### 5.1 Layout Components

#### 5.1.1 BaseLayout (Astro)

**Ścieżka:** `src/layouts/BaseLayout.astro`

**Cel:** Podstawowy layout dla wszystkich stron (meta tags, scripts, global styles)

**Zawartość:**

```astro
<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title} | ShopMate</title>
    <meta name="description" content={description} />
    <!-- OpenGraph, Favicon, etc. -->
  </head>
  <body>
    <slot />
    <!-- Scripts, Analytics -->
  </body>
</html>
```

---

#### 5.1.2 AppLayout (Astro)

**Ścieżka:** `src/layouts/AppLayout.astro`

**Cel:** Layout dla authenticated pages z navigation

**Zawartość:**

- `<Sidebar>` (desktop)
- `<Header>` z breadcrumbs
- `<main>` content slot
- `<BottomNav>` (mobile)

**Responsywne:**

- Desktop: sidebar + header + main
- Tablet: top bar + main
- Mobile: top header + main + bottom nav

---

#### 5.1.3 Sidebar (React)

**Ścieżka:** `src/components/layout/Sidebar.tsx`

**Props:**

```typescript
interface SidebarProps {
  currentPath: string; // Active link indicator
}
```

**Zawartość:**

- Logo link
- Navigation links (Desktop)
- Active state styling
- Wyloguj button

---

#### 5.1.4 BottomNav (React)

**Ścieżka:** `src/components/layout/BottomNav.tsx`

**Props:**

```typescript
interface BottomNavProps {
  currentPath: string;
}
```

**Zawartość:**

- 4 navigation items (Przepisy, Kalendarz, Lista, Historia)
- Icons + labels
- Active state (primary color + border-top)

---

#### 5.1.5 Header (React)

**Ścieżka:** `src/components/layout/Header.tsx`

**Props:**

```typescript
interface HeaderProps {
  breadcrumbs: Array<{ label: string; href?: string }>;
}
```

**Zawartość:**

- Breadcrumbs navigation
- User menu (avatar dropdown)

---

#### 5.1.6 Breadcrumbs (React)

**Ścieżka:** `src/components/layout/Breadcrumbs.tsx`

**Props:**

```typescript
interface BreadcrumbsProps {
  items: Array<{ label: string; href?: string }>;
}
```

**Renderuje:**

- `<nav aria-label="Breadcrumbs">`
- List z separator (›)
- Last item z `aria-current="page"`

---

### 5.2 Feature Components - Recipes

#### 5.2.1 RecipeForm (React)

**Ścieżka:** `src/components/features/recipes/RecipeForm.tsx`

**Props:**

```typescript
interface RecipeFormProps {
  recipe?: Recipe; // For edit mode, undefined for create
  onSubmit: (recipe: RecipeInput) => Promise<void>;
  onCancel: () => void;
}
```

**Zawartość:**

- `react-hook-form` + Zod validation
- Input: nazwa
- Textarea: instrukcje (auto-resize)
- `useFieldArray` dla składników (dynamic list)
- Validation messages (inline)
- Submit + Cancel buttons

**State:**

- Form state (react-hook-form)
- Loading state (during submit)

**Hooks:**

```typescript
const form = useForm<RecipeInput>({
  resolver: zodResolver(recipeSchema),
  defaultValues: recipe || { name: "", instructions: "", ingredients: [{ name: "" }] },
});

const { fields, append, remove } = useFieldArray({
  control: form.control,
  name: "ingredients",
});
```

---

#### 5.2.2 RecipeCard (React)

**Ścieżka:** `src/components/features/recipes/RecipeCard.tsx`

**Props:**

```typescript
interface RecipeCardProps {
  recipe: Recipe;
  onClick?: () => void;
  onPrefetch?: () => void; // Hover prefetch
}
```

**Zawartość:**

- Nazwa przepisu (truncate 50 znaków)
- Badge: liczba składników
- Meta: data dodania (relative time)
- Hover state

**Events:**

- onClick: Navigate to details
- onMouseEnter: Prefetch recipe details

---

#### 5.2.3 RecipeList (React)

**Ścieżka:** `src/components/features/recipes/RecipeList.tsx`

**Props:**

```typescript
interface RecipeListProps {
  recipes: Recipe[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}
```

**Zawartość:**

- Grid layout (responsive)
- `<RecipeCard>` × n
- `<LoadMoreButton>` (if hasMore)
- `<LoadingState>` (skeleton cards)
- `<EmptyState>` (if 0 recipes)

---

#### 5.2.4 RecipePickerModal (React)

**Ścieżka:** `src/components/features/recipes/RecipePickerModal.tsx`

**Props:**

```typescript
interface RecipePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (recipe: Recipe) => void;
}
```

**Zawartość:**

- Shadcn Dialog (large)
- Search bar (debounce 300ms)
- Recipe list (infinite scroll)
- Loading state

**Lazy loaded:**

```tsx
const RecipePickerModal = React.lazy(() => import('./RecipePickerModal'));

// Usage
<Suspense fallback={<Spinner />}>
  {isOpen && <RecipePickerModal ... />}
</Suspense>
```

---

### 5.3 Feature Components - Calendar

#### 5.3.1 Calendar (React)

**Ścieżka:** `src/components/features/calendar/Calendar.tsx`

**Props:**

```typescript
interface CalendarProps {
  weekStartDate: string; // ISO date (YYYY-MM-DD)
  onWeekChange: (newWeek: string) => void;
}
```

**Zawartość:**

- `<WeekNavigator>`
- `<CalendarGrid>` (desktop/tablet)
- Responsive: accordion na mobile

**State:**

- Selected week (URL state)
- Modal state (open/close RecipePickerModal)
- Selected cell (for assignment)

**Hooks:**

```typescript
const { data: mealPlan } = useQuery({
  queryKey: ["meal-plan", weekStartDate],
  queryFn: () => api.getMealPlan(weekStartDate),
});
```

---

#### 5.3.2 WeekNavigator (React)

**Ścieżka:** `src/components/features/calendar/WeekNavigator.tsx`

**Props:**

```typescript
interface WeekNavigatorProps {
  weekStartDate: string;
  onWeekChange: (newWeek: string) => void;
}
```

**Zawartość:**

- Button: "← Poprzedni tydzień"
- Label: "Tydzień 20-26 stycznia 2025" (center)
- Button: "Bieżący tydzień"
- Button: "Następny tydzień →"

**Logic:**

- Calculate previous/next week (moment.js lub date-fns)
- Update URL query param

---

#### 5.3.3 CalendarGrid (React)

**Ścieżka:** `src/components/features/calendar/CalendarGrid.tsx`

**Props:**

```typescript
interface CalendarGridProps {
  mealPlan: MealPlanAssignment[];
  onAssign: (day: number, mealType: string) => void;
  onRemove: (assignmentId: string) => void;
}
```

**Zawartość:**

- Grid: 7 columns (days) × 4 rows (meals)
- Header row: Day names
- Left column: Meal types
- `<MealCell>` × 28

**Responsive:**

- Desktop: CSS Grid
- Tablet: Horizontal scroll
- Mobile: Przekształcone w accordion (via parent component)

---

#### 5.3.4 MealCell (React)

**Ścieżka:** `src/components/features/calendar/MealCell.tsx`

**Props:**

```typescript
interface MealCellProps {
  date: string; // ISO date
  mealType: "breakfast" | "second_breakfast" | "lunch" | "dinner";
  assignment?: MealPlanAssignment; // undefined if empty
  onAssign: () => void;
  onRemove: (id: string) => void;
}
```

**Zawartość:**

**If empty:**

- `<Button>` "Przypisz przepis" (secondary, full width)
- onClick: open RecipePickerModal

**If assigned:**

- Recipe name (truncate 30 znaków)
- Hover: tooltip z pełną nazwą
- `<Button>` "×" (icon, top-right)
  - onClick: optimistic delete

**Accessibility:**

- `aria-label="Przypisz przepis do {day} {mealType}"`
- Tooltip z `role="tooltip"`

---

### 5.4 Feature Components - Shopping Lists

#### 5.4.1 ShoppingListWizard (React)

**Ścieżka:** `src/components/features/shopping-lists/ShoppingListWizard.tsx`

**Props:**

```typescript
interface ShoppingListWizardProps {
  // No props, uses internal state
}
```

**Zawartość:**

- Multi-step form (4 steps)
- `<ProgressBar>` (current step indicator)
- Step 1: `<ModeSelector>`
- Step 2a: `<CalendarSelector>`
- Step 2b: `<RecipeSelector>`
- Step 3: `<LoadingState>`
- Step 4: `<ShoppingListPreview>`

**State:**

```typescript
const [step, setStep] = useState(1);
const [mode, setMode] = useState<"calendar" | "recipes">("calendar");
const [selections, setSelections] = useState<Selection[]>([]);
const [previewItems, setPreviewItems] = useState<ShoppingListItem[]>([]);
```

**API calls:**

- Step 3: POST `/api/shopping-lists/preview`
- Step 4: POST `/api/shopping-lists` (save)

---

#### 5.4.2 ShoppingListPreview (React)

**Ścieżka:** `src/components/features/shopping-lists/ShoppingListPreview.tsx`

**Props:**

```typescript
interface ShoppingListPreviewProps {
  items: ShoppingListItem[];
  onItemChange: (index: number, updates: Partial<ShoppingListItem>) => void;
  onItemRemove: (index: number) => void;
  onItemAdd: (item: ShoppingListItem) => void;
  onSave: () => void;
  onCancel: () => void;
}
```

**Zawartość:**

- `<CategorySection>` × 7 (collapsible accordion)
- Each section: `<IngredientRow>` × n
- `<Button>` "+ Dodaj składnik"
- `<FormActions>`: Wstecz, Anuluj, Zapisz listę

**State:**

- Local state dla edycji (nie API calls)

---

#### 5.4.3 CategorySection (React)

**Ścieżka:** `src/components/features/shopping-lists/CategorySection.tsx`

**Props:**

```typescript
interface CategorySectionProps {
  category: string; // "Nabiał", "Warzywa", etc.
  items: ShoppingListItem[];
  onItemChange: (index: number, updates: Partial<ShoppingListItem>) => void;
  onItemRemove: (index: number) => void;
}
```

**Zawartość:**

- Shadcn Accordion Item
- Header: Nazwa kategorii + liczba składników
- Content: `<IngredientRow>` × n

**Collapsible:**

- Default: expanded
- User can collapse (accordion behavior)

---

#### 5.4.4 IngredientItem (React)

**Ścieżka:** `src/components/features/shopping-lists/IngredientItem.tsx`

**Props:**

```typescript
interface IngredientItemProps {
  item: ShoppingListItem;
  editable?: boolean; // For preview mode
  onToggle?: (id: string, checked: boolean) => void; // For details mode
  onChange?: (updates: Partial<ShoppingListItem>) => void; // For preview mode
  onRemove?: () => void; // For preview mode
}
```

**Zawartość:**

**Preview mode (editable=true):**

- Inline inputs: ilość, jednostka, nazwa
- Dropdown: kategoria (7 opcji)
- `<Button>` "×" usuń

**Details mode (editable=false):**

- `<Checkbox>` is_checked
- Text: ilość, jednostka, nazwa
- Checked state: line-through, muted

---

#### 5.4.5 ExportButtons (React)

**Ścieżka:** `src/components/features/shopping-lists/ExportButtons.tsx`

**Props:**

```typescript
interface ExportButtonsProps {
  list: ShoppingList;
  items: ShoppingListItem[];
}
```

**Zawartość:**

- `<Button>` "Eksportuj PDF" (primary)
  - onClick: Generate PDF + open preview modal
- `<Button>` "Eksportuj TXT" (secondary)
  - onClick: Generate TXT + direct download

**State:**

- Modal open/close (PDF preview)
- Loading state (podczas generowania)

**Services:**

- `pdfExportService.generatePDF(list, items)`
- `txtExportService.generateTXT(list, items)`

---

### 5.5 UI Primitives (Shadcn/ui)

**Biblioteka:** Shadcn/ui (copy-paste components, built on Radix UI)

**Kluczowe komponenty:**

| Komponent   | Użycie                                                       | Docs                        |
| ----------- | ------------------------------------------------------------ | --------------------------- |
| Button      | Wszystkie przyciski (primary, secondary, ghost, destructive) | shadcn/ui/docs/button       |
| Input       | Text inputs, number inputs                                   | shadcn/ui/docs/input        |
| Textarea    | Długie teksty (instrukcje)                                   | shadcn/ui/docs/textarea     |
| Form        | Formularze z react-hook-form                                 | shadcn/ui/docs/form         |
| Dialog      | Modale (Recipe Picker, PDF Preview)                          | shadcn/ui/docs/dialog       |
| AlertDialog | Confirmation dialogs (Delete)                                | shadcn/ui/docs/alert-dialog |
| Sheet       | Drawer (mobile hamburger menu)                               | shadcn/ui/docs/sheet        |
| Select      | Dropdowns (sort, kategorie)                                  | shadcn/ui/docs/select       |
| Checkbox    | Checkboxes (selekcja, is_checked)                            | shadcn/ui/docs/checkbox     |
| RadioGroup  | Radio buttons (tryb generowania)                             | shadcn/ui/docs/radio-group  |
| Toast       | Notifications (Sonner)                                       | shadcn/ui/docs/sonner       |
| Progress    | Progress bars (wizard loading)                               | shadcn/ui/docs/progress     |
| Accordion   | Collapsible sections (kategorie)                             | shadcn/ui/docs/accordion    |
| Card        | Recipe cards, Shopping list cards                            | shadcn/ui/docs/card         |
| Badge       | Liczba składników, tags                                      | shadcn/ui/docs/badge        |
| Separator   | Dividers w nawigacji                                         | shadcn/ui/docs/separator    |

**Customization:**

- Tailwind config: primary colors, fonts
- Shadcn theme: `src/lib/utils.ts` (cn() helper)

---

### 5.6 Custom Hooks

**Lokalizacja:** `src/lib/hooks/`

#### 5.6.1 useRecipes

**Ścieżka:** `src/lib/hooks/useRecipes.ts`

**Zwraca:** TanStack Query hook dla listy przepisów

```typescript
export function useRecipes(filters: RecipeFilters) {
  return useInfiniteQuery({
    queryKey: ["recipes", filters],
    queryFn: ({ pageParam = 1 }) => api.getRecipes({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.total_pages ? lastPage.pagination.page + 1 : undefined,
    staleTime: 5 * 60 * 1000,
  });
}
```

---

#### 5.6.2 useRecipe

**Ścieżka:** `src/lib/hooks/useRecipe.ts`

**Zwraca:** TanStack Query hook dla pojedynczego przepisu

```typescript
export function useRecipe(recipeId: string) {
  return useQuery({
    queryKey: ["recipe", recipeId],
    queryFn: () => api.getRecipe(recipeId),
    staleTime: 10 * 60 * 1000,
    enabled: !!recipeId,
  });
}
```

---

#### 5.6.3 useMealPlan

**Ścieżka:** `src/lib/hooks/useMealPlan.ts`

**Zwraca:** TanStack Query hook dla kalendarza tygodnia

```typescript
export function useMealPlan(weekStartDate: string) {
  return useQuery({
    queryKey: ["meal-plan", weekStartDate],
    queryFn: () => api.getMealPlan(weekStartDate),
    staleTime: 0, // Zawsze fresh
    refetchOnWindowFocus: true,
  });
}
```

---

#### 5.6.4 useCreateRecipe

**Ścieżka:** `src/lib/hooks/useCreateRecipe.ts`

**Zwraca:** TanStack Query mutation hook

```typescript
export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recipe: RecipeInput) => api.createRecipe(recipe),
    onSuccess: (newRecipe) => {
      queryClient.invalidateQueries(["recipes"]);
      toast.success("Przepis dodany pomyślnie");
    },
    onError: (error) => {
      toast.error("Nie udało się dodać przepisu");
    },
  });
}
```

---

#### 5.6.5 useAuth

**Ścieżka:** `src/lib/hooks/useAuth.ts`

**Zwraca:** Supabase auth state + helpers

```typescript
export function useAuth() {
  const supabase = useSupabaseClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return { user, loading, logout };
}
```

---

## 6. Względy UX, Accessibility i Bezpieczeństwa

### 6.1 User Experience (UX)

#### 6.1.1 Loading States

**Strategia:**

| Scenario                  | Loading Indicator         | Uzasadnienie                             |
| ------------------------- | ------------------------- | ---------------------------------------- |
| Initial page load         | Skeleton screens          | Lepsze perceived performance niż spinner |
| List loading (przepisy)   | Skeleton cards            | Zachowuje layout, mniej "jump"           |
| API call (submit form)    | Disabled button + spinner | Prevent double-submit                    |
| Multi-step operation (AI) | Progress bar + labels     | User wie co się dzieje                   |
| Image loading             | Blur placeholder          | Progressive enhancement                  |

**Implementacja:**

**Skeleton Screen:**

```tsx
export function RecipeCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <div className="h-40 bg-gray-200 rounded" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    </Card>
  );
}
```

**Button Loading:**

```tsx
<Button disabled={isLoading}>
  {isLoading && <Spinner className="mr-2" />}
  {isLoading ? "Zapisywanie..." : "Zapisz przepis"}
</Button>
```

---

#### 6.1.2 Empty States

**Cel:** Pomóc użytkownikowi zrozumieć co dalej robić, gdy brak danych.

**Komponenty:**

**Recipe List Empty:**

```tsx
<EmptyState
  icon={<ChefHat />}
  title="Brak przepisów"
  description="Dodaj pierwszy przepis, aby móc go przypisać do kalendarza."
  action={<Button onClick={() => navigate("/recipes/new")}>Dodaj przepis</Button>}
/>
```

**Search No Results:**

```tsx
<EmptyState
  icon={<Search />}
  title="Nie znaleziono przepisów"
  description="Nie znaleziono przepisów dla '{query}'. Spróbuj innej frazy."
  action={
    <Button variant="ghost" onClick={clearSearch}>
      Wyczyść wyszukiwanie
    </Button>
  }
/>
```

---

#### 6.1.3 Optimistic UI

**Gdzie stosować:**

✅ **TAK:**

- Toggle checkbox na liście zakupów (szybkie, odwracalne)
- Usuwanie przypisania z kalendarza (szybkie, odwracalne)
- Przypisywanie przepisu do kalendarza (częste, expected success)

❌ **NIE:**

- Dodawanie/edycja przepisu (wymaga server ID, walidacja)
- Usuwanie przepisu (cascade delete, ryzykowne)
- Generowanie listy zakupów (AI operation, zbyt złożone)

**Pattern (TanStack Query):**

```typescript
const mutation = useMutation({
  mutationFn: deleteAssignment,
  onMutate: async (assignmentId) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(["meal-plan"]);

    // Snapshot previous value
    const previous = queryClient.getQueryData(["meal-plan"]);

    // Optimistically update
    queryClient.setQueryData(["meal-plan"], (old) => old.filter((a) => a.id !== assignmentId));

    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(["meal-plan"], context.previous);
    toast.error("Nie udało się usunąć przypisania");
  },
  onSettled: () => {
    // Always refetch after error or success
    queryClient.invalidateQueries(["meal-plan"]);
  },
});
```

---

#### 6.1.4 Form Validation UX

**Real-time validation:**

- Debounce 300ms (nie na każdy keystroke)
- Inline messages pod polami (nie modal alert)
- Success indicator (green checkmark) gdy pole valid

**Pattern:**

```tsx
<FormField
  control={form.control}
  name="name"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Nazwa przepisu</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage /> {/* Auto error message */}
      {field.value && !form.formState.errors.name && (
        <FormDescription className="text-green-600">✓ Nazwa wygląda dobrze</FormDescription>
      )}
    </FormItem>
  )}
/>
```

---

#### 6.1.5 Contextual Help

**Tooltips:**

- Hover na recipe name (truncated) → Full name tooltip
- Hover na disabled button → Reason tooltip
- Hover na icon → Label tooltip

**Info alerts:**

- Recipe edit: "Zmiany zaktualizują wszystkie przypisania w kalendarzu"
- Delete recipe: "Ten przepis jest przypisany do 3 posiłków"
- AI fail: "Automatyczna kategoryzacja niedostępna. Możesz ręcznie przypisać kategorie."

**Onboarding hints:**

- Dashboard first visit: "Zacznij od dodania pierwszego przepisu"
- Empty calendar cell: "Kliknij aby przypisać przepis"
- Empty shopping list history: "Wygeneruj pierwszą listę zakupów"

---

### 6.2 Accessibility (WCAG AA)

#### 6.2.1 Keyboard Navigation

**Wymagania:**

- Tab order logiczny (top → bottom, left → right)
- Enter/Space aktywuje buttons
- Escape zamyka modale
- Arrow keys w listach (opcjonalne enhancement)

**Focus visible:**

```css
/* Tailwind focus ring */
.focus-visible:focus {
  @apply ring-2 ring-offset-2 ring-primary-600 outline-none;
}
```

**Focus trap w modalach:**

```tsx
// Shadcn Dialog automatic focus trap
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    {" "}
    {/* Focus trap active */}
    {/* Modal content */}
  </DialogContent>
</Dialog>
```

**Skip to main content:**

```tsx
<a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50 p-4 bg-white">
  Przeskocz do głównej treści
</a>
<main id="main">
  {/* Page content */}
</main>
```

---

#### 6.2.2 ARIA Attributes

**Landmarks:**

```tsx
<nav aria-label="Nawigacja główna">...</nav>
<main id="main">...</main>
<aside aria-label="Filtry">...</aside>
<footer role="contentinfo">...</footer>
```

**Live regions:**

```tsx
<div aria-live="polite" aria-atomic="true">
  Załadowano 40 z 120 przepisów
</div>
```

**Form fields:**

```tsx
<Input id="recipe-name" aria-label="Nazwa przepisu" aria-describedby="name-error" aria-invalid={!!errors.name} />;
{
  errors.name && (
    <span id="name-error" className="text-red-600">
      {errors.name.message}
    </span>
  );
}
```

**Buttons:**

```tsx
<Button
  aria-label="Przypisz przepis do Poniedziałek Śniadanie"
  aria-expanded={isModalOpen}
  aria-controls="recipe-picker-modal"
>
  Przypisz
</Button>
```

**Dialogs:**

```tsx
<Dialog role="dialog" aria-labelledby="dialog-title" aria-describedby="dialog-description">
  <DialogTitle id="dialog-title">Wybierz przepis</DialogTitle>
  <DialogDescription id="dialog-description">Wyszukaj i wybierz przepis do przypisania</DialogDescription>
</Dialog>
```

---

#### 6.2.3 Screen Reader Support

**Icon buttons:**

```tsx
<Button aria-label="Usuń przepis">
  <TrashIcon aria-hidden="true" />
</Button>
```

**Decorative images:**

```tsx
<img src="logo.png" alt="" aria-hidden="true" />
```

**Informative images:**

```tsx
<img src="empty-state.png" alt="Brak przepisów - dodaj pierwszy przepis" />
```

**Loading states:**

```tsx
<Button disabled aria-busy="true">
  <Spinner aria-hidden="true" />
  <span>Zapisywanie...</span>
</Button>
```

---

#### 6.2.4 Color Contrast

**Wymagania WCAG AA:**

- Normal text (≤18px): minimum 4.5:1 contrast ratio
- Large text (≥18px bold or ≥24px): minimum 3:1

**Tailwind colors (compliant):**

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff", // Light backgrounds
          600: "#0284c7", // Buttons, links (on white: 4.6:1 ✓)
          700: "#0369a1", // Active states (on white: 6.2:1 ✓)
        },
        gray: {
          700: "#374151", // Body text (on white: 10.7:1 ✓)
          900: "#111827", // Headings (on white: 16.1:1 ✓)
        },
      },
    },
  },
};
```

**Never rely on color alone:**

```tsx
// ❌ BAD: only color difference
<span className="text-red-600">Error</span>
<span className="text-green-600">Success</span>

// ✓ GOOD: icon + color + label
<span className="text-red-600">
  <XCircle className="inline mr-1" aria-hidden="true" />
  Error: Nie udało się zapisać
</span>
<span className="text-green-600">
  <CheckCircle className="inline mr-1" aria-hidden="true" />
  Sukces: Przepis zapisany
</span>
```

---

#### 6.2.5 Touch Targets (Mobile)

**Wymagania:**

- Minimum 44px × 44px tap target
- Spacing między targets: min 8px

**Implementacja:**

```tsx
// Bottom navigation
<nav className="flex justify-around h-16"> {/* 64px height */}
  <Button className="min-h-[44px] min-w-[44px] flex-col">
    <ChefHat className="h-6 w-6" />
    <span className="text-xs mt-1">Przepisy</span>
  </Button>
</nav>

// Meal cell button (calendar)
<Button className="w-full min-h-[44px]">
  Przypisz przepis
</Button>

// Icon buttons
<Button size="icon" className="h-11 w-11"> {/* 44px */}
  <Trash className="h-5 w-5" />
</Button>
```

---

### 6.3 Bezpieczeństwo

#### 6.3.1 Authentication & Authorization

**Supabase Auth (JWT-based):**

```typescript
// Middleware (Astro)
export const onRequest = defineMiddleware(async (context, next) => {
  const {
    data: { user },
    error,
  } = await context.locals.supabase.auth.getUser();

  const publicRoutes = ["/", "/login", "/register", "/reset-password"];
  const isPublicRoute = publicRoutes.includes(context.url.pathname);

  if (!user && !isPublicRoute) {
    return context.redirect(`/login?redirect=${context.url.pathname}`);
  }

  if (user && isPublicRoute && context.url.pathname !== "/") {
    return context.redirect("/dashboard");
  }

  return next();
});
```

**Row Level Security (RLS):**

```sql
-- Przykład: recipes table
CREATE POLICY "Users can only access their own recipes"
ON recipes
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

#### 6.3.2 Input Validation

**Zod schemas (client + server):**

```typescript
// src/lib/validation/recipe.schema.ts
export const recipeSchema = z.object({
  name: z.string().min(3, "Nazwa musi mieć min. 3 znaki").max(100, "Nazwa może mieć max. 100 znaków").trim(),
  instructions: z
    .string()
    .min(10, "Instrukcje muszą mieć min. 10 znaków")
    .max(5000, "Instrukcje mogą mieć max. 5000 znaków")
    .trim(),
  ingredients: z
    .array(ingredientSchema)
    .min(1, "Przepis musi mieć min. 1 składnik")
    .max(50, "Przepis może mieć max. 50 składników"),
});
```

**Client validation (React Hook Form):**

```typescript
const form = useForm<RecipeInput>({
  resolver: zodResolver(recipeSchema),
});
```

**Server validation (API endpoint):**

```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  const body = await request.json();
  const validation = recipeSchema.safeParse(body);

  if (!validation.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      }),
      { status: 400 }
    );
  }

  // Proceed with validated data
  const recipe = validation.data;
  // ...
};
```

---

#### 6.3.3 XSS Prevention

**React auto-escapes:**

```tsx
// ✓ SAFE: React escapes automatically
<h1>{recipe.name}</h1>
<p>{recipe.instructions}</p>

// ❌ DANGEROUS: Never use dangerouslySetInnerHTML bez sanitization
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

**Instrukcje z newlines (safe):**

```tsx
// ✓ SAFE: Preserve newlines bez HTML injection
<p className="whitespace-pre-wrap">{recipe.instructions}</p>
```

---

#### 6.3.4 CSRF Protection

**Supabase automatic CSRF protection:**

- httpOnly cookies (immune to XSS)
- SameSite cookie attribute
- CSRF token validation (automatic)

**Additional protection (optional):**

```typescript
// Astro middleware
export const onRequest = defineMiddleware(async (context, next) => {
  if (context.request.method !== "GET" && context.request.method !== "HEAD") {
    const csrfToken = context.cookies.get("csrf-token")?.value;
    const headerToken = context.request.headers.get("x-csrf-token");

    if (!csrfToken || csrfToken !== headerToken) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  return next();
});
```

---

#### 6.3.5 Rate Limiting

**Supabase default:**

- 100 requests/minute per user
- Applied automatically

**Custom rate limiting (Vercel Edge):**

```typescript
// Optional: stricter limits for expensive operations
const RATE_LIMITS = {
  "/api/shopping-lists/preview": { max: 10, window: 60000 }, // 10 req/min (AI cost)
  "/api/recipes": { max: 50, window: 60000 }, // 50 req/min
};
```

---

#### 6.3.6 Secrets Management

**Environment variables:**

```bash
# .env.local (NEVER commit)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx  # Service role key (server-only!)
OPENAI_API_KEY=xxx  # Server-only
```

**Validation:**

```typescript
// src/env.ts
if (!import.meta.env.SUPABASE_URL || !import.meta.env.SUPABASE_KEY) {
  throw new Error("Missing required environment variables");
}

export const env = {
  SUPABASE_URL: import.meta.env.SUPABASE_URL,
  SUPABASE_KEY: import.meta.env.SUPABASE_KEY,
  OPENAI_API_KEY: import.meta.env.OPENAI_API_KEY,
};
```

**Client vs Server:**

```typescript
// ❌ NEVER expose service role key to client
// Client should use anon key with RLS

// ✓ Client (Astro component)
const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

// ✓ Server (API endpoint)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
```

---

## 7. Następne kroki implementacji

### 7.1 Sprint Planning

**Sprint 1 (2 tygodnie):**

**Week 1:**

- [ ] Setup projektu (Astro + React + TanStack Query + Shadcn)
- [ ] Konfiguracja Supabase (client, middleware)
- [ ] Authentication flow (login, register, reset password)
- [ ] Layout components (Sidebar, BottomNav, Header, Breadcrumbs)
- [ ] Design system (Tailwind config, Shadcn theme)

**Week 2:**

- [ ] Recipes CRUD - List view + search + sort
- [ ] Recipes CRUD - Create form z Zod validation
- [ ] Recipes CRUD - Details view
- [ ] Recipes CRUD - Edit + Delete z confirmation
- [ ] Infinite scroll z TanStack Query

---

**Sprint 2 (2 tygodnie):**

**Week 1:**

- [ ] Calendar - Week Navigator
- [ ] Calendar - Grid layout (desktop/tablet)
- [ ] Calendar - Accordion layout (mobile)
- [ ] Calendar - Meal Cell component (empty + assigned states)
- [ ] Calendar - Recipe Picker Modal (lazy loaded)

**Week 2:**

- [ ] Calendar - Assign/Remove recipe (optimistic UI)
- [ ] Shopping List Wizard - Step 1 (mode selector)
- [ ] Shopping List Wizard - Step 2a (calendar selector)
- [ ] Shopping List Wizard - Step 2b (recipe selector)
- [ ] Shopping List Wizard - Step 3 (loading + AI categorization)

---

**Sprint 3 (2 tygodnie):**

**Week 1:**

- [ ] Shopping List Wizard - Step 4 (preview + edycja)
- [ ] Shopping List Wizard - Save dialog
- [ ] Shopping Lists History view
- [ ] Shopping List Details view
- [ ] Shopping List - Toggle checkbox (optimistic UI)

**Week 2:**

- [ ] Export - PDF generation (@react-pdf/renderer)
- [ ] Export - TXT generation
- [ ] Export - PDF Preview Modal
- [ ] Error boundaries + error handling (wszystkie widoki)
- [ ] Toast notifications system

---

**Sprint 4 (1 tydzień):**

**Testing & Polish:**

- [ ] Accessibility audit (Lighthouse, screen reader testing)
- [ ] Performance optimization (bundle size, lazy loading)
- [ ] Responsive testing (BrowserStack: 320px - 1920px)
- [ ] Cross-browser testing (Chrome, Safari, Firefox, Edge)
- [ ] Bug fixes z QA
- [ ] UAT (User Acceptance Testing) z 5-10 użytkownikami

---

### 7.2 Quality Gates

**Pre-Sprint 1:**

- [ ] Design system approved (kolory, typografia, spacing)
- [ ] API endpoints gotowe (lub mock data)
- [ ] Supabase project setup (database, RLS policies)

**Każdy Sprint:**

- [ ] Code review (wszystkie PR)
- [ ] ESLint + Prettier (pre-commit hooks)
- [ ] Manual testing (checklist per feature)
- [ ] Accessibility check (basic keyboard navigation)

**Pre-Production:**

- [ ] Lighthouse Performance: ≥90/100
- [ ] Lighthouse Accessibility: ≥90/100
- [ ] Lighthouse Best Practices: ≥90/100
- [ ] Lighthouse SEO: ≥80/100
- [ ] Bundle size: <100KB (main bundle)
- [ ] LCP: <2.5s (percentyl 95)
- [ ] UAT success rate: ≥80% użytkowników pozytywnie ocenia

---

### 7.3 Documentation Deliverables

**Dla zespołu:**

- [ ] Component library (Storybook optional)
- [ ] API integration guide (TanStack Query patterns)
- [ ] State management diagram (query keys, invalidation)
- [ ] Error handling guide (wszystkie error scenarios)

**Dla użytkowników:**

- [ ] Help center (FAQ, tutorials) - post-MVP
- [ ] Onboarding tooltips (in-app)

---

## 8. Appendix

### 8.1 Design Tokens (Tailwind Config)

**Colors:**

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          600: "#0284c7",
          700: "#0369a1",
        },
        gray: {
          50: "#f9fafb",
          700: "#374151",
          900: "#111827",
        },
        success: "#10b981",
        error: "#ef4444",
        warning: "#f59e0b",
      },
    },
  },
};
```

**Typography:**

```javascript
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
},
fontSize: {
  xs: ['0.75rem', { lineHeight: '1rem' }],
  sm: ['0.875rem', { lineHeight: '1.25rem' }],
  base: ['1rem', { lineHeight: '1.5rem' }],
  lg: ['1.125rem', { lineHeight: '1.75rem' }],
  xl: ['1.25rem', { lineHeight: '1.75rem' }],
  '2xl': ['1.5rem', { lineHeight: '2rem' }],
},
```

**Spacing:**

```javascript
spacing: {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  6: '24px',
  8: '32px',
  12: '48px',
  16: '64px',
},
```

---

### 8.2 Query Keys Convention

**Hierarchiczne klucze:**

```typescript
export const queryKeys = {
  recipes: {
    all: ["recipes"] as const,
    lists: () => [...queryKeys.recipes.all, "list"] as const,
    list: (filters: RecipeFilters) => [...queryKeys.recipes.lists(), filters] as const,
    details: () => [...queryKeys.recipes.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.recipes.details(), id] as const,
  },
  mealPlan: {
    all: ["meal-plan"] as const,
    week: (weekStartDate: string) => [...queryKeys.mealPlan.all, weekStartDate] as const,
  },
  shoppingLists: {
    all: ["shopping-lists"] as const,
    lists: () => [...queryKeys.shoppingLists.all, "list"] as const,
    list: (page: number) => [...queryKeys.shoppingLists.lists(), page] as const,
    details: () => [...queryKeys.shoppingLists.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.shoppingLists.details(), id] as const,
  },
};
```

---

### 8.3 Error Messages Dictionary

**Centralizacja komunikatów:**

```typescript
// src/lib/errors.ts
export const ERROR_MESSAGES = {
  // HTTP errors
  401: "Sesja wygasła. Zaloguj się ponownie.",
  403: "Brak uprawnień do wykonania tej akcji.",
  404: "Nie znaleziono zasobu.",
  429: "Zbyt wiele requestów. Spróbuj za chwilę.",
  500: "Wystąpił błąd serwera. Nasz zespół został powiadomiony.",

  // Network errors
  NETWORK: "Brak połączenia. Sprawdź internet i spróbuj ponownie.",
  TIMEOUT: "Operacja przekroczyła limit czasu. Spróbuj ponownie.",

  // Business logic errors
  AI_TIMEOUT: "Automatyczna kategoryzacja niedostępna. Możesz ręcznie przypisać kategorie.",
  RECIPE_NOT_FOUND: "Nie znaleziono przepisu. Mógł zostać usunięty.",
  MEAL_SLOT_OCCUPIED: "Ten posiłek ma już przypisany przepis. Usuń istniejący aby przypisać nowy.",

  // Validation errors (Zod)
  VALIDATION_FAILED: "Sprawdź poprawność danych w formularzu.",
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return ERROR_MESSAGES[error.response?.status] || ERROR_MESSAGES[500];
  }

  if (error instanceof Error) {
    return error.message;
  }

  return ERROR_MESSAGES[500];
}
```

---

### 8.4 Analytics Events

**Tracking kluczowych akcji:**

```typescript
// src/lib/analytics.ts
export const trackEvent = (event: string, properties?: Record<string, any>) => {
  // Plausible / GA4
  if (window.plausible) {
    window.plausible(event, { props: properties });
  }

  // Sentry breadcrumb
  Sentry.addBreadcrumb({
    category: "user-action",
    message: event,
    data: properties,
  });
};

// Events do trackowania
export const ANALYTICS_EVENTS = {
  // Auth
  USER_REGISTERED: "user_registered",
  USER_LOGGED_IN: "user_logged_in",
  USER_LOGGED_OUT: "user_logged_out",

  // Recipes
  RECIPE_CREATED: "recipe_created",
  RECIPE_UPDATED: "recipe_updated",
  RECIPE_DELETED: "recipe_deleted",
  RECIPE_VIEWED: "recipe_viewed",

  // Meal Plan
  RECIPE_ASSIGNED: "recipe_assigned_to_calendar",
  ASSIGNMENT_REMOVED: "assignment_removed_from_calendar",
  WEEK_NAVIGATED: "week_navigated",

  // Shopping Lists
  SHOPPING_LIST_GENERATED: "shopping_list_generated",
  SHOPPING_LIST_SAVED: "shopping_list_saved",
  SHOPPING_LIST_EXPORTED_PDF: "shopping_list_exported_pdf",
  SHOPPING_LIST_EXPORTED_TXT: "shopping_list_exported_txt",

  // AI
  AI_CATEGORIZATION_SUCCESS: "ai_categorization_success",
  AI_CATEGORIZATION_FAILED: "ai_categorization_failed",
};
```

---

## 9. Zakończenie

Niniejszy dokument przedstawia kompleksową architekturę interfejsu użytkownika dla ShopMate MVP. Architektura została zaprojektowana z myślą o:

1. **Osiągnięciu celu biznesowego:** Użytkownik może zaplanować tydzień i wygenerować listę w <10 minut
2. **Performance:** Bundle <100KB, LCP <2.5s dzięki Astro islands
3. **Accessibility:** WCAG AA compliance dla wszystkich użytkowników
4. **Responsywności:** Mobile-first approach z dedykowanymi wzorcami dla 3 breakpoints
5. **Skalowalności:** Solidne fundamenty dla przyszłych feature'ów (v1.1, v2.0)

**Kluczowe decyzje architektoniczne:**

- Static-first rendering z selektywną hydratacją (Astro + React islands)
- TanStack Query jako single source of truth dla server state
- Kompozycyjna architektura komponentów (hierarchia, reusability)
- Selektywny optimistic UI dla instant feedback
- Wielowarstwowy error handling (Error Boundary + API + Form)
- Hybrydowa nawigacja mobile (Bottom bar + Hamburger)

**Następne kroki:**

1. Review z zespołem (Design, Backend, Product)
2. Approval design system (kolory, typografia)
3. Sprint planning (4 sprinty × 2 tygodnie)
4. Implementacja według priorytetów
5. UAT z użytkownikami (sukces: ≥80% positive feedback)

---

**Dokument przygotowany:** 2025-11-06
**Autor:** Claude Code (AI UI Architect)
**Wersja:** 1.0
**Status:** ✅ Gotowa do implementacji
