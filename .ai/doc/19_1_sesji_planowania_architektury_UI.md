# Pytania i Rekomendacje - Architektura UI ShopMate MVP

**Data:** 2025-11-06
**Wersja:** 1.0
**Status:** Do konsultacji z zespołem

---

## Pytania i Rekomendacje dotyczące Architektury UI

<pytania>

### 1. Jak zorganizować hierarchię widoków i routing w kontekście Astro + React, aby optymalnie wykorzystać architekturę "islands" i minimalizować JavaScript bundle?

**Rekomendacja:**
Należy przyjąć strategię "static first" z selektywną hydratacją:

- **Strony główne (.astro):** `/`, `/login`, `/register`, `/dashboard` jako statyczne layouty Astro
- **Interaktywne sekcje (.tsx):** `RecipeForm.tsx`, `Calendar.tsx`, `ShoppingListGenerator.tsx` jako React islands z `client:load` lub `client:visible`
- **Routing:** Wykorzystać wbudowany file-based routing Astro:
  - `src/pages/recipes/index.astro` → `/recipes`
  - `src/pages/recipes/[id].astro` → `/recipes/:id`
  - `src/pages/calendar.astro` → `/calendar?week=2025-01-20` (deep linking)
  - `src/pages/shopping-lists/generate.astro` → `/shopping-lists/generate`
- **Komponenty współdzielone:** Utworzyć `src/components/ui/` (Shadcn), `src/components/features/` (business logic), `src/layouts/` (page templates)
- **Lazy loading:** Dla ciężkich komponentów (kalendarz 7×4, modal z przepisami) użyć `React.lazy()` + `Suspense` z skeleton fallback

**Wpływ na performance:** Podejście to powinno utrzymać bundle <100KB i LCP <2.5s (cel z PRD).

---

### 2. Czy kalendarz tygodniowy powinien być jednym dużym komponentem czy kompozycją mniejszych komponentów? Jak zorganizować state management dla 28 komórek (7 dni × 4 posiłki)?

**Rekomendacja:**
Zastosować **kompozycyjną architekturę** z hierarchią komponentów:

```
<Calendar.tsx> (client:load)
  └─ <WeekNavigator.tsx> (state: week_start_date)
  └─ <CalendarGrid.tsx> (responsywny layout)
      └─ <DayColumn.tsx> × 7 (desktop/tablet)
          └─ <MealCell.tsx> × 4 (komórka z przepisem lub przycisk "Przypisz")
              └─ <RecipeAssignment.tsx> (nazwa + przycisk ×)
              └─ <AssignRecipeButton.tsx> → otwiera modal
  └─ <RecipePickerModal.tsx> (lazy loaded, search + infinite scroll)
```

**State management:**

- **TanStack Query:** dla fetch/cache danych z `/api/meal-plan?week_start_date=...`
- **URL state:** `week_start_date` w query params dla deep linking
- **Local state:** React `useState` dla stanu modalu (open/close)
- **Optimistic updates:** `useMutation` z `onMutate` callback dla natychmiastowego UI update przy przypisywaniu/usuwaniu przepisu

**Responsywność:**

- Desktop (≥1024px): Grid 7 kolumn × 4 wiersze
- Tablet (768-1023px): Horizontal scroll container z fixed width kolumn
- Mobile (<768px): Accordion - każdy dzień jako `<details>` element z 4 posiłkami wewnątrz

**Accessibility:** Każda komórka jako `<button>` lub `<div role="button">` z `aria-label="Przypisz przepis do Poniedziałek Śniadanie"`.

---

### 3. Jak zaprojektować przepływ generowania listy zakupów (tryb "Z kalendarza" vs "Z przepisów"), aby był intuicyjny i wspierał cel <10 minut od rejestracji do pierwszej listy?

**Rekomendacja:**
Zastosować **wieloetapowy wizard** z wizualnym progress barem:

**Etap 1: Wybór trybu**

- Radio buttons: "Z kalendarza" (domyślny) | "Z przepisów"
- Wyjaśnienie pod każdym: "Wybierz posiłki z kalendarza" vs "Wybierz dowolne przepisy"
- CTA: "Dalej" (disabled jeśli nic nie wybrane)

