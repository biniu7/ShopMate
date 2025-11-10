# Plan implementacji widoku Dashboard

## 1. Przegląd

Dashboard jest głównym widokiem aplikacji ShopMate wyświetlanym po zalogowaniu użytkownika. Jego celem jest przedstawienie przeglądu stanu aplikacji oraz zapewnienie szybkiego dostępu do kluczowych funkcjonalności. Widok wyświetla statystyki (liczba przepisów, posiłków w kalendarzu, list zakupów), ostatnio dodane przepisy oraz nadchodzące posiłki na dziś i jutro. Dodatkowo oferuje trzy główne przyciski akcji (CTA) umożliwiające szybkie dodanie przepisu, zaplanowanie tygodnia oraz wygenerowanie listy zakupów.

Dashboard charakteryzuje się responsywnym układem dostosowanym do różnych urządzeń oraz specjalnym trybem dla nowych użytkowników (empty state z podpowiedziami onboardingowymi).

## 2. Routing widoku

**Ścieżka:** `/dashboard`

**Typ:** Strona Astro z dynamicznymi komponentami React

**Zabezpieczenia:**

- Middleware sprawdza autentykację użytkownika
- Brak sesji → przekierowanie do `/login`
- Row Level Security (RLS) zapewnia dostęp tylko do danych zalogowanego użytkownika

## 3. Struktura komponentów

```
src/pages/dashboard.astro (Astro page)
└── DashboardView.tsx (React component, client:load)
    ├── DashboardHeader.tsx
    │   └── Heading + Breadcrumbs
    ├── StatsSection.tsx
    │   ├── StatCard.tsx (Przepisy)
    │   ├── StatCard.tsx (Zaplanowane posiłki)
    │   └── StatCard.tsx (Listy zakupów)
    ├── QuickActionsSection.tsx
    │   ├── ActionButton (Dodaj przepis)
    │   ├── ActionButton (Zaplanuj tydzień)
    │   └── ActionButton (Generuj listę)
    ├── RecentRecipesSection.tsx
    │   ├── SectionHeader
    │   └── RecipeCard.tsx × 3
    ├── UpcomingMealsSection.tsx
    │   ├── SectionHeader
    │   └── MealItem.tsx × n
    └── EmptyState.tsx (conditional, dla nowych użytkowników)
```

**Hierarchia:**

1. `dashboard.astro` - główna strona Astro
2. `DashboardView.tsx` - główny kontener React z zarządzaniem stanem
3. Sekcje (`StatsSection`, `QuickActionsSection`, etc.) - logiczne grupy komponentów
4. Komponenty atomowe (`StatCard`, `RecipeCard`, `MealItem`) - komponenty wielokrotnego użytku

## 4. Szczegóły komponentów

### 4.1. DashboardView (Główny kontener)

**Opis:**
Główny komponent React zarządzający stanem całego dashboardu. Odpowiada za pobieranie danych z API (statystyki, ostatnie przepisy, nadchodzące posiłki), zarządzanie stanem ładowania i błędów oraz warunkowe renderowanie sekcji lub empty state.

**Główne elementy:**

```tsx
<div className="dashboard-container">
  {isLoading && <DashboardSkeleton />}
  {error && <ErrorMessage />}
  {!isLoading && !error && (
    <>
      <DashboardHeader />
      {isNewUser ? (
        <EmptyState />
      ) : (
        <>
          <StatsSection stats={stats} />
          <QuickActionsSection />
          <RecentRecipesSection recipes={recentRecipes} />
          <UpcomingMealsSection meals={upcomingMeals} />
        </>
      )}
    </>
  )}
</div>
```

**Obsługiwane interakcje:**

- Automatyczne ładowanie danych przy montowaniu komponentu
- Refetch danych przy window focus (TanStack Query)

**Obsługiwana walidacja:**

- Sprawdzenie czy użytkownik jest nowy (`recipesCount === 0`)
- Walidacja dostępności danych przed renderowaniem

**Typy:**

- `DashboardData` (ViewModel)
- `DashboardStats` (ViewModel)
- `UpcomingMealViewModel` (ViewModel)

**Propsy:**
Brak (komponent główny)

### 4.2. StatsSection

**Opis:**
Sekcja wyświetlająca trzy karty ze statystykami: liczbę przepisów, liczbę zaplanowanych posiłków w bieżącym tygodniu oraz liczbę zapisanych list zakupów. Karty wyświetlane są w układzie responsywnym (3 kolumny na desktop, 2 na tablet, 1 na mobile).

**Główne elementy:**

```tsx
<section className="stats-section" aria-label="Statystyki">
  <div className="stats-grid">
    <StatCard icon={<ChefHat />} label="Przepisy" value={stats.recipesCount} href="/recipes" />
    <StatCard icon={<Calendar />} label="Zaplanowane posiłki" value={stats.mealPlansCount} href="/calendar" />
    <StatCard icon={<ShoppingCart />} label="Listy zakupów" value={stats.shoppingListsCount} href="/shopping-lists" />
  </div>
</section>
```

**Obsługiwane interakcje:**

- Kliknięcie karty → nawigacja do odpowiedniej sekcji aplikacji
- Hover state dla kart (podniesienie, zmiana koloru)

**Obsługiwana walidacja:**

- Wyświetlanie `0` gdy brak danych (nie ukrywanie kart)
- Liczby całkowite nieujemne

**Typy:**

- `DashboardStats`

**Propsy:**

```typescript
interface StatsSectionProps {
  stats: DashboardStats;
  isLoading?: boolean;
}
```

### 4.3. StatCard

**Opis:**
Pojedyncza karta statystyki wyświetlająca ikonę, etykietę oraz wartość liczbową. Karta jest kliklalna i prowadzi do odpowiedniej sekcji aplikacji.

**Główne elementy:**

```tsx
<Link href={href} className="stat-card">
  <div className="stat-card-icon">{icon}</div>
  <div className="stat-card-content">
    <p className="stat-card-label">{label}</p>
    <p className="stat-card-value" aria-label={`${label}: ${value}`}>
      {value}
    </p>
  </div>
</Link>
```

**Obsługiwane interakcje:**

- Click → nawigacja do `href`
- Hover → visual feedback (shadow, transform)
- Focus → keyboard navigation support

**Obsługiwana walidacja:**

- `value` musi być liczbą nieujemną

**Typy:**

- `React.ReactNode` (icon)
- `string` (label, href)
- `number` (value)

**Propsy:**

```typescript
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  href: string;
}
```

### 4.4. QuickActionsSection

**Opis:**
Sekcja z trzema przyciskami CTA umożliwiającymi szybki dostęp do głównych funkcji aplikacji: dodawanie przepisu, planowanie tygodnia oraz generowanie listy zakupów. Na urządzeniach mobilnych sekcja jest sticky (przyklejona do dolnej krawędzi ekranu).

