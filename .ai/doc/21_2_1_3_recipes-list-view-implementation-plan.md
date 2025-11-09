# Plan implementacji widoku Recipes List

## 1. Przegląd

Widok Recipes List jest głównym widokiem przeglądania i zarządzania przepisami użytkownika w aplikacji ShopMate. Umożliwia wyszukiwanie przepisów w czasie rzeczywistym, sortowanie według różnych kryteriów oraz paginację w formie infinite scroll. Widok oferuje responsywny layout dostosowany do różnych urządzeń oraz funkcje takie jak: sticky search bar, filtrowanie URL-based (bookmarkable), oraz szybki dostęp do dodawania nowych przepisów.

Główne funkcjonalności to:
- Wyszukiwanie case-insensitive z debounce 300ms
- Sortowanie (alfabetycznie A-Z/Z-A, najnowsze/najstarsze)
- Infinite scroll z fallback button "Załaduj więcej"
- Empty state dla nowych użytkowników
- Prefetching szczegółów przepisu przy hover
- Sticky CTA "Dodaj przepis" na mobile

## 2. Routing widoku

**Ścieżka:** `/recipes`

**Query Parameters:**
- `search` (optional) - substring wyszukiwania w nazwie przepisu (case-insensitive)
- `sort` (optional) - typ sortowania: `name_asc` | `name_desc` | `created_asc` | `created_desc` (default: `created_desc`)
- `page` (optional, internal) - numer strony dla paginacji (obsługiwane przez infinite scroll)

**Przykłady URL:**
- `/recipes` - wszystkie przepisy, sortowanie najnowsze pierwsze
- `/recipes?search=pasta` - przepisy zawierające "pasta"
- `/recipes?sort=name_asc` - przepisy A-Z
- `/recipes?search=pasta&sort=name_desc` - przepisy z "pasta", Z-A

**Typ:** Strona Astro z dynamicznymi komponentami React

**Zabezpieczenia:**
- Middleware sprawdza autentykację użytkownika
- Brak sesji → przekierowanie do `/login`
- RLS zapewnia dostęp tylko do przepisów zalogowanego użytkownika

## 3. Struktura komponentów

```
src/pages/recipes/index.astro (Astro page)
└── RecipesListView.tsx (React component, client:load)
    ├── RecipesHeader.tsx (sticky top)
    │   ├── SearchBar.tsx
    │   ├── SortDropdown.tsx
    │   └── AddRecipeButton.tsx (floating FAB on mobile)
    ├── RecipesGrid.tsx
    │   ├── RecipeCard.tsx × n
    │   ├── RecipeCardSkeleton.tsx × 20 (loading state)
    │   └── LoadMoreButton.tsx (infinite scroll trigger)
    ├── EmptyState.tsx (conditional, gdy brak przepisów)
    └── ErrorMessage.tsx (conditional, przy błędach API)
```

**Hierarchia:**
1. `index.astro` - główna strona Astro
2. `RecipesListView.tsx` - główny kontener React z zarządzaniem stanem (TanStack Query infinite scroll)
3. `RecipesHeader` - sekcja wyszukiwania i sortowania (sticky)
4. `RecipesGrid` - grid layout z kartami przepisów
5. `RecipeCard` - pojedyncza karta przepisu (reusable component)

## 4. Szczegóły komponentów

### 4.1. RecipesListView (Główny kontener)

**Opis:**
Główny komponent React zarządzający stanem widoku listy przepisów. Odpowiada za synchronizację URL query params z stanem wyszukiwania i sortowania, zarządzanie infinite scroll oraz prefetching danych. Używa custom hooka `useRecipesList` do zarządzania logiką pobierania danych.

**Główne elementy:**
```tsx
<div className="recipes-list-container">
  <RecipesHeader
    search={search}
    sort={sort}
    onSearchChange={handleSearchChange}
    onSortChange={handleSortChange}
    recipesCount={totalRecipes}
  />

  {isLoading && <RecipesGridSkeleton />}

  {error && <ErrorMessage error={error} onRetry={refetch} />}

  {!isLoading && !error && recipes.length === 0 && (
    <EmptyState
      hasSearch={!!search}
      onClearSearch={() => setSearch('')}
    />
  )}

  {!isLoading && !error && recipes.length > 0 && (
    <RecipesGrid
      recipes={recipes}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={fetchNextPage}
    />
  )}
</div>
```

**Obsługiwane interakcje:**
- Zmiana search query → debounce 300ms → update URL → refetch
- Zmiana sort → update URL → refetch
- Scroll do końca listy → infinite scroll trigger → fetchNextPage
- Click "Załaduj więcej" → fetchNextPage

**Obsługiwana walidacja:**
- Search query sanitization (Zod schema)
- Sort validation (only allowed values)
- URL params sync z stanem lokalnym

**Typy:**
- `RecipesListState` (ViewModel)
- `RecipeListQueryParams` (URL params)
- `RecipeListItemDto` (z API)

**Propsy:**
Brak (główny komponent, pobiera params z URL)

### 4.2. RecipesHeader

**Opis:**
Sticky header zawierający search bar, dropdown sortowania oraz licznik wyników. Na desktop jest sticky top, na mobile dodatkowo pojawia się floating action button "Dodaj przepis" w prawym dolnym rogu.

**Główne elementy:**
```tsx
<header className="recipes-header sticky top-0 bg-white z-10 border-b shadow-sm">
  <div className="container mx-auto p-4">
    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
      <div className="flex-1 w-full md:max-w-md">
        <SearchBar
          value={search}
          onChange={onSearchChange}
          placeholder="Szukaj przepisu..."
        />
      </div>

      <div className="flex items-center gap-4">
        {recipesCount > 0 && (
          <span className="text-sm text-gray-600">
            {recipesCount} {recipesCount === 1 ? 'przepis' : 'przepisów'}
          </span>
        )}

        <SortDropdown value={sort} onChange={onSortChange} />

        <AddRecipeButton className="hidden md:inline-flex" />
      </div>
    </div>
  </div>

  {/* Floating Action Button (mobile only) */}
  <AddRecipeButton className="md:hidden fixed bottom-6 right-6 z-20" variant="fab" />
</header>
```

**Obsługiwane interakcje:**
- Input w search bar → debounced onSearchChange (300ms)
- Zmiana w sort dropdown → onSortChange (natychmiastowe)
- Click "Dodaj przepis" → nawigacja do `/recipes/new`