**Etap 2a: Selekcja (Kalendarz)**

- Mini-widok kalendarza z checkboxami przy każdym dniu/posiłku
- Shortcut: "Zaznacz cały tydzień" (akcja masowa)
- Licznik: "Zaznaczono 12 posiłków" (live update)
- Walidacja: Jeśli puste komórki → ostrzeżenie "3 posiłki nie mają przypisanych przepisów" (ale pozwól kontynuować)

**Etap 2b: Selekcja (Przepisy)**

- Lista przepisów z checkboxami
- Search bar z debounce (300ms)
- Licznik: "Zaznaczono 5 przepisów"

**Etap 3: Loading state**

- Progress bar: "Pobieram składniki... 40%" → "Agregacja... 70%" → "Kategoryzacja AI... 90%"
- Animacja ładowania (spinner + komunikat)
- Fallback przy AI timeout: Toast "Automatyczna kategoryzacja niedostępna" + kontynuuj z kategoriami "Inne"

**Etap 4: Preview i edycja**

- Lista składników pogrupowana po kategoriach (7 sekcji zwijanych)
- Inline edycja: zmiana kategorii (dropdown), ilości (input), usuwanie (× button)
- CTA: "Zapisz listę" (sticky button) + modal z nazwą listy

**Nawigacja:** Breadcrumbs "Listy zakupów > Generuj > Wybierz źródło" dla orientacji użytkownika.

---

### 4. Jaką strategię zastosować dla infinite scroll vs paginacji w liście przepisów, aby zapewnić WCAG AA compliance i dobrą performance przy >100 przepisach?

**Rekomendacja:**
Zastosować **hybrydowy model: Infinite scroll z "Load more" button fallback:**

**Dlaczego nie pure infinite scroll:**

- ❌ Problemy a11y: Screen readery gubią się przy dynamicznym dodawaniu contentu
- ❌ Brak dostępu do footer (footer "ucieka" podczas scrollowania)
- ❌ Trudność z powrotem do konkretnego przepisu (brak permalinków)

**Zalecane podejście:**

- **Initial load:** 20 przepisów (GET `/api/recipes?page=1&limit=20`)
- **Scroll detection:** Gdy użytkownik scrolluje do 80% listy → wyświetl "Load more" button
- **Button click:** Fetch kolejne 20 + append do listy
- **Keyboard users:** Button jest focusable i accessible z klawiatury
- **ARIA live region:** `<div aria-live="polite" aria-atomic="true">` z komunikatem "Załadowano 40 z 120 przepisów"

**Alternatywa (jeśli <50 przepisów):**

- Klasyczna paginacja z previous/next buttons
- Pros: Lepsze SEO, permalinki do stron, łatwiejsze cache'owanie
- Cons: Więcej kliknięć (może przekroczyć cel 3 kliknięć do akcji)

**TanStack Query implementation:**

```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ["recipes", search, sort],
  queryFn: ({ pageParam = 1 }) => fetchRecipes({ page: pageParam, search, sort }),
  getNextPageParam: (lastPage) =>
    lastPage.pagination.page < lastPage.pagination.total_pages ? lastPage.pagination.page + 1 : undefined,
});
```

---

### 5. Jak zaprojektować system toast notifications, aby spełniał WCAG AA i nie przeszkadzał w wykonywaniu zadań (szczególnie podczas multi-step operations jak generowanie listy)?

**Rekomendacja:**
Zastosować **pozycjonowanie kontekstowe z ARIA live regions:**

**Pozycjonowanie:**

- **Desktop:** Top-right corner (nie blokuje contentu)
- **Mobile:** Bottom center (nad bottom navigation bar)
- **Z-index:** 9999 (zawsze na wierzchu)

**Typy i kolory (Tailwind):**

- Success: `bg-green-500` + ✓ icon + auto-dismiss 3s
- Error: `bg-red-500` + ✗ icon + manual dismiss (nie auto-dismiss dla błędów!)
- Info: `bg-blue-500` + ℹ icon + auto-dismiss 3s
- Warning: `bg-yellow-500` + ⚠ icon + auto-dismiss 5s