**Główne elementy:**

```tsx
<section className="quick-actions-section" aria-label="Szybkie akcje">
  <div className="quick-actions-grid">
    <ActionButton
      icon={<Plus />}
      label="Dodaj przepis"
      description="Stwórz nowy przepis"
      href="/recipes/new"
      variant="primary"
    />
    <ActionButton
      icon={<Calendar />}
      label="Zaplanuj tydzień"
      description="Przypisz przepisy do kalendarza"
      href="/calendar"
      variant="secondary"
    />
    <ActionButton
      icon={<ShoppingCart />}
      label="Generuj listę"
      description="Stwórz listę zakupów"
      href="/shopping-lists/generate"
      variant="secondary"
    />
  </div>
</section>
```

**Obsługiwane interakcje:**

- Kliknięcie przycisku → nawigacja do odpowiedniej ścieżki
- Hover/focus states
- Keyboard navigation (Tab, Enter)

**Obsługiwana walidacja:**
Brak (statyczne przyciski)

**Typy:**
Brak specjalnych typów (używa standardowych props dla ButtonLink)

**Propsy:**
Brak (sekcja standalone)

### 4.5. ActionButton

**Opis:**
Przycisk CTA z ikoną, etykietą główną oraz opisem. Komponent używany w QuickActionsSection.

**Główne elementy:**

```tsx
<Link href={href} className={cn("action-button", variant)}>
  <div className="action-button-icon">{icon}</div>
  <div className="action-button-content">
    <span className="action-button-label">{label}</span>
    <span className="action-button-description">{description}</span>
  </div>
</Link>
```

**Obsługiwane interakcje:**

- Click → nawigacja
- Hover → visual feedback
- Focus → keyboard support

**Obsługiwana walidacja:**
Brak

**Typy:**

```typescript
interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
  variant: "primary" | "secondary";
}
```

**Propsy:**
Zgodnie z `ActionButtonProps`

### 4.6. RecentRecipesSection

**Opis:**
Sekcja wyświetlająca 3 ostatnio dodane przepisy w formie kart. Każda karta pokazuje nazwę przepisu, liczbę składników oraz datę dodania. Kliknięcie karty przenosi do szczegółów przepisu.

**Główne elementy:**

```tsx
<section className="recent-recipes-section">
  <div className="section-header">
    <h2>Ostatnie przepisy</h2>
    <Link href="/recipes" className="view-all-link">
      Zobacz wszystkie →
    </Link>
  </div>
  <div className="recipes-grid">
    {recipes.length === 0 ? (
      <EmptyMessage
        message="Nie masz jeszcze przepisów"
        cta={{ label: "Dodaj pierwszy przepis", href: "/recipes/new" }}
      />
    ) : (
      recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)
    )}
  </div>
</section>
```

**Obsługiwane interakcje:**

- Kliknięcie "Zobacz wszystkie" → nawigacja do `/recipes`
- Kliknięcie karty przepisu → nawigacja do `/recipes/:id`
- Hover state na kartach

**Obsługiwana walidacja:**

- Sprawdzenie czy `recipes.length > 0`
- Wyświetlanie empty state gdy brak przepisów

**Typy:**

- `RecipeListItemDto[]`

**Propsy:**

```typescript
interface RecentRecipesSectionProps {
  recipes: RecipeListItemDto[];
  isLoading?: boolean;
}
```

### 4.7. RecipeCard

**Opis:**
Karta przepisu wyświetlająca nazwę (skrócona do 50 znaków), liczbę składników (badge) oraz datę dodania (relative time np. "2 dni temu"). Karta jest kliklalna i prowadzi do szczegółów przepisu.

**Główne elementy:**

```tsx
<Link href={`/recipes/${recipe.id}`} className="recipe-card">
  <article>
    <h3 className="recipe-card-name" title={recipe.name}>
      {truncate(recipe.name, 50)}
    </h3>
    <div className="recipe-card-meta">
      <Badge variant="secondary">{recipe.ingredients_count} składników</Badge>
      <time dateTime={recipe.created_at} className="recipe-card-date">
        {formatRelativeTime(recipe.created_at)}
      </time>
    </div>
  </article>
</Link>
```

**Obsługiwane interakcje:**

- Click → nawigacja do `/recipes/:id`
- Hover → prefetch recipe details (TanStack Query)
- Focus → keyboard navigation

**Obsługiwana walidacja:**

- Truncate name do 50 znaków
- Formatowanie daty do relative time

**Typy:**

- `RecipeListItemDto`

**Propsy:**

```typescript
interface RecipeCardProps {
  recipe: RecipeListItemDto;
}
```

### 4.8. UpcomingMealsSection

**Opis:**
Sekcja wyświetlająca nadchodzące posiłki zaplanowane na dziś i jutro w formie timeline. Każdy posiłek pokazuje dzień, typ posiłku (śniadanie/obiad/etc.) oraz nazwę przepisu.

**Główne elementy:**

```tsx
<section className="upcoming-meals-section">
  <div className="section-header">
    <h2>Nadchodzące posiłki</h2>
    <Link href="/calendar" className="view-calendar-link">
      Zobacz kalendarz →
    </Link>
  </div>
  <div className="meals-timeline">
    {meals.length === 0 ? (
      <EmptyMessage message="Brak zaplanowanych posiłków" cta={{ label: "Zaplanuj tydzień", href: "/calendar" }} />
    ) : (
      meals.map((meal, index) => <MealItem key={index} meal={meal} />)
    )}
  </div>
</section>
```

**Obsługiwane interakcje:**

- Kliknięcie "Zobacz kalendarz" → nawigacja do `/calendar`
- Kliknięcie posiłku → nawigacja do `/recipes/:id` lub `/calendar?week={date}`

**Obsługiwana walidacja:**

- Filtrowanie posiłków tylko na dziś i jutro
- Sortowanie chronologiczne (dziś przed jutro, śniadanie przed obiadem)
- Empty state gdy brak posiłków

**Typy:**

- `UpcomingMealViewModel[]`

**Propsy:**

```typescript
interface UpcomingMealsSectionProps {
  meals: UpcomingMealViewModel[];
  isLoading?: boolean;
}
```

### 4.9. MealItem

**Opis:**
Pojedynczy element timeline'u reprezentujący posiłek. Wyświetla dzień ("Dzisiaj"/"Jutro"), typ posiłku oraz nazwę przepisu.

**Główne elementy:**

