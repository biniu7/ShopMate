# Plan implementacji widoku Shopping Lists History

## 1. Przegląd

Widok Shopping Lists History wyświetla historię wszystkich zapisanych list zakupów użytkownika. Umożliwia przeglądanie list, nawigację do szczegółów oraz usuwanie niepotrzebnych list. Listy są sortowane od najnowszych do najstarszych (created_at DESC) i wyświetlane w formie kart w responsywnym grid layout (2 kolumny desktop, 1 mobile).

Każda karta pokazuje:

- Nazwę listy (truncate do 60 znaków)
- Datę utworzenia (relative time)
- Zakres dat tygodnia (jeśli lista z kalendarza)
- Badge z liczbą składników
- Przycisk delete (icon button)

Kliknięcie karty przenosi do widoku szczegółów listy. Przycisk delete otwiera dialog potwierdzenia. Dla nowych użytkowników (0 list) wyświetlany jest empty state z CTA "Generuj pierwszą listę".

## 2. Routing widoku

**Ścieżka:** `/shopping-lists`

**Query Parameters:**

- `page` (optional) - numer strony dla paginacji (default: 1)
- `limit` (optional) - items per page (default: 20, max: 100)

**Typ:** Strona Astro z dynamicznym komponentem React (client:load)

**Zabezpieczenia:**

- Middleware sprawdza autentykację
- RLS zapewnia dostęp tylko do list zalogowanego użytkownika

## 3. Struktura komponentów

```
src/pages/shopping-lists/index.astro (Astro page)
└── ShoppingListsHistoryView.tsx (React component, client:load)
    ├── ShoppingListsHeader.tsx (sticky top)
    │   ├── Breadcrumbs ("Listy zakupów")
    │   └── GenerateButton → /shopping-lists/generate
    ├── ShoppingListsGrid.tsx
    │   ├── ShoppingListCard.tsx × n
    │   │   ├── CardContent (name, meta, badge)
    │   │   └── DeleteButton (icon button)
    │   └── LoadMoreButton (conditional, pagination)
    ├── EmptyState.tsx (conditional, 0 lists)
    └── DeleteConfirmationDialog.tsx
```

## 4. Szczegóły komponentów

### 4.1. ShoppingListsHistoryView (Główny kontener)

**Opis:**
Główny kontener zarządzający fetchem list zakupów, stanem delete dialog oraz paginacją.

**Główne elementy:**

```tsx
<div className="shopping-lists-history-view">
  <ShoppingListsHeader />

  {isLoading && <ShoppingListsGridSkeleton />}

  {error && <ErrorMessage error={error} />}

  {!isLoading && !error && shoppingLists.length === 0 && <EmptyState />}

  {!isLoading && !error && shoppingLists.length > 0 && (
    <ShoppingListsGrid
      shoppingLists={shoppingLists}
      onDelete={(id, name) => openDeleteDialog(id, name)}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={fetchNextPage}
    />
  )}

  <DeleteConfirmationDialog
    isOpen={deleteDialog.isOpen}
    listId={deleteDialog.listId}
    listName={deleteDialog.listName}
    onClose={closeDeleteDialog}
  />
</div>
```

**Obsługiwane interakcje:**

- Fetch lists przy montowaniu
- Open/close delete dialog
- Delete mutation → invalidate query + toast
- Infinite scroll / pagination

**Typy:**

- `ShoppingListListItemDto[]`

**Propsy:** Brak (główny kontener)

### 4.2. ShoppingListsHeader

**Opis:**
Sticky header z breadcrumbs i przyciskiem "Generuj nową listę".

**Główne elementy:**

```tsx
<header className="shopping-lists-header sticky top-0 bg-white z-10 border-b shadow-sm">
  <div className="container mx-auto p-4">
    <Breadcrumbs items={[{ label: "Listy zakupów", href: "/shopping-lists" }]} />

    <div className="flex items-center justify-between mt-4">
      <h1 className="text-3xl font-bold text-gray-900">Listy zakupów</h1>

      <Button asChild size="lg">
        <Link href="/shopping-lists/generate">
          <Plus className="h-4 w-4 mr-2" />
          Generuj nową listę
        </Link>
      </Button>
    </div>
  </div>
</header>
```