**Obsługiwana walidacja:**
- Search input trim i sanitization
- Sort tylko z dozwolonych wartości

**Typy:**
```typescript
interface RecipesHeaderProps {
  search: string;
  sort: RecipeSortOption;
  onSearchChange: (value: string) => void;
  onSortChange: (value: RecipeSortOption) => void;
  recipesCount: number;
}
```

**Propsy:**
Zgodnie z `RecipesHeaderProps`

### 4.3. SearchBar

**Opis:**
Input wyszukiwania z ikoną lupy i przyciskiem clear (X). Implementuje debounce 300ms dla wydajności. Dostępny z klawiatury i screen readerów.

**Główne elementy:**
```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

  <Input
    type="search"
    value={value}
    onChange={(e) => handleChange(e.target.value)}
    placeholder={placeholder}
    aria-label="Wyszukaj przepisy"
    className="pl-10 pr-10"
  />

  {value && (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => handleChange('')}
      className="absolute right-2 top-1/2 -translate-y-1/2"
      aria-label="Wyczyść wyszukiwanie"
    >
      <X className="h-4 w-4" />
    </Button>
  )}
</div>

{/* Live region dla screen readers */}
<div role="status" aria-live="polite" className="sr-only">
  {isSearching && 'Wyszukiwanie...'}
</div>
```

**Obsługiwane interakcje:**
- Typing → debounce 300ms → trigger onChange
- Click X → clear value → trigger onChange('')
- Escape key → clear value
- Focus → highlight border

**Obsługiwana walidacja:**
- Trim whitespace
- Max length 100 znaków
- Sanitization specjalnych znaków

**Typy:**
```typescript
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}
```

**Propsy:**
Zgodnie z `SearchBarProps`

### 4.4. SortDropdown

**Opis:**
Dropdown (Select) umożliwiający wybór typu sortowania. Wyświetla aktualnie wybraną opcję oraz listę 4 opcji sortowania.

**Główne elementy:**
```tsx
<div className="sort-dropdown">
  <Label htmlFor="sort-select" className="sr-only">
    Sortuj przepisy
  </Label>

  <Select value={value} onValueChange={onChange}>
    <SelectTrigger id="sort-select" className="w-[200px]">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="created_desc">Najnowsze</SelectItem>
      <SelectItem value="created_asc">Najstarsze</SelectItem>
      <SelectItem value="name_asc">Alfabetycznie A-Z</SelectItem>
      <SelectItem value="name_desc">Alfabetycznie Z-A</SelectItem>
    </SelectContent>
  </Select>
</div>
```

**Obsługiwane interakcje:**
- Click → otwiera dropdown
- Select option → trigger onChange → zamyka dropdown
- Keyboard navigation (Arrow Up/Down, Enter, Escape)

**Obsługiwana walidacja:**
- Tylko dozwolone wartości sort options

**Typy:**
```typescript
type RecipeSortOption = "name_asc" | "name_desc" | "created_asc" | "created_desc";

interface SortDropdownProps {
  value: RecipeSortOption;
  onChange: (value: RecipeSortOption) => void;
}
```

**Propsy:**
Zgodnie z `SortDropdownProps`

### 4.5. AddRecipeButton

**Opis:**
Przycisk "Dodaj przepis" wyświetlany w dwóch wariantach: normalny button (desktop) i floating action button (mobile sticky bottom-right).

**Główne elementy:**
```tsx
<Link href="/recipes/new">
  <Button
    variant={variant === 'fab' ? 'default' : 'primary'}
    size={variant === 'fab' ? 'lg' : 'default'}
    className={cn(
      variant === 'fab' && 'rounded-full w-14 h-14 shadow-lg',
      className
    )}
    aria-label="Dodaj nowy przepis"
  >
    {variant === 'fab' ? (
      <Plus className="h-6 w-6" />
    ) : (
      <>
        <Plus className="h-4 w-4 mr-2" />
        Dodaj przepis
      </>
    )}
  </Button>
</Link>
```

**Obsługiwane interakcje:**
- Click → nawigacja do `/recipes/new`
- Hover → visual feedback (shadow increase)
- Focus → keyboard accessible

**Obsługiwana walidacja:**
Brak

**Typy:**
```typescript
interface AddRecipeButtonProps {
  variant?: 'normal' | 'fab';
  className?: string;
}
```

**Propsy:**
Zgodnie z `AddRecipeButtonProps`

### 4.6. RecipesGrid

**Opis:**
Grid container wyświetlający karty przepisów w responsywnym układzie. Obsługuje infinite scroll z Intersection Observer API oraz fallback button "Załaduj więcej".

**Główne elementy:**
```tsx
<div className="recipes-grid">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {recipes.map((recipe) => (
      <RecipeCard key={recipe.id} recipe={recipe} />
    ))}
  </div>

  {/* Infinite scroll sentinel */}
  {hasNextPage && (
    <div ref={sentinelRef} className="py-8 flex justify-center">
      {isFetchingNextPage ? (
        <div className="flex items-center gap-2 text-gray-600">
          <Spinner className="h-5 w-5" />
          <span>Ładowanie...</span>
        </div>
      ) : (
        <Button
          onClick={onLoadMore}
          variant="outline"
          aria-label="Załaduj więcej przepisów"
        >
          Załaduj więcej
        </Button>
      )}
    </div>
  )}

  {/* Live region dla screen readers */}
  <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
    {isFetchingNextPage && 'Ładowanie kolejnych przepisów'}
    {!hasNextPage && recipes.length > 0 && 'Załadowano wszystkie przepisy'}
  </div>
</div>
```

**Obsługiwane interakcje:**
- Scroll do sentinela → auto-trigger fetchNextPage
- Click "Załaduj więcej" → manual trigger fetchNextPage
- Hover na RecipeCard → prefetch recipe details

**Obsługiwana walidacja:**
- Sprawdzenie `hasNextPage` przed fetchNextPage
- Deduplikacja requests (TanStack Query)

**Typy:**
```typescript
interface RecipesGridProps {
  recipes: RecipeListItemDto[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}
```

**Propsy:**
Zgodnie z `RecipesGridProps`

### 4.7. RecipeCard

**Opis:**
Karta pojedynczego przepisu wyświetlająca nazwę (truncate 50 znaków), liczbę składników (badge), datę dodania (relative time). Karta jest kliklalna i prowadzi do szczegółów przepisu. Implementuje prefetching przy hover.