```tsx
<div className="meal-item">
  <div className="meal-item-indicator" />
  <div className="meal-item-content">
    <div className="meal-item-header">
      <span className="meal-item-day">{meal.day}</span>
      <span className="meal-item-date">{meal.date}</span>
    </div>
    <div className="meal-item-body">
      <span className="meal-item-type">{meal.mealTypeLabel}</span>
      <Link href={`/recipes/${meal.recipeId}`} className="meal-item-recipe">
        {meal.recipeName}
      </Link>
    </div>
  </div>
</div>
```

**Obsługiwane interakcje:**

- Kliknięcie nazwy przepisu → nawigacja do `/recipes/:id`
- Hover na nazwie przepisu

**Obsługiwana walidacja:**
Brak

**Typy:**

- `UpcomingMealViewModel`

**Propsy:**

```typescript
interface MealItemProps {
  meal: UpcomingMealViewModel;
}
```

### 4.10. EmptyState

**Opis:**
Komponent wyświetlany dla nowych użytkowników (0 przepisów). Zawiera ilustrację, komunikat powitalny oraz duży przycisk CTA do dodania pierwszego przepisu z tooltipem onboardingowym.

**Główne elementy:**

```tsx
<div className="empty-state">
  <div className="empty-state-illustration">{/* SVG illustration lub image */}</div>
  <div className="empty-state-content">
    <h2>Witaj w ShopMate!</h2>
    <p>Zacznij od dodania pierwszego przepisu</p>
    <Tooltip content="Będziesz mógł przypisać go do kalendarza">
      <Button size="lg" href="/recipes/new" className="empty-state-cta">
        Dodaj pierwszy przepis
      </Button>
    </Tooltip>
  </div>
  <div className="empty-state-features">
    <FeatureHighlight icon={<Calendar />} text="Planuj posiłki na cały tydzień" />
    <FeatureHighlight icon={<ShoppingCart />} text="Generuj listy zakupów automatycznie" />
    <FeatureHighlight icon={<Sparkles />} text="AI kategoryzuje składniki za Ciebie" />
  </div>
</div>
```

**Obsługiwane interakcje:**

- Kliknięcie CTA → nawigacja do `/recipes/new`
- Tooltip z onboarding hint

**Obsługiwana walidacja:**

- Wyświetlanie tylko gdy `recipesCount === 0`

**Typy:**
Brak specjalnych typów

**Propsy:**
Brak

### 4.11. DashboardSkeleton

**Opis:**
Komponent loading state wyświetlający szkielety (skeletons) wszystkich sekcji dashboardu podczas ładowania danych.

**Główne elementy:**

```tsx
<div className="dashboard-skeleton">
  <div className="stats-skeleton">
    <Skeleton className="stat-card-skeleton" count={3} />
  </div>
  <div className="quick-actions-skeleton">
    <Skeleton className="action-button-skeleton" count={3} />
  </div>
  <div className="recipes-skeleton">
    <Skeleton className="recipe-card-skeleton" count={3} />
  </div>
  <div className="meals-skeleton">
    <Skeleton className="meal-item-skeleton" count={3} />
  </div>
</div>
```

**Obsługiwane interakcje:**
Brak (komponent statyczny)

**Obsługiwana walidacja:**
Brak

**Typy:**
Brak

**Propsy:**
Brak

## 5. Typy

### 5.1. Istniejące typy (z src/types.ts)

```typescript
// Używane w Dashboard
export interface RecipeListItemDto {
  id: string;
  name: string;
  ingredients_count: number;
  created_at: string;
  updated_at: string;
}

export interface MealPlanAssignmentDto {
  id: string;
  user_id: string;
  recipe_id: string;
  recipe_name: string;
  week_start_date: string;
  day_of_week: number; // 1-7
  meal_type: MealType;
  created_at: string;
}

export type MealType = "breakfast" | "second_breakfast" | "lunch" | "dinner";

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface WeekCalendarResponseDto {
  week_start_date: string;
  week_end_date: string;
  assignments: MealPlanAssignmentDto[];
}

export interface ShoppingListListItemDto {
  id: string;
  name: string;
  week_start_date: string | null;
  items_count: number;
  created_at: string;
}
```

### 5.2. Nowe typy ViewModel (do utworzenia)

```typescript
/**
 * Statystyki dashboardu
 */
export interface DashboardStats {
  /** Całkowita liczba przepisów użytkownika */
  recipesCount: number;
  /** Liczba przypisań posiłków w bieżącym tygodniu */
  mealPlansCount: number;
  /** Całkowita liczba zapisanych list zakupów */
  shoppingListsCount: number;
}

/**
 * ViewModel dla nadchodzącego posiłku w timeline
 */
export interface UpcomingMealViewModel {
  /** Etykieta dnia: "Dzisiaj" lub "Jutro" */
  day: string;
  /** Sformatowana data (np. "20 stycznia") */
  date: string;
  /** ISO date string dla sortowania */
  isoDate: string;
  /** Dzień tygodnia (1-7) */
  dayOfWeek: number;
  /** Typ posiłku (breakfast, lunch, etc.) */
  mealType: MealType;
  /** Polska etykieta typu posiłku (np. "Śniadanie") */
  mealTypeLabel: string;
  /** Nazwa przypisanego przepisu */
  recipeName: string;
  /** ID przypisanego przepisu */
  recipeId: string;
  /** Porządek sortowania (0-7, gdzie 0 = dziś śniadanie, 7 = jutro kolacja) */
  sortOrder: number;
}

/**
 * Kompletne dane dla widoku Dashboard
 */
export interface DashboardData {
  /** Statystyki (liczby) */
  stats: DashboardStats;
  /** 3 ostatnio dodane przepisy */
  recentRecipes: RecipeListItemDto[];
  /** Posiłki na dziś i jutro */
  upcomingMeals: UpcomingMealViewModel[];
  /** Czy użytkownik jest nowy (0 przepisów) */
  isNewUser: boolean;
  /** Czy dane się ładują */
  isLoading: boolean;
  /** Błąd jeśli wystąpił */
  error: Error | null;
}
```

### 5.3. Typy dla utility functions

```typescript
/**
 * Mapowanie typu posiłku na polską etykietę
 */
export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Śniadanie",
  second_breakfast: "Drugie śniadanie",
  lunch: "Obiad",
  dinner: "Kolacja",
};

/**
 * Kolejność typów posiłków (dla sortowania)
 */
export const MEAL_TYPE_ORDER: Record<MealType, number> = {
  breakfast: 0,
  second_breakfast: 1,
  lunch: 2,
  dinner: 3,
};
```

## 6. Zarządzanie stanem

### 6.1. Custom Hook: `useDashboard`

Dashboard używa dedykowanego custom hooka `useDashboard` zarządzającego całym stanem widoku. Hook agreguje dane z wielu źródeł (przepisy, kalendarz, listy zakupów) i transformuje je do postaci odpowiedniej dla UI.