**Obsługiwane interakcje:**

- Click "Generuj nową listę" → nawigacja do `/shopping-lists/generate`

**Propsy:** Brak

### 4.3. ShoppingListsGrid

**Opis:**
Grid layout z kartami list zakupów. Responsywny (2 kolumny desktop, 1 mobile). Obsługuje pagination z infinite scroll lub manual button.

**Główne elementy:**

```tsx
<div className="shopping-lists-grid container mx-auto p-4">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {shoppingLists.map((list) => (
      <ShoppingListCard key={list.id} list={list} onDelete={() => onDelete(list.id, list.name)} />
    ))}
  </div>

  {hasNextPage && (
    <div className="mt-8 flex justify-center">
      <Button onClick={onLoadMore} disabled={isFetchingNextPage} variant="outline" size="lg">
        {isFetchingNextPage ? (
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
  )}
</div>
```

**Obsługiwane interakcje:**

- Click karta → nawigacja do `/shopping-lists/:id`
- Click delete icon → onDelete(id, name)
- Click "Załaduj więcej" → onLoadMore

**Propsy:**

```typescript
interface ShoppingListsGridProps {
  shoppingLists: ShoppingListListItemDto[];
  onDelete: (id: string, name: string) => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}
```

### 4.4. ShoppingListCard

**Opis:**
Karta pojedynczej listy zakupów wyświetlająca nazwę, metadane, badge z liczbą składników oraz przycisk delete.

**Główne elementy:**

```tsx
<article className="shopping-list-card relative">
  <Link href={`/shopping-lists/${list.id}`} className="block">
    <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-white">
      <h3 className="text-lg font-semibold text-gray-900 mb-2 pr-10" title={list.name}>
        {truncate(list.name, 60)}
      </h3>

      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
        <time dateTime={list.created_at} className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatRelativeTime(list.created_at)}
        </time>

        {list.week_start_date && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatWeekRange(list.week_start_date)}
          </span>
        )}

        <Badge variant="secondary" className="flex items-center gap-1">
          <ShoppingCart className="h-3 w-3" />
          {list.items_count} {list.items_count === 1 ? "składnik" : "składników"}
        </Badge>
      </div>
    </div>
  </Link>

  <Button
    variant="ghost"
    size="icon"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onDelete();
    }}
    className="absolute top-4 right-4"
    aria-label={`Usuń listę ${list.name}`}
  >
    <Trash2 className="h-4 w-4 text-red-600" />
  </Button>
</article>
```

**Obsługiwane interakcje:**

- Click karta (Link) → nawigacja do `/shopping-lists/:id`
- Click delete button → onDelete() (stopPropagation!)
- Hover → shadow effect

**Propsy:**

```typescript
interface ShoppingListCardProps {
  list: ShoppingListListItemDto;
  onDelete: () => void;
}
```

### 4.5. DeleteConfirmationDialog

**Opis:**
Modal potwierdzający usunięcie listy zakupów.

**Główne elementy:**

```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Usuń listę zakupów?</DialogTitle>
      <DialogDescription>
        Czy na pewno chcesz usunąć listę &quot;{listName}&quot;? Ta operacja jest nieodwracalna.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter>
      <Button variant="ghost" onClick={onClose} disabled={deleteMutation.isLoading}>
        Anuluj
      </Button>

      <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isLoading}>
        {deleteMutation.isLoading ? (
          <>
            <Spinner className="h-4 w-4 mr-2" />
            Usuwanie...
          </>
        ) : (
          "Usuń listę"
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Obsługiwane interakcje:**

- Click "Anuluj" → onClose
- Click "Usuń listę" → mutation → invalidate + toast + onClose
- Escape key → onClose

**Propsy:**

```typescript
interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  listId: string | null;
  listName: string | null;
  onClose: () => void;
}
```

### 4.6. EmptyState

**Opis:**
Wyświetlany gdy użytkownik nie ma żadnych list zakupów.

**Główne elementy:**

```tsx
<div className="empty-state py-16 text-center">
  <div className="max-w-md mx-auto">
    <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Nie masz jeszcze list zakupów</h2>
    <p className="text-gray-600 mb-6">Wygeneruj pierwszą listę z kalendarza tygodniowego lub wybranych przepisów</p>
    <Button asChild size="lg">
      <Link href="/shopping-lists/generate">
        <Plus className="h-4 w-4 mr-2" />
        Generuj pierwszą listę
      </Link>
    </Button>
  </div>