**Główne elementy:**
```tsx
<Link
  href={`/recipes/${recipe.id}`}
  onMouseEnter={() => prefetchRecipe(recipe.id)}
  className="recipe-card block"
>
  <article className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-white">
    <h3 className="text-lg font-semibold text-gray-900 mb-2" title={recipe.name}>
      {truncate(recipe.name, 50)}
    </h3>

    <div className="flex items-center gap-3 text-sm text-gray-600">
      <Badge variant="secondary" className="flex items-center gap-1">
        <ChefHat className="h-3 w-3" />
        {recipe.ingredients_count} składników
      </Badge>

      <time dateTime={recipe.created_at} className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
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
- Truncate name do 50 znaków z "..." jeśli dłuższe
- Full name w tooltip (title attribute)

**Typy:**
- `RecipeListItemDto`

**Propsy:**
```typescript
interface RecipeCardProps {
  recipe: RecipeListItemDto;
}
```

### 4.8. RecipeCardSkeleton

**Opis:**
Skeleton loader wyświetlany podczas ładowania przepisów. Matching layout z `RecipeCard`.

**Główne elementy:**
```tsx
<div className="recipe-card-skeleton border rounded-lg p-6 bg-white">
  <Skeleton className="h-6 w-3/4 mb-2" />
  <div className="flex items-center gap-3">
    <Skeleton className="h-5 w-24" />
    <Skeleton className="h-5 w-20" />
  </div>
</div>
```

**Obsługiwane interakcje:**
Brak (komponent statyczny)

**Obsługiwana walidacja:**
Brak

**Typy:**
Brak props

**Propsy:**
Brak

### 4.9. RecipesGridSkeleton

**Opis:**
Grid szkieletów wyświetlany przy pierwszym ładowaniu listy przepisów (przed pobraniem danych).

**Główne elementy:**
```tsx
<div className="recipes-grid-skeleton">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: 20 }).map((_, index) => (
      <RecipeCardSkeleton key={index} />
    ))}
  </div>
</div>
```

**Obsługiwane interakcje:**
Brak

**Obsługiwana walidacja:**
Brak

**Typy:**
Brak

**Propsy:**
Brak

### 4.10. LoadMoreButton

**Opis:**
Przycisk fallback dla infinite scroll. Wyświetlany gdy Intersection Observer nie jest dostępny lub użytkownik woli manualne ładowanie.

**Główne elementy:**
```tsx
<div className="load-more-container py-8 flex justify-center">
  <Button
    onClick={onLoadMore}
    disabled={isLoading}
    variant="outline"
    size="lg"
  >
    {isLoading ? (
      <>
        <Spinner className="h-4 w-4 mr-2" />
        Ładowanie...
      </>
    ) : (
      <>
        Załaduj więcej
        <ChevronDown className="h-4 w-4 ml-2" />
      </>
    )}
  </Button>
</div>
```

**Obsługiwane interakcje:**
- Click → onLoadMore()
- Disabled gdy isLoading

**Obsługiwana walidacja:**
- Disabled state podczas ładowania

**Typy:**
```typescript
interface LoadMoreButtonProps {
  onLoadMore: () => void;
  isLoading: boolean;
}
```

**Propsy:**
Zgodnie z `LoadMoreButtonProps`

### 4.11. EmptyState

**Opis:**
Wyświetlany gdy brak przepisów do pokazania. Dwa warianty: empty search results (po wyszukiwaniu) i no recipes at all (nowy użytkownik).

**Główne elementy:**
```tsx
<div className="empty-state py-16 text-center">
  <div className="max-w-md mx-auto">
    {hasSearch ? (
      <>
        <SearchX className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Brak wyników wyszukiwania
        </h2>
        <p className="text-gray-600 mb-6">
          Nie znaleziono przepisów pasujących do "{search}"
        </p>
        <Button onClick={onClearSearch} variant="outline">
          Wyczyść wyszukiwanie
        </Button>
      </>
    ) : (
      <>
        <ChefHat className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Brak przepisów
        </h2>
        <p className="text-gray-600 mb-6">
          Dodaj pierwszy przepis, aby rozpocząć planowanie posiłków
        </p>
        <Button asChild size="lg">
          <Link href="/recipes/new">
            <Plus className="h-4 w-4 mr-2" />
            Dodaj pierwszy przepis
          </Link>
        </Button>
      </>
    )}
  </div>
</div>
```

**Obsługiwane interakcje:**
- Click "Wyczyść wyszukiwanie" → onClearSearch()
- Click "Dodaj pierwszy przepis" → nawigacja do `/recipes/new`

**Obsługiwana walidacja:**
- Conditional rendering based on `hasSearch`

**Typy:**
```typescript
interface EmptyStateProps {
  hasSearch: boolean;
  search?: string;
  onClearSearch?: () => void;
}
```

**Propsy:**
Zgodnie z `EmptyStateProps`

### 4.12. ErrorMessage

**Opis:**
Wyświetlany przy błędach API. Pokazuje komunikat błędu i przycisk retry.

**Główne elementy:**
```tsx
<div className="error-message py-16 text-center">
  <div className="max-w-md mx-auto">
    <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
      Wystąpił błąd
    </h2>
    <p className="text-gray-600 mb-6">
      {error.message || 'Nie udało się załadować przepisów'}
    </p>
    <Button onClick={onRetry} variant="outline">
      <RefreshCw className="h-4 w-4 mr-2" />
      Spróbuj ponownie
    </Button>
  </div>
</div>
```

**Obsługiwane interakcje:**
- Click "Spróbuj ponownie" → onRetry()

**Obsługiwana walidacja:**
Brak

**Typy:**
```typescript
interface ErrorMessageProps {
  error: Error;
  onRetry: () => void;
}
```

**Propsy:**
Zgodnie z `ErrorMessageProps`

## 5. Typy

### 5.1. Istniejące typy (z src/types.ts)

```typescript
// Używane w Recipes List
export interface RecipeListItemDto {
  id: string;
  name: string;
  ingredients_count: number;
  created_at: string;
  updated_at: string;
}

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

export interface RecipeListQueryParams extends PaginationParams {
  search?: string;
  sort?: "name_asc" | "name_desc" | "created_asc" | "created_desc";
}
```

### 5.2. Nowe typy ViewModel (do utworzenia)

```typescript
/**
 * Opcje sortowania dla listy przepisów
 */