```typescript
import { useQuery } from "@tanstack/react-query";
import { getCurrentWeekStart, isToday, isTomorrow } from "@/lib/utils/date";
import type { DashboardData, DashboardStats, UpcomingMealViewModel } from "@/types";

export function useDashboard(): DashboardData {
  const currentWeekStart = getCurrentWeekStart();

  // Fetch 1: Statystyki przepisów (używamy pagination.total)
  const {
    data: recipesData,
    isLoading: recipesLoading,
    error: recipesError,
  } = useQuery({
    queryKey: ["recipes", "stats"],
    queryFn: async () => {
      const response = await fetch("/api/recipes?page=1&limit=1");
      if (!response.ok) throw new Error("Failed to fetch recipes stats");
      return response.json() as Promise<PaginatedResponse<RecipeListItemDto>>;
    },
    staleTime: 5 * 60 * 1000, // 5 minut
  });

  // Fetch 2: Statystyki list zakupów
  const {
    data: shoppingListsData,
    isLoading: shoppingListsLoading,
    error: shoppingListsError,
  } = useQuery({
    queryKey: ["shopping-lists", "stats"],
    queryFn: async () => {
      const response = await fetch("/api/shopping-lists?page=1&limit=1");
      if (!response.ok) throw new Error("Failed to fetch shopping lists stats");
      return response.json() as Promise<PaginatedResponse<ShoppingListListItemDto>>;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch 3: Kalendarz bieżącego tygodnia (dla statystyk i upcoming meals)
  const {
    data: mealPlanData,
    isLoading: mealPlanLoading,
    error: mealPlanError,
  } = useQuery({
    queryKey: ["meal-plan", currentWeekStart],
    queryFn: async () => {
      const response = await fetch(`/api/meal-plan?week_start_date=${currentWeekStart}`);
      if (!response.ok) throw new Error("Failed to fetch meal plan");
      return response.json() as Promise<WeekCalendarResponseDto>;
    },
    staleTime: 0, // Zawsze fresh
    refetchOnWindowFocus: true,
  });

  // Fetch 4: Ostatnie 3 przepisy
  const {
    data: recentRecipesData,
    isLoading: recentRecipesLoading,
    error: recentRecipesError,
  } = useQuery({
    queryKey: ["recipes", "recent"],
    queryFn: async () => {
      const response = await fetch("/api/recipes?page=1&limit=3&sort=created_desc");
      if (!response.ok) throw new Error("Failed to fetch recent recipes");
      return response.json() as Promise<PaginatedResponse<RecipeListItemDto>>;
    },
    staleTime: 2 * 60 * 1000, // 2 minuty
  });

  // Compute stats
  const stats: DashboardStats = {
    recipesCount: recipesData?.pagination.total ?? 0,
    mealPlansCount: mealPlanData?.assignments.length ?? 0,
    shoppingListsCount: shoppingListsData?.pagination.total ?? 0,
  };

  // Compute upcoming meals (dziś i jutro)
  const upcomingMeals: UpcomingMealViewModel[] = React.useMemo(() => {
    if (!mealPlanData?.assignments) return [];

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayDayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // 1-7
    const tomorrowDayOfWeek = tomorrow.getDay() === 0 ? 7 : tomorrow.getDay();

    return mealPlanData.assignments
      .filter((assignment) => assignment.day_of_week === todayDayOfWeek || assignment.day_of_week === tomorrowDayOfWeek)
      .map((assignment) => {
        const isToday = assignment.day_of_week === todayDayOfWeek;
        const date = isToday ? today : tomorrow;

        return {
          day: isToday ? "Dzisiaj" : "Jutro",
          date: format(date, "d MMMM", { locale: pl }),
          isoDate: format(date, "yyyy-MM-dd"),
          dayOfWeek: assignment.day_of_week,
          mealType: assignment.meal_type,
          mealTypeLabel: MEAL_TYPE_LABELS[assignment.meal_type],
          recipeName: assignment.recipe_name,
          recipeId: assignment.recipe_id,
          sortOrder: (isToday ? 0 : 4) + MEAL_TYPE_ORDER[assignment.meal_type],
        } as UpcomingMealViewModel;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [mealPlanData]);

  // Aggregate loading state
  const isLoading = recipesLoading || shoppingListsLoading || mealPlanLoading || recentRecipesLoading;

  // Aggregate errors
  const error = recipesError || shoppingListsError || mealPlanError || recentRecipesError || null;

  return {
    stats,
    recentRecipes: recentRecipesData?.data ?? [],
    upcomingMeals,
    isNewUser: stats.recipesCount === 0,
    isLoading,
    error: error as Error | null,
  };
}
```

### 6.2. Konfiguracja TanStack Query

Wszystkie zapytania używają TanStack Query dla:

- Automatycznego cachowania
- Revalidation przy window focus
- Równoległego fetchowania (parallel queries)
- Error handling i retry logic
- Optimistic updates (w przyszłości)