**Accessibility:**

```tsx
<div role="status" aria-live="polite" aria-atomic="true" className="toast">
  <span className="sr-only">Sukces:</span>
  Przepis dodany pomyślnie
</div>
```

**Stacking:** Maksymalnie 3 toasty naraz (FIFO queue), starsze znikają

**Animacje:** Slide-in from right (desktop) / bottom (mobile) z fade-out

**Retry button dla błędów API:**

- Toast "Błąd połączenia" + button "Spróbuj ponownie"
- Eksponential backoff: 1s → 2s → 4s (max 3 próby)

**Biblioteka:** Shadcn `Sonner` (built na Radix Toast) lub `react-hot-toast` (lekkość)

---

### 6. Czy stosować optimistic UI updates we wszystkich mutacjach (dodawanie przepisu, przypisywanie do kalendarza, usuwanie) czy tylko w wybranych przypadkach?

**Rekomendacja:**
Zastosować **selektywny optimistic UI** z jasną strategią rollback:

**GDZIE stosować optimistic updates:**

✅ **Szybkie, low-risk akcje:**

- Usuwanie przypisania z kalendarza (DELETE `/api/meal-plan/:id`)
  - Natychmiastowo usuń z UI → komórka wraca do pustej
  - Rollback: Toast error + przywróć stan jeśli API fail
- Checkbox "is_checked" na liście zakupów (PATCH `/api/shopping-lists/:list_id/items/:item_id`)
  - Toggle checkbox natychmiast
  - Rollback: Odwróć checkbox + toast error

✅ **Częste akcje użytkownika:**

- Przypisywanie przepisu do kalendarza (POST `/api/meal-plan`)
  - Pokaż przepis w komórce natychmiast
  - Rollback: Usuń z komórki + toast error "Nie udało się przypisać przepisu"

❌ **GDZIE NIE stosować optimistic updates:**

- Dodawanie przepisu (POST `/api/recipes`)
  - Wymaga server ID + walidacja
  - Lepiej: Disabled button + spinner + redirect po sukcesie
- Usuwanie przepisu (DELETE `/api/recipes/:id`)
  - CASCADE delete = ryzykowne, user powinien zobaczyć konfirmację
  - Lepiej: Dialog → loading → redirect do listy
- Generowanie listy zakupów (POST `/api/shopping-lists/preview`)
  - Multi-step z AI = zbyt złożone
  - Lepiej: Loading state z progress bar

**TanStack Query pattern:**

```typescript
const mutation = useMutation({
  mutationFn: deleteAssignment,
  onMutate: async (assignmentId) => {
    await queryClient.cancelQueries(["meal-plan"]);
    const previous = queryClient.getQueryData(["meal-plan"]);
    queryClient.setQueryData(["meal-plan"], (old) => old.filter((a) => a.id !== assignmentId));
    return { previous };
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(["meal-plan"], context.previous);
    toast.error("Nie udało się usunąć przypisania");
  },
  onSettled: () => {
    queryClient.invalidateQueries(["meal-plan"]);
  },
});
```

---

### 7. Jak zorganizować modal dialogs (przypisywanie przepisu, usuwanie, eksport PDF preview), aby były dostępne i nie blokowały użytkownika w długotrwałych operacjach?

**Rekomendacja:**
Zastosować **3 typy modali z różnymi strategiami:**

**Typ 1: Modal do selekcji (Recipe Picker)**

- **Use case:** Przypisywanie przepisu do kalendarza
- **Rozmiar:** Large (80% viewport width, max 900px)
- **Zawartość:** Search bar + lista przepisów (infinite scroll)
- **Zachowanie:**
  - Kliknięcie backdrop → zamknij (ale pokaż toast "Anulowano")
  - Escape key → zamknij
  - Focus trap: Tab cyklicznie w obrębie modalu
  - `client:idle` loading (lazy load gdy user przewinie do komórki)

**Typ 2: Confirmation Dialog (Destructive actions)**