export type RecipeSortOption = "name_asc" | "name_desc" | "created_asc" | "created_desc";

/**
 * Labels dla opcji sortowania (UI)
 */
export const RECIPE_SORT_LABELS: Record<RecipeSortOption, string> = {
  name_asc: "Alfabetycznie A-Z",
  name_desc: "Alfabetycznie Z-A",
  created_asc: "Najstarsze",
  created_desc: "Najnowsze",
};

/**
 * Stan URL query params dla Recipes List
 */
export interface RecipesListUrlParams {
  search?: string;
  sort?: RecipeSortOption;
}

/**
 * Stan wewnętrzny widoku Recipes List
 */
export interface RecipesListState {
  /** Fraza wyszukiwania */
  search: string;
  /** Typ sortowania */
  sort: RecipeSortOption;
  /** Całkowita liczba przepisów (z pagination) */
  totalRecipes: number;
  /** Płaska lista przepisów ze wszystkich stron */
  recipes: RecipeListItemDto[];
  /** Czy są kolejne strony do załadowania */
  hasNextPage: boolean;
  /** Czy trwa ładowanie pierwszej strony */
  isLoading: boolean;
  /** Czy trwa ładowanie kolejnej strony */
  isFetchingNextPage: boolean;
  /** Błąd jeśli wystąpił */
  error: Error | null;
}

/**
 * Response dla infinite query
 */
export interface RecipesPageResponse {
  data: RecipeListItemDto[];
  pagination: PaginationMetadata;
  nextPage: number | undefined;
}
```

### 5.3. Validation schemas (Zod)

```typescript
import { z } from 'zod';

/**
 * Schema walidacji URL query params
 */
export const recipesListParamsSchema = z.object({
  search: z.string().trim().max(100).optional(),
  sort: z.enum(['name_asc', 'name_desc', 'created_asc', 'created_desc']).optional(),
});

export type RecipesListParamsInput = z.input<typeof recipesListParamsSchema>;
export type RecipesListParamsOutput = z.output<typeof recipesListParamsSchema>;
```

## 6. Zarządzanie stanem

### 6.1. Custom Hook: `useRecipesList`

Widok Recipes List używa dedykowanego custom hooka zarządzającego stanem wyszukiwania, sortowania oraz infinite scroll.

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router'; // lub Astro equivalent
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { RecipesListState, RecipeSortOption } from '@/types';

const RECIPES_PER_PAGE = 20;

export function useRecipesList() {
  const router = useRouter();

  // Parse URL params
  const searchParam = (router.query.search as string) || '';
  const sortParam = (router.query.sort as RecipeSortOption) || 'created_desc';

  // Local state dla search (przed debounce)
  const [searchInput, setSearchInput] = React.useState(searchParam);

  // Debounced search value (300ms)
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  // Sync debounced search z URL
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (sortParam !== 'created_desc') params.set('sort', sortParam);

    const newUrl = params.toString() ? `/recipes?${params.toString()}` : '/recipes';
    router.replace(newUrl, undefined, { shallow: true });
  }, [debouncedSearch, sortParam]);

  // Infinite query dla przepisów
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['recipes', 'list', debouncedSearch, sortParam],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        limit: String(RECIPES_PER_PAGE),
        sort: sortParam,
      });

      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      }

      const response = await fetch(`/api/recipes?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }

      const result: PaginatedResponse<RecipeListItemDto> = await response.json();

      return {
        data: result.data,
        pagination: result.pagination,
        nextPage: result.pagination.page < result.pagination.total_pages
          ? result.pagination.page + 1
          : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 2 * 60 * 1000, // 2 minuty
    keepPreviousData: true, // Smooth transition przy zmianie search/sort
  });

  // Flatten pages do pojedynczej listy
  const recipes = React.useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  );

  // Total count z pierwszej strony
  const totalRecipes = data?.pages[0]?.pagination.total ?? 0;

  // Handlers
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleSortChange = (value: RecipeSortOption) => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    params.set('sort', value);

    router.push(`/recipes?${params.toString()}`, undefined, { shallow: true });
  };

  return {
    // State
    search: searchInput,
    sort: sortParam,
    recipes,
    totalRecipes,
    hasNextPage: hasNextPage ?? false,
    isLoading,
    isFetchingNextPage,
    error: error as Error | null,

    // Handlers
    handleSearchChange,
    handleSortChange,
    fetchNextPage,
    refetch,
  } as RecipesListState & {
    handleSearchChange: (value: string) => void;
    handleSortChange: (value: RecipeSortOption) => void;
    fetchNextPage: () => void;
    refetch: () => void;
  };
}
```

### 6.2. Custom Hook: `useDebouncedValue`

Utility hook dla debounce search input.

```typescript
import React from 'react';

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### 6.3. Infinite Scroll Implementation

Używamy Intersection Observer API do wykrywania scrollowania do końca listy.

```typescript
// W RecipesGrid component
import { useInView } from 'react-intersection-observer';

export function RecipesGrid({ recipes, hasNextPage, isFetchingNextPage, onLoadMore }: RecipesGridProps) {
  const { ref: sentinelRef, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  // Auto-trigger fetchNextPage gdy sentinel jest w viewporcie
  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      onLoadMore();
    }
  }, [inView, hasNextPage, isFetchingNextPage, onLoadMore]);

  // ... rest of component
}
```

### 6.4. Prefetching recipe details

Przy hover na `RecipeCard` prefetchujemy szczegóły przepisu dla lepszego UX.

```typescript
// W RecipeCard component
import { useQueryClient } from '@tanstack/react-query';

export function RecipeCard({ recipe }: RecipeCardProps) {
  const queryClient = useQueryClient();

  const prefetchRecipe = () => {
    queryClient.prefetchQuery({
      queryKey: ['recipe', recipe.id],
      queryFn: async () => {
        const response = await fetch(`/api/recipes/${recipe.id}`);
        if (!response.ok) throw new Error('Failed to fetch recipe');
        return response.json();
      },
      staleTime: 10 * 60 * 1000, // 10 minut
    });
  };

  return (
    <Link href={`/recipes/${recipe.id}`} onMouseEnter={prefetchRecipe}>
      {/* ... */}
    </Link>
  );
}
```

## 7. Integracja API

### 7.1. Endpoint: GET /api/recipes

**Request:**
```
GET /api/recipes?search=pasta&sort=name_asc&page=1&limit=20
```