**Konfiguracja globalna w `src/lib/query-client.ts`:**

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 0,
      refetchOnWindowFocus: false,
    },
  },
});
```

### 6.3. Stan lokalny komponentów

Komponenty indywidualne (np. `StatCard`, `RecipeCard`) nie mają własnego stanu - są pure components przyjmujące dane przez props.

Jedyny stan lokalny może wystąpić w:

- `EmptyState` - stan tooltipa (hover)
- Animacje hover/focus (CSS, nie React state)

## 7. Integracja API

### 7.1. Endpoint: GET /api/recipes (statystyki)

**Request:**

```
GET /api/recipes?page=1&limit=1
```

**Response:**

```typescript
PaginatedResponse<RecipeListItemDto>
{
  data: RecipeListItemDto[];
  pagination: {
    page: 1,
    limit: 1,
    total: 45, // <-- używamy tego do stats.recipesCount
    total_pages: 45
  }
}
```

**Użycie:**

- Pobieranie `pagination.total` dla statystyki liczby przepisów
- `limit=1` minimalizuje payload (potrzebujemy tylko metadanych)

### 7.2. Endpoint: GET /api/shopping-lists (statystyki)

**Request:**

```
GET /api/shopping-lists?page=1&limit=1
```

**Response:**

```typescript
PaginatedResponse<ShoppingListListItemDto>
{
  data: ShoppingListListItemDto[];
  pagination: {
    page: 1,
    limit: 1,
    total: 12, // <-- używamy tego do stats.shoppingListsCount
    total_pages: 12
  }
}
```

**Użycie:**

- Pobieranie `pagination.total` dla statystyki liczby list zakupów

### 7.3. Endpoint: GET /api/meal-plan (kalendarz)

**Request:**

```
GET /api/meal-plan?week_start_date=2025-01-20
```

**Response:**

```typescript
WeekCalendarResponseDto
{
  week_start_date: "2025-01-20",
  week_end_date: "2025-01-26",
  assignments: MealPlanAssignmentDto[]
}
```

**Użycie:**

- Liczba `assignments` → `stats.mealPlansCount`
- Filtrowanie `assignments` dla dzisiejszego i jutrzejszego `day_of_week` → `upcomingMeals`
- `week_start_date` obliczany dynamicznie funkcją `getCurrentWeekStart()`

### 7.4. Endpoint: GET /api/recipes (ostatnie przepisy)

**Request:**

```
GET /api/recipes?page=1&limit=3&sort=created_desc
```

**Response:**

```typescript
PaginatedResponse<RecipeListItemDto>
{
  data: [
    {
      id: "uuid",
      name: "Spaghetti Carbonara",
      ingredients_count: 5,
      created_at: "2025-01-26T10:00:00Z",
      updated_at: "2025-01-26T10:00:00Z"
    },
    // ... 2 more
  ],
  pagination: {...}
}
```

**Użycie:**

- `data` array → `recentRecipes` w `DashboardData`
- Wyświetlanie w `RecentRecipesSection`

### 7.5. Error Handling

Wszystkie endpointy mogą zwrócić błędy:

**401 Unauthorized:**

```json
{
  "error": "Unauthorized",
  "message": "You must be logged in"
}
```

→ Redirect do `/login`

**500 Internal Server Error:**

```json
{
  "error": "Internal server error",
  "message": "Failed to fetch data"
}
```

→ Wyświetlenie error state z retry button

## 8. Interakcje użytkownika

### 8.1. Przeglądanie statystyk

**Akcja użytkownika:**

- Użytkownik wchodzi na `/dashboard`
- Automatyczne ładowanie danych

**Przepływ:**

1. Montowanie `DashboardView`
2. `useDashboard` hook wywołuje 4 zapytania równolegle
3. Wyświetlanie `DashboardSkeleton` podczas ładowania
4. Po załadowaniu: renderowanie `StatsSection` z danymi
5. Wyświetlanie liczb: przepisy, posiłki, listy

**Warunki:**

- Jeśli `recipesCount === 0` → pokaż `EmptyState` zamiast normalnego dashboardu
- Jeśli error → wyświetl error message z retry button

### 8.2. Kliknięcie karty statystyki

**Akcja użytkownika:**

- Kliknięcie karty "Przepisy"

**Przepływ:**

1. Nawigacja do `/recipes`
2. Prefetch danych przepisów (TanStack Query)

**Podobnie dla:**

- Karta "Zaplanowane posiłki" → `/calendar`
- Karta "Listy zakupów" → `/shopping-lists`

### 8.3. Kliknięcie przycisku Quick Action

**Akcja użytkownika:**

- Kliknięcie "Dodaj przepis"

**Przepływ:**

1. Nawigacja do `/recipes/new`
2. Formularz dodawania przepisu

**Podobnie dla:**

- "Zaplanuj tydzień" → `/calendar`
- "Generuj listę" → `/shopping-lists/generate`

### 8.4. Kliknięcie karty przepisu w Recent Recipes

**Akcja użytkownika:**

- Kliknięcie karty przepisu "Spaghetti Carbonara"

**Przepływ:**

1. Hover → prefetch szczegółów przepisu (TanStack Query)
2. Click → nawigacja do `/recipes/{id}`
3. Wyświetlenie szczegółów przepisu

### 8.5. Kliknięcie "Zobacz wszystkie" w Recent Recipes

**Akcja użytkownika:**

- Kliknięcie linku "Zobacz wszystkie →"

**Przepływ:**

1. Nawigacja do `/recipes`
2. Lista wszystkich przepisów użytkownika

### 8.6. Kliknięcie posiłku w Upcoming Meals

**Akcja użytkownika:**

- Kliknięcie nazwy przepisu w timeline posiłków

**Przepływ:**

1. Nawigacja do `/recipes/{recipeId}`
2. Wyświetlenie szczegółów przepisu

**Alternatywnie (do rozważenia):**

- Nawigacja do `/calendar?week={date}` z highlightem danego posiłku

### 8.7. Kliknięcie "Zobacz kalendarz" w Upcoming Meals

**Akcja użytkownika:**

- Kliknięcie linku "Zobacz kalendarz →"

**Przepływ:**

1. Nawigacja do `/calendar`
2. Domyślnie bieżący tydzień

### 8.8. Użytkownik nowy (Empty State)

**Akcja użytkownika:**

- Nowy użytkownik (0 przepisów) wchodzi na dashboard

**Przepływ:**

1. `useDashboard` wykrywa `recipesCount === 0`
2. Ustawienie `isNewUser = true`
3. Renderowanie `EmptyState` zamiast normalnych sekcji
4. Wyświetlenie: ilustracja, komunikat powitalny, CTA "Dodaj pierwszy przepis"
5. Tooltip z hintem: "Będziesz mógł przypisać go do kalendarza"

**Akcja:**

- Kliknięcie CTA → nawigacja do `/recipes/new`

## 9. Warunki i walidacja

### 9.1. Warunek: Użytkownik nowy vs. istniejący

**Komponent:** `DashboardView`

**Warunek:**

```typescript
if (dashboardData.isNewUser) {
  return <EmptyState />;
} else {
  return <NormalDashboard />;
}
```

**Wpływ na UI:**

- `isNewUser === true` (recipesCount === 0) → pokazanie `EmptyState` z onboardingiem
- `isNewUser === false` → pokazanie normalnego dashboardu ze statystykami i sekcjami

### 9.2. Warunek: Empty state dla Recent Recipes

**Komponent:** `RecentRecipesSection`

**Warunek:**

```typescript
if (recipes.length === 0) {
  return <EmptyMessage message="Nie masz jeszcze przepisów" />;
}
```

**Wpływ na UI:**

- Brak przepisów → komunikat "Nie masz jeszcze przepisów" + CTA
- Są przepisy (1-3) → wyświetlenie kart

**Uwaga:**
Ten warunek teoretycznie nie powinien się wykonać jeśli `isNewUser === true`, bo wtedy cały dashboard pokazuje `EmptyState`. Jednak dla bezpieczeństwa sprawdzamy `recipes.length`.

### 9.3. Warunek: Empty state dla Upcoming Meals

**Komponent:** `UpcomingMealsSection`

**Warunek:**

```typescript
if (meals.length === 0) {
  return <EmptyMessage message="Brak zaplanowanych posiłków" cta={{ label: "Zaplanuj tydzień", href: "/calendar" }} />;
}
```

**Wpływ na UI:**

- Brak posiłków na dziś/jutro → komunikat + CTA "Zaplanuj tydzień"
- Są posiłki → wyświetlenie timeline

### 9.4. Warunek: Filtrowanie posiłków na dziś i jutro

**Komponent:** `useDashboard` hook

**Warunek:**

```typescript
const upcomingMeals = mealPlanData.assignments
  .filter(assignment =>
    assignment.day_of_week === todayDayOfWeek ||
    assignment.day_of_week === tomorrowDayOfWeek
  )
  .map(...)
  .sort((a, b) => a.sortOrder - b.sortOrder);