- **Use case:** Usuwanie przepisu, usuwanie listy zakupów
- **Rozmiar:** Small (max 400px width)
- **Zawartość:** Komunikat + 2 przyciski ("Anuluj" [default focus] + "Usuń" [destructive])
- **Accessibility:**
  ```tsx
  <AlertDialog>
    <AlertDialogTitle>Usuń przepis?</AlertDialogTitle>
    <AlertDialogDescription>
      Ten przepis jest przypisany do 3 posiłków. Usunięcie spowoduje usunięcie przypisań.
    </AlertDialogDescription>
    <AlertDialogAction variant="destructive">Usuń przepis i przypisania</AlertDialogAction>
    <AlertDialogCancel>Anuluj</AlertDialogCancel>
  </AlertDialog>
  ```

**Typ 3: Preview Modal (PDF preview)**

- **Use case:** Podgląd PDF przed pobraniem
- **Rozmiar:** Fullscreen (mobile) / Large modal (desktop)
- **Zawartość:** `<iframe>` z renderowanym PDF (z @react-pdf/renderer)
- **Przyciski:** "Pobierz PDF" + "Anuluj"
- **Loading state:** Skeleton + "Generuję PDF..." podczas renderu

**Implementacja (Shadcn Dialog):**

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Przypisz przepis</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[900px]">
    <DialogHeader>
      <DialogTitle>Wybierz przepis</DialogTitle>
    </DialogHeader>
    <RecipeList onSelect={handleSelect} />
  </DialogContent>
</Dialog>
```

**Mobilne optymalizacje:**

- Na mobile wszystkie modale fullscreen (100% viewport)
- Slide-up animation zamiast fade
- Sticky header z "X" close button

---

### 8. Jaką strategię cache'owania zastosować w TanStack Query dla różnych typów danych (przepisy statyczne, kalendarz tygodniowy dynamiczny, listy zakupów snapshot)?

**Rekomendacja:**
Zastosować **dyfferencjonowane strategie cache z różnymi `staleTime` i `cacheTime`:**

**Przepisy (quasi-statyczne):**

```typescript
useQuery({
  queryKey: ["recipes", search, sort],
  queryFn: fetchRecipes,
  staleTime: 5 * 60 * 1000, // 5 minut (user rzadko dodaje przepisy podczas sesji)
  cacheTime: 30 * 60 * 1000, // 30 minut w cache
  refetchOnWindowFocus: false, // Nie refetch przy focus (expensive query)
});
```

**Pojedynczy przepis (szczegóły):**

```typescript
useQuery({
  queryKey: ["recipe", recipeId],
  queryFn: () => fetchRecipe(recipeId),
  staleTime: 10 * 60 * 1000, // 10 minut
  enabled: !!recipeId, // Tylko gdy ID dostępne
});
```

**Kalendarz tygodniowy (częste zmiany):**

```typescript
useQuery({
  queryKey: ["meal-plan", weekStartDate],
  queryFn: () => fetchMealPlan(weekStartDate),
  staleTime: 0, // Zawsze traktuj jako stale (pokazuj świeże dane)
  cacheTime: 5 * 60 * 1000, // 5 minut w cache (dla szybkiego powrotu)
  refetchOnWindowFocus: true, // Refetch gdy user wraca do zakładki
});
```

**Listy zakupów (snapshot, read-only):**

```typescript
useQuery({
  queryKey: ["shopping-list", listId],
  queryFn: () => fetchShoppingList(listId),
  staleTime: Infinity, // Nigdy nie invaliduj (snapshot jest immutable)
  cacheTime: Infinity, // Trzymaj w cache do końca sesji
});
```

**Historia list zakupów:**

```typescript
useQuery({
  queryKey: ["shopping-lists", page],
  queryFn: () => fetchShoppingLists(page),
  staleTime: 2 * 60 * 1000, // 2 minuty
  keepPreviousData: true, // Pokaż previous page podczas fetch nowej
});
```

**Invalidation strategy (po mutacjach):**

```typescript
// Po dodaniu przepisu
queryClient.invalidateQueries(["recipes"]); // Refetch listy przepisów
queryClient.invalidateQueries(["recipe", newRecipeId]); // Pre-cache nowego przepisu