**Query Parameters:**
- `search` (optional): Case-insensitive substring match on recipe name
- `sort` (optional): `name_asc` | `name_desc` | `created_asc` | `created_desc` (default: `created_desc`)
- `page` (required for pagination): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response (200 OK):**
```typescript
PaginatedResponse<RecipeListItemDto>
{
  data: [
    {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Spaghetti Carbonara",
      ingredients_count: 5,
      created_at: "2025-01-26T10:00:00Z",
      updated_at: "2025-01-26T10:00:00Z"
    },
    // ... more recipes
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 45,
    total_pages: 3
  }
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "You must be logged in to view recipes"
}
```
→ Redirect do `/login`

**400 Bad Request:**
```json
{
  "error": "Validation error",
  "message": "Invalid query parameters"
}
```
→ Show error message

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "message": "Failed to fetch recipes"
}
```
→ Show error message z retry button

### 7.2. TanStack Query Configuration

```typescript
// Query client config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 0,
      refetchOnWindowFocus: true,
    },
  },
});

// Specific config for recipes list infinite query
useInfiniteQuery({
  queryKey: ['recipes', 'list', search, sort],
  queryFn: fetchRecipesPage,
  getNextPageParam: (lastPage) => lastPage.nextPage,
  staleTime: 2 * 60 * 1000, // 2 minutes
  keepPreviousData: true, // Smooth transition
});
```

## 8. Interakcje użytkownika

### 8.1. Wyszukiwanie przepisów

**Akcja użytkownika:**
- Użytkownik wpisuje "pasta" w search bar

**Przepływ:**
1. Input value → `searchInput` state update
2. Debounce 300ms
3. `debouncedSearch` update → URL update `/recipes?search=pasta`
4. TanStack Query wykrywa zmianę `queryKey`
5. Automatyczny refetch z nowym parametrem search
6. Wyświetlanie skeleton cards podczas ładowania
7. Renderowanie wyników lub empty state

**Warunki:**
- Jeśli `search.length === 0` → pokazanie wszystkich przepisów
- Jeśli wyniki puste → EmptyState z komunikatem "Brak wyników" + przycisk clear
- Live region update dla screen readers

### 8.2. Zmiana sortowania

**Akcja użytkownika:**
- Użytkownik wybiera "Alfabetycznie A-Z" z dropdown

**Przepływ:**
1. Select onChange → `handleSortChange('name_asc')`
2. URL update `/recipes?search=pasta&sort=name_asc`
3. TanStack Query refetch z nowym sort param
4. Skeleton cards (opcjonalnie, jeśli `keepPreviousData: false`)
5. Renderowanie posortowanych wyników

**Warunki:**
- Sort persystuje w URL (bookmarkable)
- Default sort: `created_desc`

### 8.3. Infinite scroll

**Akcja użytkownika:**
- Użytkownik scrolluje listę do końca (sentinel w viewport)

**Przepływ:**
1. Intersection Observer wykrywa sentinel w viewport
2. `useEffect` trigger → `fetchNextPage()`
3. TanStack Query fetchuje kolejną stronę (page=2)
4. Spinner pod listą podczas fetch
5. Nowe przepisy appendowane do listy (smooth, bez flickera)
6. Live region update: "Załadowano kolejne przepisy"

**Warunki:**
- `hasNextPage === true` → enable infinite scroll
- `hasNextPage === false` → hide sentinel, show komunikat "Załadowano wszystkie przepisy"
- `isFetchingNextPage === true` → show spinner zamiast przycisku

### 8.4. Click "Załaduj więcej" (fallback)

**Akcja użytkownika:**
- Użytkownik klika przycisk "Załaduj więcej"

**Przepływ:**
1. onClick → `fetchNextPage()`
2. Button disabled state + spinner
3. Fetch kolejnej strony
4. Append do listy
5. Button z powrotem enabled (jeśli hasNextPage)

**Warunki:**
- Przycisk disabled podczas `isFetchingNextPage`
- Przycisk ukryty gdy `!hasNextPage`

### 8.5. Click karty przepisu

**Akcja użytkownika:**
- Użytkownik klika kartę "Spaghetti Carbonara"

**Przepływ:**
1. Hover → prefetch recipe details (TanStack Query)
2. Click → nawigacja do `/recipes/{id}`
3. Recipe details page (dane już w cache dzięki prefetch → instant load)

**Warunki:**
- Prefetch tylko na desktop (hover)
- Na mobile brak prefetch (tap)

### 8.6. Wyczyść wyszukiwanie (empty state)

**Akcja użytkownika:**
- Brak wyników wyszukiwania, użytkownik klika "Wyczyść wyszukiwanie"

**Przepływ:**
1. onClick → `handleSearchChange('')`
2. `searchInput` update → `''`
3. Debounce → `debouncedSearch` → `''`
4. URL update `/recipes` (bez search param)
5. Refetch wszystkich przepisów
6. Renderowanie pełnej listy

**Warunki:**
- Przycisk widoczny tylko w EmptyState z `hasSearch === true`

### 8.7. Dodaj pierwszy przepis (empty state)

**Akcja użytkownika:**
- Nowy użytkownik (0 przepisów) klika "Dodaj pierwszy przepis"

**Przepływ:**
1. Click → nawigacja do `/recipes/new`
2. Formularz dodawania przepisu

**Warunki:**
- EmptyState variant "no recipes" tylko gdy `recipes.length === 0 && !search`

### 8.8. Click X w search bar

**Akcja użytkownika:**
- Użytkownik klika X w search bar

**Przepływ:**
1. onClick → `handleSearchChange('')`
2. Clear search input
3. Clear URL search param
4. Refetch all recipes

**Warunki:**
- X button widoczny tylko gdy `search.length > 0`

## 9. Warunki i walidacja

### 9.1. Warunek: Empty state variants

**Komponent:** `RecipesListView`

**Warunki:**
```typescript
if (!isLoading && !error && recipes.length === 0) {
  if (search) {
    // Empty search results
    return <EmptyState hasSearch={true} search={search} onClearSearch={...} />;
  } else {
    // No recipes at all
    return <EmptyState hasSearch={false} />;
  }
}
```

**Wpływ na UI:**
- `hasSearch === true` → EmptyState z "Brak wyników" + przycisk clear
- `hasSearch === false` → EmptyState z "Brak przepisów" + CTA "Dodaj pierwszy przepis"

### 9.2. Warunek: Loading states

**Komponent:** `RecipesListView`

**Warunki:**
```typescript
// First load
if (isLoading && recipes.length === 0) {
  return <RecipesGridSkeleton />;
}