```

**Wpływ na UI:**

- Pokazanie tylko posiłków z `day_of_week` równym dzisiejszemu lub jutrzejszemu
- Sortowanie chronologiczne (dziś przed jutro, śniadanie przed obiadem)

### 9.5. Warunek: Loading state

**Komponent:** `DashboardView`

**Warunek:**

```typescript
if (isLoading) {
  return <DashboardSkeleton />;
}
```

**Wpływ na UI:**

- Podczas ładowania danych (którekolwiek z 4 zapytań) → `DashboardSkeleton`
- Po załadowaniu → normalna zawartość

### 9.6. Warunek: Error state

**Komponent:** `DashboardView`

**Warunek:**

```typescript
if (error) {
  return <ErrorMessage error={error} onRetry={refetch} />;
}
```

**Wpływ na UI:**

- Jeśli którykolwiek z endpointów zwrócił błąd → `ErrorMessage` z opisem i przyciskiem "Spróbuj ponownie"
- Kliknięcie "Spróbuj ponownie" → `refetch()` wszystkich zapytań

### 9.7. Warunek: Auth redirect

**Poziom:** Middleware Astro (`src/middleware/index.ts`)

**Warunek:**

```typescript
const {
  data: { user },
} = await supabase.auth.getUser();
if (!user && pathname === "/dashboard") {
  return Response.redirect("/login");
}
```

**Wpływ na UI:**

- Niezalogowany użytkownik próbuje wejść na `/dashboard` → redirect do `/login`

### 9.8. Walidacja: Liczby statystyk

**Komponent:** `StatCard`

**Walidacja:**

```typescript
const displayValue = typeof value === "number" && value >= 0 ? value : 0;
```

**Wpływ na UI:**

- Zawsze wyświetlamy liczbę nieujemną
- Jeśli `value` undefined/null → pokazujemy `0`

### 9.9. Walidacja: Truncate nazwy przepisu

**Komponent:** `RecipeCard`

**Walidacja:**

```typescript
const truncatedName = recipe.name.length > 50 ? recipe.name.substring(0, 50) + "..." : recipe.name;
```

**Wpływ na UI:**

- Nazwa przepisu ≤ 50 znaków → pełna nazwa
- Nazwa > 50 znaków → obcięcie do 50 + "..."
- Tooltip z pełną nazwą na hover

### 9.10. Walidacja: Formatowanie relative time

**Komponent:** `RecipeCard`

**Walidacja:**

```typescript
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

const relativeTime = formatDistanceToNow(new Date(recipe.created_at), {
  addSuffix: true,
  locale: pl,
});
```

**Przykłady:**

- "2 dni temu"
- "godzinę temu"
- "miesiąc temu"

**Wpływ na UI:**

- Przyjazna forma wyświetlania daty dodania przepisu

## 10. Obsługa błędów

### 10.1. Błąd sieciowy (Network Error)

**Scenariusz:**
Użytkownik nie ma połączenia z internetem lub API jest niedostępne.

**Handling:**

```typescript
// W useDashboard hook
const { data, error } = useQuery({
  queryKey: ['recipes', 'stats'],
  queryFn: fetchRecipesStats,
  retry: 2, // Retry 2 razy
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});

if (error) {
  // Wyświetlenie ErrorMessage component
  return <ErrorMessage
    title="Nie udało się załadować danych"
    message="Sprawdź połączenie z internetem i spróbuj ponownie."
    onRetry={() => queryClient.refetchQueries(['recipes', 'stats'])}
  />;
}
```

**UI:**

- Error message z ikoną
- Komunikat błędu
- Przycisk "Spróbuj ponownie"
- Opcjonalnie: przycisk "Odśwież stronę"

### 10.2. Błąd autoryzacji (401 Unauthorized)

**Scenariusz:**
Token użytkownika wygasł lub sesja jest nieprawidłowa.

**Handling:**

```typescript
// W query function
const fetchRecipesStats = async () => {
  const response = await fetch("/api/recipes?page=1&limit=1");

  if (response.status === 401) {
    // Redirect do login
    window.location.href = "/login?redirect=/dashboard";
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error("Failed to fetch recipes");
  }

  return response.json();
};
```

**UI:**

- Automatyczne przekierowanie do `/login` z parametrem `redirect=/dashboard`
- Po zalogowaniu → powrót na dashboard

### 10.3. Błąd serwera (500 Internal Server Error)

**Scenariusz:**
Błąd po stronie serwera (np. błąd bazy danych).

**Handling:**

```typescript
// Podobnie jak Network Error
if (error && error.message.includes('500')) {
  return <ErrorMessage
    title="Wystąpił błąd serwera"
    message="Nasz zespół został powiadomiony. Spróbuj ponownie za chwilę."
    onRetry={refetch}
  />;
}
```

**UI:**

- Error message z opisem
- Opcja retry
- Informacja o zgłoszeniu błędu (opcjonalnie integracja z Sentry)

### 10.4. Partial failure (niektóre zapytania się powiodły, inne nie)

**Scenariusz:**
Np. statystyki przepisów załadowały się, ale meal plan nie.

**Handling:**

```typescript
// W DashboardView
if (recipesError) {
  // Pokazujemy 0 w karcie przepisów + warning icon
}

if (mealPlanError) {
  // Pokazujemy 0 w karcie posiłków + warning icon
  // Ale reszta dashboardu działa normalnie
}
```

**UI:**

- Częściowo załadowany dashboard
- Warning icon przy kartach z błędami
- Możliwość retry tylko dla failed queries
- Nie blokujemy całego UI

### 10.5. Empty states (brak danych, ale nie błąd)

**Scenariusz:**
Użytkownik ma 0 przepisów, 0 list zakupów, brak posiłków na dziś/jutro.

**Handling:**

```typescript
// Nowy użytkownik (0 przepisów)
if (stats.recipesCount === 0) {
  return <EmptyState />;
}

// Brak recent recipes (teoretycznie niemożliwe jeśli recipesCount > 0)
if (recentRecipes.length === 0) {
  return <EmptyMessage message="Brak ostatnich przepisów" />;
}