// Po przypisaniu do kalendarza
queryClient.invalidateQueries(["meal-plan", weekStartDate]);

// Po usunięciu przepisu
queryClient.removeQueries(["recipe", deletedRecipeId]); // Usuń z cache
queryClient.invalidateQueries(["recipes"]); // Refetch listy
queryClient.invalidateQueries(["meal-plan"]); // Może być przypisany
```

**Prefetching (proaktywne cache'owanie):**

```typescript
// Podczas hover na przepisie → prefetch szczegółów
onMouseEnter={() => {
  queryClient.prefetchQuery(['recipe', recipeId], () => fetchRecipe(recipeId));
}}

// Podczas ładowania kalendarza → prefetch sąsiednich tygodni
queryClient.prefetchQuery(['meal-plan', nextWeekDate], () => fetchMealPlan(nextWeekDate));
```

---

### 9. Jak zaprojektować error boundaries i error handling na poziomie UI, aby gracefully obsługiwać różne typy błędów API (401, 404, 500, timeout AI)?

**Rekomendacja:**
Zastosować **wielowarstwową strategię error handling:**

**Warstwa 1: React Error Boundary (Unexpected errors)**

```tsx
// src/components/ErrorBoundary.tsx
<ErrorBoundary
  fallback={<ErrorFallback />}
  onError={(error, errorInfo) => {
    Sentry.captureException(error, { contexts: { react: errorInfo } });
  }}
>
  <App />
</ErrorBoundary>
```

Fallback UI:

- Ilustracja "Coś poszło nie tak"
- Komunikat: "Przepraszamy, wystąpił nieoczekiwany błąd. Odśwież stronę lub spróbuj ponownie później."
- Przycisk "Odśwież stronę" (`window.location.reload()`)
- Przycisk "Wróć do strony głównej" (`navigate('/')`)

**Warstwa 2: API Error Handling (Expected errors)**

**401 Unauthorized:**

- **Gdzie:** Middleware w Astro + axios interceptor w React
- **Akcja:** Redirect do `/login?redirect=${currentPath}`
- **Toast:** "Sesja wygasła. Zaloguj się ponownie."

**404 Not Found (przepis, lista):**

- **Komponent:** `NotFound.tsx` z ilustracją
- **Komunikat:** "Nie znaleziono przepisu. Mógł zostać usunięty."
- **CTA:** "Wróć do listy przepisów"

**422 AI Categorization Failed:**

- **Nie pokazuj jako błąd!** (To jest expected fallback)
- **Toast info:** "Automatyczna kategoryzacja niedostępna. Możesz ręcznie przypisać kategorie."
- **UI:** Wszystkie składniki z kategorią "Inne", dropdown do zmiany

**500 Internal Server Error:**

- **Toast:** "Wystąpił błąd serwera. Nasz zespół został powiadomiony."
- **Sentry:** Automatic report
- **Retry button:** "Spróbuj ponownie" (max 3 razy)

**Network timeout:**

- **Toast:** "Brak połączenia. Sprawdź internet i spróbuj ponownie."
- **Retry button:** Auto-retry z exponential backoff (1s, 2s, 4s)

**Warstwa 3: Form Validation Errors (400 Bad Request)**

```tsx
// Zod validation + Shadcn Form
<FormField
  control={form.control}
  name="name"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Nazwa przepisu</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage /> {/* Automatic error display */}
    </FormItem>
  )}
/>
```

**Centralizacja error messages:**

```typescript
// src/lib/errors.ts
const ERROR_MESSAGES = {
  401: "Sesja wygasła. Zaloguj się ponownie.",
  404: "Nie znaleziono zasobu.",
  500: "Wystąpił błąd serwera. Spróbuj ponownie.",
  NETWORK: "Brak połączenia. Sprawdź internet.",
  AI_TIMEOUT: "Automatyczna kategoryzacja niedostępna.",
};