// Loading next page
if (isFetchingNextPage) {
  // Show spinner below existing recipes
}
```

**Wpływ na UI:**
- First load → full grid skeleton (20 cards)
- Next page → spinner below recipes, existing recipes remain visible

### 9.3. Warunek: Infinite scroll trigger

**Komponent:** `RecipesGrid`

**Warunek:**
```typescript
if (inView && hasNextPage && !isFetchingNextPage) {
  onLoadMore();
}
```

**Wpływ na UI:**
- Sentinel w viewport + są kolejne strony + nie trwa fetch → auto-trigger fetchNextPage

### 9.4. Warunek: Show/hide sentinel

**Komponent:** `RecipesGrid`

**Warunek:**
```typescript
{hasNextPage && (
  <div ref={sentinelRef}>
    {/* Sentinel content */}
  </div>
)}
```

**Wpływ na UI:**
- `hasNextPage === true` → sentinel visible
- `hasNextPage === false` → sentinel hidden, komunikat "Załadowano wszystkie przepisy"

### 9.5. Walidacja: Search query

**Lokalizacja:** `handleSearchChange`, `recipesListParamsSchema`

**Walidacja:**
```typescript
const sanitizedSearch = searchInput.trim().slice(0, 100);
```

**Warunki:**
- Trim whitespace
- Max 100 znaków
- Case-insensitive matching (server-side)

### 9.6. Walidacja: Sort parameter

**Lokalizacja:** `useRecipesList`, URL params parsing

**Walidacja:**
```typescript
const sortParam = ['name_asc', 'name_desc', 'created_asc', 'created_desc'].includes(
  router.query.sort as string
)
  ? (router.query.sort as RecipeSortOption)
  : 'created_desc';
```

**Warunki:**
- Tylko dozwolone wartości
- Fallback do 'created_desc' jeśli invalid

### 9.7. Warunek: Error handling

**Komponent:** `RecipesListView`

**Warunek:**
```typescript
if (error) {
  return <ErrorMessage error={error} onRetry={refetch} />;
}
```

**Wpływ na UI:**
- Błąd API → ErrorMessage z retry button
- 401 → redirect do login (handled w query function)

### 9.8. Warunek: Truncate recipe name

**Komponent:** `RecipeCard`

**Walidacja:**
```typescript
const displayName = recipe.name.length > 50
  ? recipe.name.slice(0, 50) + '...'
  : recipe.name;
```

**Wpływ na UI:**
- Nazwa ≤ 50 znaków → pełna nazwa
- Nazwa > 50 znaków → truncate + "..."
- Full name w title attribute (tooltip)

### 9.9. Warunek: Show recipe count

**Komponent:** `RecipesHeader`

**Warunek:**
```typescript
{recipesCount > 0 && (
  <span>{recipesCount} {recipesCount === 1 ? 'przepis' : 'przepisów'}</span>
)}
```

**Wpływ na UI:**
- `recipesCount > 0` → pokazanie licznika
- Proper pluralization (1 przepis, 2-4 przepisy, 5+ przepisów)

### 9.10. Warunek: Debounce search

**Komponent:** `useRecipesList`

**Warunek:**
```typescript
const debouncedSearch = useDebouncedValue(searchInput, 300);
```

**Wpływ na UI:**
- User typing → nie ma natychmiastowych requests
- 300ms po ostatnim keystroke → trigger refetch
- Lepsza wydajność, mniej requestów

## 10. Obsługa błędów

### 10.1. Błąd sieciowy (Network Error)

**Scenariusz:**
Użytkownik nie ma połączenia z internetem lub API jest niedostępne.

**Handling:**
```typescript
const { data, error } = useInfiniteQuery({
  queryKey: ['recipes', 'list', search, sort],
  queryFn: fetchRecipesPage,
  retry: 2,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});

if (error) {
  return <ErrorMessage
    error={error}
    onRetry={() => refetch()}
  />;
}
```

**UI:**
- Error message: "Nie udało się załadować przepisów"
- Opis: "Sprawdź połączenie z internetem i spróbuj ponownie"
- Przycisk "Spróbuj ponownie" → refetch()

### 10.2. Błąd autoryzacji (401 Unauthorized)

**Scenariusz:**
Token użytkownika wygasł lub sesja jest nieprawidłowa.

**Handling:**
```typescript
const fetchRecipesPage = async ({ pageParam = 1 }) => {
  const response = await fetch(`/api/recipes?page=${pageParam}&...`);

  if (response.status === 401) {
    window.location.href = '/login?redirect=/recipes';
    throw new Error('Unauthorized');
  }

  // ...
};
```

**UI:**
- Automatyczne przekierowanie do `/login` z redirect param
- Po zalogowaniu → powrót na `/recipes`

### 10.3. Błąd walidacji (400 Bad Request)

**Scenariusz:**
Nieprawidłowe query parameters (np. invalid sort value).

**Handling:**
```typescript
if (response.status === 400) {
  // Fallback do default params
  const params = new URLSearchParams({ sort: 'created_desc' });
  router.replace(`/recipes?${params.toString()}`);
  throw new Error('Invalid parameters');
}
```

**UI:**
- Reset params do defaults
- Optional toast: "Nieprawidłowe parametry, zresetowano do domyślnych"

### 10.4. Empty search results (nie błąd, ale edge case)

**Scenariusz:**
Użytkownik wyszukuje "xyz", brak wyników.

**Handling:**
```typescript
if (!isLoading && !error && recipes.length === 0 && search) {
  return <EmptyState
    hasSearch={true}
    search={search}
    onClearSearch={() => setSearchInput('')}
  />;
}
```

**UI:**
- EmptyState z ikoną SearchX
- Komunikat: "Brak wyników wyszukiwania dla '{search}'"
- Przycisk "Wyczyść wyszukiwanie"

### 10.5. Slow API response (timeout warning)

**Scenariusz:**
API odpowiada bardzo wolno (>3s).

**Handling:**
```typescript
React.useEffect(() => {
  if (isLoading || isFetchingNextPage) {
    const timer = setTimeout(() => {
      toast.info('Ładowanie trwa dłużej niż zwykle...');
    }, 3000);

    return () => clearTimeout(timer);
  }
}, [isLoading, isFetchingNextPage]);
```

**UI:**
- Po 3s ładowania → toast "Ładowanie trwa dłużej niż zwykle..."
- Nie blokuje UI
- Dane eventually się załadują

### 10.6. Partial page load failure

**Scenariusz:**
Pierwsza strona załadowana OK, ale następna strona (fetchNextPage) zwraca błąd.

**Handling:**
```typescript
// TanStack Query automatically handles:
// - Previous data remains visible
// - Error for specific page is isolated