// Brak upcoming meals
if (upcomingMeals.length === 0) {
  return <EmptyMessage message="Brak zaplanowanych posiłków" cta="Zaplanuj tydzień" />;
}
```

**UI:**

- Przyjazne komunikaty
- Jasne CTA prowadzące do rozwiązania (np. "Dodaj przepis", "Zaplanuj tydzień")
- Ilustracje (opcjonalnie)

### 10.6. Slow loading (timeout warnings)

**Scenariusz:**
API odpowiada bardzo wolno (>5s).

**Handling:**

```typescript
// W query config
const { data, isLoading, isFetching } = useQuery({
  queryKey: ["recipes", "stats"],
  queryFn: fetchRecipesStats,
  timeout: 10000, // 10s timeout
});

// Po 3 sekundach pokazujemy hint
React.useEffect(() => {
  if (isLoading || isFetching) {
    const timer = setTimeout(() => {
      toast.info("Ładowanie trwa dłużej niż zwykle...");
    }, 3000);

    return () => clearTimeout(timer);
  }
}, [isLoading, isFetching]);
```

**UI:**

- Skeleton screen podczas ładowania
- Po 3s: toast notification "Ładowanie trwa dłużej niż zwykle..."
- Po 10s: timeout error + retry button

### 10.7. Race conditions

**Scenariusz:**
Użytkownik szybko przełącza się między stronami, zapytania się nakładają.

**Handling:**

```typescript
// TanStack Query automatycznie handluje:
// - Cancel poprzednich zapytań gdy zmienia się queryKey
// - Deduplikacja identycznych zapytań
// - Cache stale/fresh logic

// Nie potrzeba dodatkowego handlera
```

**UI:**

- Brak problemów dzięki TanStack Query

### 10.8. Stale data handling

**Scenariusz:**
Użytkownik dodał przepis w innej zakładce, ale dashboard pokazuje stare dane.

**Handling:**

```typescript
// Konfiguracja refetch on window focus
const { data } = useQuery({
  queryKey: ["recipes", "stats"],
  queryFn: fetchRecipesStats,
  staleTime: 5 * 60 * 1000, // 5 minut
  refetchOnWindowFocus: true, // Refetch gdy wraca do zakładki
});
```

**UI:**

- Dane automatycznie odświeżają się gdy użytkownik wraca do zakładki dashboardu
- Smooth transition (nie ma flickera dzięki cache)

## 11. Kroki implementacji

### Krok 1: Utworzenie struktury plików

Utworzyć następujące pliki:

```
src/
├── pages/
│   └── dashboard.astro
├── components/
│   └── dashboard/
│       ├── DashboardView.tsx
│       ├── DashboardHeader.tsx
│       ├── DashboardSkeleton.tsx
│       ├── EmptyState.tsx
│       ├── StatsSection.tsx
│       ├── StatCard.tsx
│       ├── QuickActionsSection.tsx
│       ├── ActionButton.tsx
│       ├── RecentRecipesSection.tsx
│       ├── RecipeCard.tsx
│       ├── UpcomingMealsSection.tsx
│       └── MealItem.tsx
├── hooks/
│   └── useDashboard.ts
└── lib/
    └── utils/
        ├── date.ts (getCurrentWeekStart, formatRelativeTime, etc.)
        └── text.ts (truncate function)
```

### Krok 2: Dodanie nowych typów do src/types.ts

Dodać następujące typy:

```typescript
export interface DashboardStats {
  recipesCount: number;
  mealPlansCount: number;
  shoppingListsCount: number;
}

export interface UpcomingMealViewModel {
  day: string;
  date: string;
  isoDate: string;
  dayOfWeek: number;
  mealType: MealType;
  mealTypeLabel: string;
  recipeName: string;
  recipeId: string;
  sortOrder: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentRecipes: RecipeListItemDto[];
  upcomingMeals: UpcomingMealViewModel[];
  isNewUser: boolean;
  isLoading: boolean;
  error: Error | null;
}

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Śniadanie",
  second_breakfast: "Drugie śniadanie",
  lunch: "Obiad",
  dinner: "Kolacja",
};

export const MEAL_TYPE_ORDER: Record<MealType, number> = {
  breakfast: 0,
  second_breakfast: 1,
  lunch: 2,
  dinner: 3,
};
```

### Krok 3: Implementacja utility functions

**src/lib/utils/date.ts:**

```typescript
import { format, startOfWeek, getDay } from "date-fns";
import { pl } from "date-fns/locale";

export function getCurrentWeekStart(): string {
  const today = new Date();
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  return format(monday, "yyyy-MM-dd");
}