function getErrorMessage(error: AxiosError): string {
  return ERROR_MESSAGES[error.response?.status] || ERROR_MESSAGES[500];
}
```

---

### 10. Jaką strategię nawigacji zastosować na mobile (Bottom navigation bar vs Hamburger menu), aby zapewnić łatwy dostęp do kluczowych funkcji przy zachowaniu WCAG AA?

**Rekomendacja:**
Zastosować **hybrydowy model: Bottom navigation bar (główne akcje) + Hamburger menu (secondary actions):**

**Bottom Navigation Bar (mobile <768px):**

```tsx
<nav className="fixed bottom-0 w-full bg-white border-t z-50">
  <div className="flex justify-around items-center h-16">
    <NavItem href="/recipes" icon={<ChefHat />} label="Przepisy" />
    <NavItem href="/calendar" icon={<Calendar />} label="Kalendarz" />
    <NavItem
      href="/shopping-lists/generate"
      icon={<ShoppingCart />}
      label="Lista"
      variant="primary" // Highlighted (główny CTA)
    />
    <NavItem href="/shopping-lists" icon={<List />} label="Historia" />
  </div>
</nav>
```

**Accessibility:**

- Każdy item jako `<a>` z `aria-current="page"` dla aktywnej strony
- Ikony z `aria-hidden="true"` + visible label text
- Minimum 44px tap target (height: 4rem = 64px)
- Active state: Bold text + primary color + podkreślenie

**Hamburger Menu (Top-right):**

```tsx
<Sheet>
  {" "}
  {/* Shadcn Sheet = accessible drawer */}
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="Otwórz menu">
      <Menu />
    </Button>
  </SheetTrigger>
  <SheetContent side="left">
    <nav>
      <MenuItem href="/dashboard" icon={<Home />}>
        Dashboard
      </MenuItem>
      <MenuItem href="/settings" icon={<Settings />}>
        Ustawienia
      </MenuItem>
      <MenuSeparator />
      <MenuItem onClick={handleLogout} icon={<LogOut />}>
        Wyloguj
      </MenuItem>
    </nav>
  </SheetContent>
</Sheet>
```

**Desktop (≥1024px):**

- Sidebar po lewej stronie (fixed, sticky)
- Główne linki: Dashboard, Przepisy, Kalendarz, Listy zakupów
- Wyloguj na dole sidebara
- Active state: Background color + border-left accent

**Tablet (768-1023px):**

- Top bar z logo + główne linki inline
- Hamburger dla secondary actions
- No bottom navigation (enough space for top nav)

**Sticky header (wszystkie ekrany):**

```tsx
<header className="sticky top-0 z-40 bg-white border-b">
  <div className="flex items-center justify-between px-4 h-16">
    <Logo />
    <UserMenu /> {/* Avatar + dropdown */}
  </div>
</header>
```

**Skip to main content (a11y):**

```tsx
<a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50">
  Przeskocz do głównej treści
</a>
<main id="main">
  {/* Page content */}
</main>
```

</pytania>

---

## Podsumowanie i Następne Kroki

Powyższe pytania i rekomendacje obejmują kluczowe aspekty architektury UI dla ShopMate MVP. Rekomenduje się:

1. **Priorytetyzacja:** Rozpocząć od pytań 1-3 (struktura widoków, kalendarz, przepływ generowania), które są fundamentem architektury
2. **Konsultacja z zespołem:** Przedyskutować pytania 6-8 (optimistic UI, modale, cache) które mają największy wpływ na developer experience
3. **Prototypowanie:** Stworzyć proof-of-concept dla kalendarza (pytanie 2) i generowania listy (pytanie 3) aby zwalidować wybrane podejście
4. **Accessibility audit:** Po implementacji pierwszych widoków przeprowadzić test z Lighthouse i screen readerem (pytania 4, 5, 10)

**Kolejne dokumenty do stworzenia:**

- Szczegółowa mapa komponentów UI (component tree)
- User journey maps dla kluczowych przepływów (onboarding, tworzenie pierwszej listy)
- Design system (kolory, typography, spacing) zgodny z Tailwind + Shadcn
- State management diagram (TanStack Query keys, invalidation strategy)

**Data utworzenia:** 2025-11-06
**Autor:** Claude Code (AI UI Architecture Consultant)
**Status:** ✅ Gotowe do konsultacji