if (error && recipes.length > 0) {
  // Show toast instead of full error screen
  toast.error('Nie udało się załadować kolejnych przepisów');
  // Existing recipes remain visible
}
```

**UI:**
- Istniejące przepisy pozostają widoczne
- Toast z błędem dla next page
- Retry button w sentinel area

### 10.7. Race conditions (rapid search changes)

**Scenariusz:**
Użytkownik szybko zmienia search query ("a" → "ab" → "abc").

**Handling:**
```typescript
// TanStack Query automatically:
// - Cancels previous requests when queryKey changes
// - Shows latest results
// - Handles deduplication

// Debounce dodatkowo redukuje liczbę requestów
const debouncedSearch = useDebouncedValue(searchInput, 300);
```

**UI:**
- Debounce zapobiega zbyt wielu requestom
- TanStack Query canceluje stale requests
- Użytkownik widzi wyniki dla finalnego query

### 10.8. Intersection Observer not supported

**Scenariusz:**
Starsza przeglądarka bez wsparcia dla Intersection Observer.

**Handling:**
```typescript
// react-intersection-observer ma polyfill
// lub fallback do manual button

{hasNextPage && (
  <div ref={sentinelRef}>
    <Button onClick={onLoadMore}>
      Załaduj więcej
    </Button>
  </div>
)}
```

**UI:**
- Fallback do manual button "Załaduj więcej"
- Infinite scroll działa gdy Intersection Observer available

### 10.9. Prefetch failure

**Scenariusz:**
Prefetch recipe details przy hover zwraca błąd.

**Handling:**
```typescript
const prefetchRecipe = () => {
  queryClient.prefetchQuery({
    queryKey: ['recipe', recipe.id],
    queryFn: fetchRecipeDetails,
  }).catch(() => {
    // Silent fail - nie pokazujemy błędu
    // Dane będą fetchowane przy nawigacji
  });
};
```

**UI:**
- Prefetch failure nie wpływa na UX
- Dane będą fetchowane przy rzeczywistej nawigacji

## 11. Kroki implementacji

### Krok 1: Utworzenie struktury plików

Utworzyć następujące pliki:
```
src/
├── pages/
│   └── recipes/
│       └── index.astro
├── components/
│   └── recipes/
│       ├── RecipesListView.tsx
│       ├── RecipesHeader.tsx
│       ├── SearchBar.tsx
│       ├── SortDropdown.tsx
│       ├── AddRecipeButton.tsx
│       ├── RecipesGrid.tsx
│       ├── RecipeCard.tsx
│       ├── RecipeCardSkeleton.tsx
│       ├── RecipesGridSkeleton.tsx
│       ├── LoadMoreButton.tsx
│       ├── EmptyState.tsx
│       └── ErrorMessage.tsx (shared component, może być w components/common/)
├── hooks/
│   ├── useRecipesList.ts
│   └── useDebouncedValue.ts
└── lib/
    └── utils/
        ├── text.ts (truncate function)
        └── date.ts (formatRelativeTime)
```

### Krok 2: Dodanie nowych typów do src/types.ts

Dodać typy zgodnie z sekcją "5. Typy":
- `RecipeSortOption`
- `RECIPE_SORT_LABELS`
- `RecipesListUrlParams`
- `RecipesListState`
- `RecipesPageResponse`
- `recipesListParamsSchema` (Zod)

### Krok 3: Implementacja utility hooks

**src/hooks/useDebouncedValue.ts:**
```typescript
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

### Krok 4: Implementacja custom hook useRecipesList

**src/hooks/useRecipesList.ts:**
Zgodnie z opisem w sekcji "6. Zarządzanie stanem".

Implementować:
- Parse URL params (search, sort)
- Local state `searchInput` + debounce do `debouncedSearch`
- Sync `debouncedSearch` z URL
- `useInfiniteQuery` z fetchRecipesPage
- Flatten pages do `recipes` array
- Extract `totalRecipes` z pierwszej strony
- Handlers: `handleSearchChange`, `handleSortChange`

### Krok 5: Implementacja komponentów atomowych

**src/components/recipes/SearchBar.tsx:**
- Input z ikoną Search (left)
- Przycisk X (right, conditional)
- Debounce już w parent (useRecipesList), SearchBar jest controlled component
- aria-label dla accessibility
- Live region dla screen readers

**src/components/recipes/SortDropdown.tsx:**
- Shadcn/ui Select component
- 4 opcje: Najnowsze, Najstarsze, A-Z, Z-A
- Label "Sortuj przepisy" (sr-only lub visible)
- onChange → parent handler

**src/components/recipes/AddRecipeButton.tsx:**
- Dwa warianty: normal (desktop), FAB (mobile)
- Link do `/recipes/new`
- Icon Plus
- Conditional className based on variant

**src/components/recipes/RecipeCard.tsx:**
- Link z onMouseEnter prefetch
- Truncate name do 50 znaków
- Badge z liczbą składników
- Relative time (formatRelativeTime)
- Hover effect (shadow)

**src/components/recipes/RecipeCardSkeleton.tsx:**
- Skeleton matching RecipeCard layout
- Używa Shadcn/ui Skeleton component

**src/components/recipes/LoadMoreButton.tsx:**
- Button "Załaduj więcej"
- Disabled podczas loading
- Icon ChevronDown lub Spinner
- onClick → onLoadMore prop

### Krok 6: Implementacja sekcji

**src/components/recipes/RecipesHeader.tsx:**
- Sticky top layout
- Flex/grid responsywny (column mobile, row desktop)
- SearchBar + SortDropdown + AddRecipeButton (desktop)
- Floating AddRecipeButton (mobile, fixed bottom-right)
- Recipe count display

**src/components/recipes/RecipesGrid.tsx:**
- Grid layout: 1 col mobile, 2 tablet, 3 desktop
- Map recipes → RecipeCard
- Intersection Observer sentinel (useInView from react-intersection-observer)
- Auto-trigger fetchNextPage on sentinel inView
- Fallback LoadMoreButton
- Live region dla screen readers