export function formatRelativeTime(date: string): string {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: pl,
  });
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export function isTomorrow(date: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
}
```

**src/lib/utils/text.ts:**

```typescript
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}
```

### Krok 4: Implementacja custom hook useDashboard

**src/hooks/useDashboard.ts:**
Zgodnie z opisem w sekcji "6. Zarządzanie stanem".

Implementować:

- 4 równoległe zapytania (recipes stats, shopping lists stats, meal plan, recent recipes)
- Obliczanie `DashboardStats`
- Transformacja meal plan assignments → `UpcomingMealViewModel[]`
- Filtrowanie posiłków na dziś i jutro
- Sortowanie chronologiczne
- Agregowanie loading state i errors

### Krok 5: Implementacja komponentów atomowych

**src/components/dashboard/StatCard.tsx:**

- Przyjmuje props: `icon`, `label`, `value`, `href`
- Renderuje Link z ikoną, etykietą i wartością
- Dodaje aria-label dla accessibility
- Stylowanie: card z hover effect, shadow

**src/components/dashboard/RecipeCard.tsx:**

- Przyjmuje props: `recipe: RecipeListItemDto`
- Renderuje Link z nazwą (truncate do 50), badge z liczbą składników, relative time
- Prefetch on hover (TanStack Query)
- Stylowanie: card z hover effect

**src/components/dashboard/MealItem.tsx:**

- Przyjmuje props: `meal: UpcomingMealViewModel`
- Renderuje timeline item z dniem, typem posiłku, nazwą przepisu
- Link do przepisu
- Stylowanie: timeline vertical layout z kropką/linią

**src/components/dashboard/ActionButton.tsx:**

- Przyjmuje props: `icon`, `label`, `description`, `href`, `variant`
- Renderuje Link z ikoną, etykietą główną i opisem
- Stylowanie: button-like card z variant (primary/secondary)

### Krok 6: Implementacja sekcji

**src/components/dashboard/StatsSection.tsx:**

- Przyjmuje props: `stats: DashboardStats`, `isLoading?: boolean`
- Renderuje grid 3 kart StatCard
- Conditional: jeśli `isLoading` → skeleton cards
- Responsive: 3 kolumny desktop, 2 tablet, 1 mobile

**src/components/dashboard/QuickActionsSection.tsx:**

- Renderuje 3 przyciski ActionButton
- Sticky na mobile (position: sticky, bottom: 0)
- Grid layout

**src/components/dashboard/RecentRecipesSection.tsx:**

- Przyjmuje props: `recipes: RecipeListItemDto[]`, `isLoading?: boolean`
- Header z tytułem "Ostatnie przepisy" + link "Zobacz wszystkie"
- Conditional: jeśli `recipes.length === 0` → EmptyMessage
- Grid 3 kart RecipeCard

**src/components/dashboard/UpcomingMealsSection.tsx:**

- Przyjmuje props: `meals: UpcomingMealViewModel[]`, `isLoading?: boolean`
- Header z tytułem "Nadchodzące posiłki" + link "Zobacz kalendarz"
- Conditional: jeśli `meals.length === 0` → EmptyMessage
- Timeline vertical layout z MealItem

### Krok 7: Implementacja EmptyState

**src/components/dashboard/EmptyState.tsx:**

- Ilustracja (SVG lub image)
- Heading "Witaj w ShopMate!"
- Komunikat "Zacznij od dodania pierwszego przepisu"
- Duży przycisk CTA "Dodaj pierwszy przepis" → `/recipes/new`
- Tooltip z hintem "Będziesz mógł przypisać go do kalendarza"
- Feature highlights (3 ikony z opisami)

### Krok 8: Implementacja DashboardSkeleton

**src/components/dashboard/DashboardSkeleton.tsx:**

- Szkielety dla wszystkich sekcji
- Używać komponentu Skeleton z Shadcn/ui
- Matching layout z normalnym dashboardem

### Krok 9: Implementacja głównego kontenera DashboardView

**src/components/dashboard/DashboardView.tsx:**

```typescript
export function DashboardView() {
  const dashboardData = useDashboard();
  const { stats, recentRecipes, upcomingMeals, isNewUser, isLoading, error } = dashboardData;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={() => queryClient.refetchQueries()} />;
  }

  if (isNewUser) {
    return <EmptyState />;
  }

  return (
    <div className="dashboard-container">
      <DashboardHeader />
      <StatsSection stats={stats} />
      <QuickActionsSection />
      <div className="dashboard-content">
        <RecentRecipesSection recipes={recentRecipes} />
        <UpcomingMealsSection meals={upcomingMeals} />
      </div>
    </div>
  );
}
```

### Krok 10: Implementacja strony Astro

**src/pages/dashboard.astro:**

```astro
---
import Layout from "@/layouts/Layout.astro";
import { DashboardView } from "@/components/dashboard/DashboardView";

// Middleware sprawdza auth, więc tu mamy pewność że user jest zalogowany
---

<Layout title="Dashboard - ShopMate">
  <DashboardView client:load />
</Layout>
```

### Krok 11: Dodanie stylów Tailwind

Dla każdego komponentu dodać odpowiednie klasy Tailwind:

- Responsywne layout (grid, flex)
- Spacing (padding, margin)
- Colors (bg, text, border)
- Hover/focus states
- Transitions i animations
- Mobile-first approach

Przykład dla StatCard:

```typescript
<Link
  href={href}
  className="stat-card p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 hover:border-primary-500"
>
  {/* ... */}
</Link>
```

### Krok 12: Konfiguracja middleware dla auth check

**src/middleware/index.ts:**

```typescript
export async function onRequest(context, next) {
  const { pathname } = new URL(context.request.url);

  // Protected routes
  const protectedRoutes = ["/dashboard", "/recipes", "/calendar", "/shopping-lists"];
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected) {
    const supabase = context.locals.supabase;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.redirect(new URL("/login?redirect=" + pathname, context.url));
    }
  }

  return next();
}
```

### Krok 13: Testy jednostkowe dla utility functions

Utworzyć testy dla:

- `getCurrentWeekStart()` - sprawdzenie czy zwraca poniedziałek
- `formatRelativeTime()` - sprawdzenie formatowania
- `truncate()` - sprawdzenie obcinania tekstu
- Transformacje w `useDashboard` (computeUpcomingMeals)

### Krok 14: Testy integracyjne dla useDashboard

Utworzyć testy dla:

- Fetchowanie 4 zapytań równolegle
- Handling loading state
- Handling error state
- Obliczanie stats
- Filtrowanie upcoming meals
- Sortowanie meals chronologicznie

### Krok 15: Testy komponentów

Utworzyć testy dla:

- `StatCard` - renderowanie z różnymi props
- `RecipeCard` - truncate, relative time, link
- `MealItem` - formatowanie dnia, meal type label
- `EmptyState` - renderowanie dla nowego użytkownika
- `DashboardView` - conditional rendering (loading, error, empty, normal)

### Krok 16: Accessibility audit

Sprawdzić:

- Wszystkie interaktywne elementy dostępne z klawiatury
- Odpowiednie aria-labels
- Semantic HTML (article, section, nav)
- Focus indicators
- Color contrast (WCAG AA)
- Screen reader support

Narzędzia:

- axe DevTools
- Lighthouse Accessibility audit
- Keyboard navigation manual test

### Krok 17: Performance optimization

Zoptymalizować:

- Lazy loading dla ilustracji w EmptyState
- Prefetching dla linków (Astro View Transitions)
- Image optimization dla ikon/ilustracji
- Bundle size - code splitting dla dashboard route
- TanStack Query cache configuration (staleTime, cacheTime)

Narzędzia:

- Lighthouse Performance audit
- Bundle analyzer
- Network tab monitoring

### Krok 18: Responsive testing

Przetestować na:

- Desktop (≥1024px)
- Tablet (768-1023px)
- Mobile (320-767px)

Sprawdzić:

- Grid layouts responsywne
- Quick actions sticky na mobile
- Touch targets ≥44px
- Horizontal scroll jeśli potrzebny
- Font sizes czytelne na mobile

### Krok 19: Error handling testing

Symulować błędy:

- Network offline → Network Error handling
- 401 → redirect do login
- 500 → Server Error handling
- Slow API (>5s) → timeout warning
- Partial failures → częściowy dashboard

Sprawdzić:

- Error messages czytelne
- Retry buttons działają
- Redirecty poprawne
- Toasts pokazują się

### Krok 20: Deploy do Vercel i smoke test

Deploy na Vercel:

```bash
npm run build
vercel --prod
```

Smoke test na produkcji:

- Login flow
- Dashboard loading
- Kliknięcie każdego linku/przycisku
- Empty state dla nowego użytkownika
- Stats accuracy
- Responsive na różnych urządzeniach

---

**Koniec planu implementacji widoku Dashboard**