</div>
```

**Propsy:** Brak

### 4.7. ShoppingListsGridSkeleton

**Opis:**
Skeleton loader podczas ładowania list.

**Główne elementy:**

```tsx
<div className="shopping-lists-grid-skeleton container mx-auto p-4">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="border rounded-lg p-6 bg-white">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <div className="flex gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    ))}
  </div>
</div>
```

## 5. Typy

### 5.1. Istniejące typy (z src/types.ts)

```typescript
export interface ShoppingListListItemDto {
  id: string;
  name: string;
  week_start_date: string | null;
  items_count: number;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

export interface ShoppingListQueryParams extends PaginationParams {
  // Tylko pagination, brak search/sort
}
```

### 5.2. Nowe ViewModels

```typescript
/**
 * Stan delete dialog
 */
export interface DeleteDialogState {
  isOpen: boolean;
  listId: string | null;
  listName: string | null;
}
```

### 5.3. Utility functions

```typescript
/**
 * Formatuje zakres tygodnia z week_start_date
 * @param weekStartDate - ISO date string (Monday)
 * @returns "Tydzień 20-26 stycznia"
 */
export function formatWeekRange(weekStartDate: string): string {
  const start = new Date(weekStartDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const startDay = format(start, "d", { locale: pl });
  const endDay = format(end, "d", { locale: pl });
  const month = format(end, "MMMM", { locale: pl });

  return `Tydzień ${startDay}-${endDay} ${month}`;
}
```

## 6. Zarządzanie stanem

### 6.1. TanStack Query dla list zakupów

```typescript
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function ShoppingListsHistoryView() {
  const queryClient = useQueryClient();
  const [deleteDialog, setDeleteDialog] = React.useState<DeleteDialogState>({
    isOpen: false,
    listId: null,
    listName: null,
  });

  // Infinite query dla list
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useInfiniteQuery({
    queryKey: ["shopping-lists", "list"],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(`/api/shopping-lists?page=${pageParam}&limit=20`);

      if (!response.ok) {
        throw new Error("Failed to fetch shopping lists");
      }

      const result: PaginatedResponse<ShoppingListListItemDto> = await response.json();

      return {
        data: result.data,
        pagination: result.pagination,
        nextPage: result.pagination.page < result.pagination.total_pages ? result.pagination.page + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 2 * 60 * 1000, // 2 minuty
  });

  // Flatten pages
  const shoppingLists = React.useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (listId: string) => {
      const response = await fetch(`/api/shopping-lists/${listId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete shopping list");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["shopping-lists"]);
      toast.success("Lista usunięta");
      closeDeleteDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nie udało się usunąć listy");
    },
  });

  const openDeleteDialog = (listId: string, listName: string) => {
    setDeleteDialog({ isOpen: true, listId, listName });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, listId: null, listName: null });
  };

  const handleDelete = () => {
    if (deleteDialog.listId) {
      deleteMutation.mutate(deleteDialog.listId);
    }
  };

  // ... rest
}
```

## 7. Integracja API

### 7.1. Endpoint: GET /api/shopping-lists

**Request:**

```
GET /api/shopping-lists?page=1&limit=20
```

**Response (200 OK):**

```typescript
PaginatedResponse<ShoppingListListItemDto>
{
  data: [
    {
      id: "850e8400-e29b-41d4-a716-446655440000",
      name: "Lista zakupów - Tydzień 20-26 stycznia",
      week_start_date: "2025-01-20",
      items_count: 23,
      created_at: "2025-01-26T14:00:00Z"
    },
    // ... more lists sorted by created_at DESC
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 12,
    total_pages: 1
  }
}
```

### 7.2. Endpoint: DELETE /api/shopping-lists/:id

**Request:**

```
DELETE /api/shopping-lists/850e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**

```json
{
  "message": "Shopping list deleted successfully"
}
```

**Error Responses:**

- 401 Unauthorized
- 404 Not Found

## 8. Interakcje użytkownika

### 8.1. Przeglądanie historii list

**Przepływ:**

1. User wchodzi na `/shopping-lists`
2. Fetch list zakupów (page 1, limit 20)
3. Wyświetlenie grid z kartami
4. Jeśli pagination.total_pages > 1 → przycisk "Załaduj więcej"

### 8.2. Kliknięcie karty listy

**Przepływ:**

1. User klika kartę listy
2. Nawigacja do `/shopping-lists/:id`
3. Widok szczegółów listy

### 8.3. Usuwanie listy

**Przepływ:**

1. User klika ikonę trash na karcie
2. DeleteConfirmationDialog otwiera się
3. User klika "Usuń listę" → mutation
4. Success → toast "Lista usunięta" + invalidate query + dialog zamyka się
5. Lista znika z grid

### 8.4. Generowanie nowej listy

**Przepływ:**

1. User klika "Generuj nową listę"
2. Nawigacja do `/shopping-lists/generate`
3. Wizard generowania

### 8.5. Load more (pagination)

**Przepływ:**

1. User scrolluje do końca lub klika "Załaduj więcej"
2. fetchNextPage() → fetch page 2
3. Append do istniejącej listy
4. Jeśli hasNextPage → przycisk pozostaje
5. Jeśli !hasNextPage → przycisk ukryty

## 9. Warunki i walidacja

### 9.1. Empty state

```typescript
{!isLoading && !error && shoppingLists.length === 0 && (
  <EmptyState />
)}
```

### 9.2. Show week range

```typescript
{list.week_start_date && (
  <span>{formatWeekRange(list.week_start_date)}</span>
)}
```

Tylko listy wygenerowane z kalendarza mają `week_start_date`.

### 9.3. Pluralization items count

```typescript
{
  list.items_count;
}
{
  list.items_count === 1 ? "składnik" : "składników";
}
```

### 9.4. Truncate list name

```typescript
{
  truncate(list.name, 60);
}
```

z full name w title attribute.

### 9.5. Show load more button

```typescript
{hasNextPage && (
  <Button onClick={onLoadMore}>Załaduj więcej</Button>
)}
```

## 10. Obsługa błędów

### 10.1. Fetch error

- Error message z retry button
- Toast: "Nie udało się załadować list zakupów"

### 10.2. Delete error

- Toast: "Nie udało się usunąć listy"
- Dialog pozostaje otwarty
- User może spróbować ponownie

### 10.3. 404 dla delete (lista już usunięta)

- Toast: "Lista nie znaleziona"
- Invalidate query (lista zniknie z widoku)

## 11. Kroki implementacji

### Krok 1: Struktura plików

```
src/
├── pages/
│   └── shopping-lists/
│       └── index.astro
├── components/
│   └── shopping-lists/
│       ├── ShoppingListsHistoryView.tsx
│       ├── ShoppingListsHeader.tsx
│       ├── ShoppingListsGrid.tsx
│       ├── ShoppingListCard.tsx
│       ├── DeleteConfirmationDialog.tsx
│       ├── EmptyState.tsx
│       └── ShoppingListsGridSkeleton.tsx
└── lib/
    └── utils/
        └── date.ts (formatWeekRange)
```

### Krok 2: useInfiniteQuery dla list

### Krok 3: useMutation dla delete

### Krok 4: Komponenty grid + card

### Krok 5: Delete dialog z state management

### Krok 6: Empty state

### Krok 7: Pagination / load more

### Krok 8: Stylowanie + responsywność

### Krok 9: Testy

---

**Koniec planu implementacji widoku Shopping Lists History**