**src/components/recipes/RecipesGridSkeleton.tsx:**
- Grid z 20 RecipeCardSkeleton
- Matching layout z RecipesGrid

### Krok 7: Implementacja EmptyState

**src/components/recipes/EmptyState.tsx:**
- Conditional rendering based on `hasSearch`
- Variant 1 (hasSearch=true): "Brak wyników", SearchX icon, clear button
- Variant 2 (hasSearch=false): "Brak przepisów", ChefHat icon, CTA "Dodaj pierwszy przepis"
- Centered layout, ilustracje

### Krok 8: Implementacja ErrorMessage

**src/components/common/ErrorMessage.tsx:**
- AlertCircle icon
- Error message display
- Retry button → onRetry prop
- Centered layout

### Krok 9: Implementacja głównego kontenera RecipesListView

**src/components/recipes/RecipesListView.tsx:**
```typescript
export function RecipesListView() {
  const {
    search,
    sort,
    recipes,
    totalRecipes,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    error,
    handleSearchChange,
    handleSortChange,
    fetchNextPage,
    refetch,
  } = useRecipesList();

  if (isLoading && recipes.length === 0) {
    return (
      <>
        <RecipesHeader
          search={search}
          sort={sort}
          onSearchChange={handleSearchChange}
          onSortChange={handleSortChange}
          recipesCount={totalRecipes}
        />
        <RecipesGridSkeleton />
      </>
    );
  }

  if (error && recipes.length === 0) {
    return (
      <>
        <RecipesHeader {...} />
        <ErrorMessage error={error} onRetry={refetch} />
      </>
    );
  }

  if (recipes.length === 0) {
    return (
      <>
        <RecipesHeader {...} />
        <EmptyState hasSearch={!!search} search={search} onClearSearch={() => handleSearchChange('')} />
      </>
    );
  }

  return (
    <div className="recipes-list-view">
      <RecipesHeader
        search={search}
        sort={sort}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
        recipesCount={totalRecipes}
      />
      <div className="container mx-auto p-4">
        <RecipesGrid
          recipes={recipes}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={fetchNextPage}
        />
      </div>
    </div>
  );
}
```

### Krok 10: Implementacja strony Astro

**src/pages/recipes/index.astro:**
```astro
---
import Layout from '@/layouts/Layout.astro';
import { RecipesListView } from '@/components/recipes/RecipesListView';
---

<Layout title="Przepisy - ShopMate">
  <RecipesListView client:load />
</Layout>
```

### Krok 11: Dodanie stylów Tailwind

Dla każdego komponentu dodać klasy Tailwind:
- RecipesHeader: `sticky top-0 bg-white z-10 border-b shadow-sm`
- SearchBar: relative positioning dla ikon, padding left/right
- RecipesGrid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- RecipeCard: hover effects, transitions, rounded corners
- AddRecipeButton FAB: `fixed bottom-6 right-6 z-20 rounded-full shadow-lg`
- EmptyState: centered text, py-16
- Responsive breakpoints: mobile-first

### Krok 12: Konfiguracja URL routing i middleware

**src/middleware/index.ts:**
Dodać `/recipes` do protected routes (sprawdzenie auth).

**URL params handling:**
Używamy Next.js router lub Astro equivalent do parse/sync URL params z stanem.

### Krok 13: Testy jednostkowe dla hooks

Utworzyć testy dla:
- `useDebouncedValue` - sprawdzenie debounce delay
- `useRecipesList` - mock TanStack Query, test search/sort sync
- URL params parsing
- Handlers (handleSearchChange, handleSortChange)

### Krok 14: Testy komponentów

Utworzyć testy dla:
- `SearchBar` - input, clear button, aria-label
- `SortDropdown` - select options, onChange
- `RecipeCard` - truncate, relative time, link href
- `EmptyState` - conditional rendering (hasSearch variants)
- `RecipesGrid` - grid layout, infinite scroll trigger

### Krok 15: Testy integracyjne

Testy end-to-end:
- Search flow: wpisanie query → debounce → URL update → refetch → wyniki
- Sort change: zmiana sort → URL update → refetch → posortowane wyniki
- Infinite scroll: scroll do końca → auto-fetch → więcej wyników
- Empty states: brak przepisów, brak wyników search
- Error handling: network error → error message → retry

### Krok 16: Accessibility audit

Sprawdzić:
- Keyboard navigation (Tab, Enter, Escape)
- Search input z aria-label
- Live regions dla loading states
- Sort dropdown accessible
- Recipe cards jako <article>
- Focus indicators
- Screen reader support (NVDA, JAWS)

Narzędzia:
- axe DevTools
- Lighthouse Accessibility
- Keyboard navigation test

### Krok 17: Performance optimization

Zoptymalizować:
- Debounce search (już implemented)
- Prefetching recipe details on hover
- Lazy loading images (jeśli recipe cards będą mieć zdjęcia)
- Virtual scrolling (opcjonalnie dla bardzo długich list >1000 items)
- Bundle size - code splitting

Narzędzia:
- Lighthouse Performance
- React DevTools Profiler
- Network tab monitoring

### Krok 18: Responsive testing

Przetestować na:
- Desktop (≥1024px) - 3 kolumny
- Tablet (768-1023px) - 2 kolumny
- Mobile (320-767px) - 1 kolumna, FAB button

Sprawdzić:
- Grid responsywny
- Search bar full-width mobile
- FAB sticky bottom-right mobile
- Touch targets ≥44px
- Infinite scroll działa na wszystkich urządzeniach

### Krok 19: Edge cases testing

Przetestować:
- 0 przepisów (nowy użytkownik) → EmptyState
- 1 przepis → prawidłowe wyświetlenie
- Dokładnie 20 przepisów (1 strona) → brak infinite scroll
- 21 przepisów → infinite scroll active
- Bardzo długie nazwy przepisów → truncate
- Search z 0 wyników → EmptyState variant
- Nieprawidłowe URL params → validation, fallback

### Krok 20: Deploy do Vercel i smoke test

Deploy na Vercel:
```bash
npm run build
vercel --prod
```

Smoke test na produkcji:
- Wejście na `/recipes`
- Search functionality
- Sort functionality
- Infinite scroll
- Click karty przepisu → nawigacja
- Responsive na mobile/tablet/desktop
- Performance (Lighthouse score >90)

---

**Koniec planu implementacji widoku Recipes List**
