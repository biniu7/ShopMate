# Plan implementacji widoku Recipe Details

## 1. Przegląd

Widok Recipe Details wyświetla pełne szczegóły pojedynczego przepisu wraz z możliwością edycji i usunięcia. Pokazuje nazwę przepisu, daty utworzenia i aktualizacji, pełną listę składników oraz instrukcje z zachowaniem formatowania. Jeśli przepis jest przypisany do kalendarza posiłków, wyświetla się info message z liczbą przypisań oraz link do kalendarza.

Widok oferuje przyciski "Edytuj" (nawigacja do formularza edycji) oraz "Usuń" (dialog potwierdzenia z informacją o konsekwencjach dla przypisań w kalendarzu). Po usunięciu użytkownik jest przekierowywany do listy przepisów z toast notification.

## 2. Routing widoku

**Ścieżka:** `/recipes/[id]` (dynamic route)

**URL Parameters:**

- `id` - UUID przepisu

**Typ:** Strona Astro z dynamicznym komponentem React (client:load)

**Zabezpieczenia:**

- Middleware sprawdza autentykację użytkownika
- RLS zapewnia że tylko właściciel przepisu ma dostęp
- 404 jeśli przepis nie istnieje lub nie należy do użytkownika

## 3. Struktura komponentów

```
src/pages/recipes/[id].astro (Astro page)
└── RecipeDetailsView.tsx (React component, client:load)
    ├── RecipeDetailsHeader.tsx (sticky top)
    │   ├── Breadcrumbs ("Przepisy > [nazwa przepisu]")
    │   ├── EditButton → /recipes/[id]/edit
    │   └── DeleteButton → open DeleteDialog
    ├── RecipeDetailsContent.tsx
    │   ├── RecipeName (h1)
    │   ├── RecipeMeta (dates, small text)
    │   ├── IngredientsSection
    │   │   ├── SectionHeading ("Składniki (X)")
    │   │   └── IngredientsList (ul)
    │   │       └── IngredientItem (li) × n
    │   ├── InstructionsSection
    │   │   ├── SectionHeading ("Instrukcje")
    │   │   └── InstructionsParagraph (white-space: pre-wrap)
    │   └── AssignmentsInfo (conditional, jeśli >0)
    │       ├── Alert (info variant)
    │       └── Link do kalendarza
    └── DeleteConfirmationDialog
        ├── DialogHeader (title)
        ├── DialogContent (description + konsekwencje)
        └── DialogFooter (Cancel + Delete buttons)
```

## 4. Szczegóły komponentów

### 4.1. RecipeDetailsView (Główny kontener)

**Opis:**
Główny kontener widoku szczegółów przepisu. Pobiera dane z API używając TanStack Query, zarządza stanem dialogu usuwania oraz nawigacją.

**Główne elementy:**

```tsx
<div className="recipe-details-view">
  {isLoading && <RecipeDetailsSkeleton />}

  {error && <ErrorMessage error={error} />}

  {recipe && (
    <>
      <RecipeDetailsHeader recipeName={recipe.name} recipeId={recipe.id} onDelete={() => setDeleteDialogOpen(true)} />

      <RecipeDetailsContent recipe={recipe} />

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        recipeId={recipe.id}
        recipeName={recipe.name}
        assignmentsCount={recipe.meal_plan_assignments ?? 0}
      />
    </>
  )}
</div>
```

**Obsługiwane interakcje:**

- Fetch recipe details przy montowaniu
- Open/close delete dialog
- Delete mutation → redirect + toast

**Typy:**

- `RecipeResponseDto`

**Propsy:**

```typescript
interface RecipeDetailsViewProps {
  recipeId: string; // z URL params
}
```

### 4.2. RecipeDetailsHeader

**Opis:**
Sticky header z breadcrumbs i przyciskami akcji (Edit, Delete).

**Główne elementy:**

```tsx
<header className="recipe-details-header sticky top-0 bg-white z-10 border-b shadow-sm">
  <div className="container mx-auto p-4">
    <Breadcrumbs
      items={[
        { label: "Przepisy", href: "/recipes" },
        { label: recipeName, href: `/recipes/${recipeId}`, truncate: 30 },
      ]}
    />

    <div className="flex gap-3 mt-4">
      <Button asChild variant="outline">
        <Link href={`/recipes/${recipeId}/edit`}>
          <Edit className="h-4 w-4 mr-2" />
          Edytuj
        </Link>
      </Button>

      <Button onClick={onDelete} variant="destructive" aria-label={`Usuń przepis ${recipeName}`}>
        <Trash2 className="h-4 w-4 mr-2" />
        Usuń
      </Button>

      <Button asChild variant="ghost">
        <Link href="/recipes">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Powrót do listy
        </Link>
      </Button>
    </div>
  </div>
</header>
```

**Obsługiwane interakcje:**

- Click "Edytuj" → nawigacja do `/recipes/:id/edit`
- Click "Usuń" → trigger onDelete (open dialog)
- Click "Powrót" → nawigacja do `/recipes`

**Propsy:**

```typescript
interface RecipeDetailsHeaderProps {
  recipeName: string;
  recipeId: string;
  onDelete: () => void;
}
```

### 4.3. RecipeDetailsContent

**Opis:**
Główna zawartość strony z nazwą przepisu, meta informacjami, składnikami i instrukcjami.

**Główne elementy:**

```tsx
<div className="recipe-details-content container mx-auto max-w-4xl p-4">
  <h1 className="text-4xl font-bold text-gray-900 mb-2">{recipe.name}</h1>

  <RecipeMeta createdAt={recipe.created_at} updatedAt={recipe.updated_at} />

  <div className="grid md:grid-cols-2 gap-8 mt-8">
    <IngredientsSection ingredients={recipe.ingredients} />
    <InstructionsSection instructions={recipe.instructions} />
  </div>

  {recipe.meal_plan_assignments > 0 && <AssignmentsInfo count={recipe.meal_plan_assignments} />}
</div>
```

**Propsy:**

```typescript
interface RecipeDetailsContentProps {
  recipe: RecipeResponseDto;
}
```

### 4.4. RecipeMeta

**Opis:**
Wyświetla daty utworzenia i ostatniej edycji w formacie czytelnym dla użytkownika.

**Główne elementy:**

```tsx
<div className="recipe-meta flex gap-4 text-sm text-gray-600">
  <div>
    <span className="font-medium">Dodano:</span>{" "}
    <time dateTime={createdAt}>{format(new Date(createdAt), "d MMMM yyyy, HH:mm", { locale: pl })}</time>
  </div>

  {updatedAt !== createdAt && (
    <div>
      <span className="font-medium">Ostatnia edycja:</span>{" "}
      <time dateTime={updatedAt}>{format(new Date(updatedAt), "d MMMM yyyy, HH:mm", { locale: pl })}</time>
    </div>
  )}
</div>
```

**Propsy:**

```typescript
interface RecipeMetaProps {
  createdAt: string;
  updatedAt: string;
}
```

### 4.5. IngredientsSection

**Opis:**
Sekcja ze składnikami wyświetlana jako lista punktowana. Każdy składnik pokazuje ilość, jednostkę i nazwę.

**Główne elementy:**

```tsx
<section className="ingredients-section">
  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Składniki ({ingredients.length})</h2>

  <ul className="space-y-2" role="list">
    {ingredients
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((ingredient) => (
        <li key={ingredient.id} className="flex items-baseline gap-2">
          <span className="text-primary">•</span>
          <span>
            {ingredient.quantity && <strong>{ingredient.quantity} </strong>}
            {ingredient.unit && <span className="text-gray-600">{ingredient.unit} </span>}
            <span>{ingredient.name}</span>
          </span>
        </li>
      ))}
  </ul>
</section>
```

**Propsy:**

```typescript
interface IngredientsSectionProps {
  ingredients: IngredientResponseDto[];
}
```

### 4.6. InstructionsSection

**Opis:**
Sekcja z instrukcjami wyświetlana jako paragraph z zachowaniem formatowania (newlines).

**Główne elementy:**

```tsx
<section className="instructions-section">
  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Instrukcje</h2>

  <p className="whitespace-pre-wrap leading-relaxed text-gray-800">{instructions}</p>
</section>
```

**Propsy:**

```typescript
interface InstructionsSectionProps {
  instructions: string;
}
```

### 4.7. AssignmentsInfo

**Opis:**
Alert informacyjny wyświetlany gdy przepis jest przypisany do kalendarza posiłków. Pokazuje liczbę przypisań i link do kalendarza.

**Główne elementy:**

```tsx
<Alert variant="info" className="mt-8">
  <Info className="h-4 w-4" />
  <AlertTitle>Ten przepis jest przypisany do kalendarza</AlertTitle>
  <AlertDescription>
    Ten przepis jest przypisany do {count} {count === 1 ? "posiłku" : "posiłków"} w kalendarzu.{" "}
    <Link href="/calendar" className="font-medium underline">
      Zobacz kalendarz →
    </Link>
  </AlertDescription>
</Alert>
```

**Propsy:**

```typescript
interface AssignmentsInfoProps {
  count: number;
}
```

### 4.8. DeleteConfirmationDialog

**Opis:**
Modal dialog potwierdzający usunięcie przepisu. Wyświetla komunikat o konsekwencjach (usunięcie przypisań w kalendarzu jeśli istnieją).

**Główne elementy:**

```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Usuń przepis?</DialogTitle>
      <DialogDescription>
        {assignmentsCount > 0 ? (
          <>
            Ten przepis &quot;{recipeName}&quot; jest przypisany do{" "}
            <strong>
              {assignmentsCount} {assignmentsCount === 1 ? "posiłku" : "posiłków"}
            </strong>{" "}
            w kalendarzu. Usunięcie spowoduje usunięcie wszystkich przypisań.
          </>
        ) : (
          <>Czy na pewno chcesz usunąć przepis &quot;{recipeName}&quot;?</>
        )}
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
        ) : assignmentsCount > 0 ? (
          "Usuń przepis i przypisania"
        ) : (
          "Usuń przepis"
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Obsługiwane interakcje:**

- Click "Anuluj" → onClose
- Click "Usuń" → handleDelete → mutation
- Escape key → onClose
- Backdrop click → onClose

**Propsy:**

```typescript
interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: string;
  recipeName: string;
  assignmentsCount: number;
}
```

### 4.9. RecipeDetailsSkeleton

**Opis:**
Skeleton loader podczas ładowania szczegółów przepisu.

**Główne elementy:**

```tsx
<div className="recipe-details-skeleton">
  <div className="container mx-auto max-w-4xl p-4">
    <Skeleton className="h-10 w-3/4 mb-2" /> {/* Title */}
    <Skeleton className="h-4 w-1/2 mb-8" /> {/* Meta */}
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <Skeleton className="h-6 w-32 mb-4" /> {/* Heading */}
        <Skeleton className="h-4 w-full mb-2" count={5} /> {/* Ingredients */}
      </div>

      <div>
        <Skeleton className="h-6 w-32 mb-4" /> {/* Heading */}
        <Skeleton className="h-4 w-full mb-2" count={8} /> {/* Instructions */}
      </div>
    </div>
  </div>
</div>
```

## 5. Typy

### 5.1. Istniejące typy (z src/types.ts)

```typescript
export interface RecipeResponseDto extends Recipe {
  ingredients: IngredientResponseDto[];
  meal_plan_assignments?: number;
}

export type IngredientResponseDto = Ingredient;

export interface Recipe {
  id: string;
  user_id: string;
  name: string;
  instructions: string;
  created_at: string;
  updated_at: string;
}

export interface Ingredient {
  id: string;
  recipe_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  sort_order: number;
}

export interface DeleteRecipeResponseDto {
  message: string;
  deleted_meal_plan_assignments: number;
}
```

## 6. Zarządzanie stanem

### 6.1. TanStack Query dla fetch recipe

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function RecipeDetailsView({ recipeId }: RecipeDetailsViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  // Fetch recipe details
  const {
    data: recipe,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["recipe", recipeId],
    queryFn: async () => {
      const response = await fetch(`/api/recipes/${recipeId}`);

      if (response.status === 404) {
        throw new Error("Recipe not found");
      }

      if (!response.ok) {
        throw new Error("Failed to fetch recipe");
      }

      return response.json() as Promise<RecipeResponseDto>;
    },
    staleTime: 10 * 60 * 1000, // 10 minut
    retry: (failureCount, error) => {
      // Don't retry 404
      if (error.message === "Recipe not found") return false;
      return failureCount < 2;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete recipe");
      }

      return response.json() as Promise<DeleteRecipeResponseDto>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["recipes"]);
      queryClient.invalidateQueries(["meal-plan"]); // May be assigned

      toast.success(
        data.deleted_meal_plan_assignments > 0
          ? `Przepis usunięty wraz z ${data.deleted_meal_plan_assignments} przypisaniami`
          : "Przepis usunięty"
      );

      router.push("/recipes");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nie udało się usunąć przepisu");
    },
  });

  // ... rest of component
}
```

### 6.2. Local state

- `deleteDialogOpen` - boolean dla delete dialog visibility
- Brak innego state, dane w TanStack Query cache

## 7. Integracja API

### 7.1. Endpoint: GET /api/recipes/:id

**Request:**

```
GET /api/recipes/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**

```typescript
RecipeResponseDto
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  user_id: "123e4567-e89b-12d3-a456-426614174000",
  name: "Spaghetti Carbonara",
  instructions: "1. Boil pasta...\n2. Cook bacon...",
  created_at: "2025-01-26T10:00:00Z",
  updated_at: "2025-01-26T10:00:00Z",
  ingredients: [
    {
      id: "650e8400-e29b-41d4-a716-446655440001",
      recipe_id: "550e8400-e29b-41d4-a716-446655440000",
      name: "spaghetti",
      quantity: 500,
      unit: "g",
      sort_order: 0
    },
    // ... sorted by sort_order
  ],
  meal_plan_assignments: 3
}
```

**Error Responses:**

**404 Not Found:**

```json
{
  "error": "Recipe not found"
}
```

→ Show error page "Przepis nie znaleziony" + link do /recipes

**401 Unauthorized:**

```json
{
  "error": "Unauthorized"
}
```

→ Redirect do /login

### 7.2. Endpoint: DELETE /api/recipes/:id

**Request:**

```
DELETE /api/recipes/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**

```typescript
DeleteRecipeResponseDto
{
  message: "Recipe deleted successfully",
  deleted_meal_plan_assignments: 3
}
```

**Error Responses:**

**404 Not Found:**

```json
{
  "error": "Recipe not found"
}
```

**401 Unauthorized:**

```json
{
  "error": "Unauthorized"
}
```

## 8. Interakcje użytkownika

### 8.1. Przeglądanie szczegółów przepisu

**Przepływ:**

1. User wchodzi na `/recipes/:id`
2. RecipeDetailsView montuje się
3. useQuery fetch recipe details
4. Skeleton podczas ładowania
5. Po załadowaniu: wyświetlenie wszystkich sekcji
6. Jeśli meal_plan_assignments > 0 → AssignmentsInfo visible

### 8.2. Edycja przepisu

**Przepływ:**

1. User klika "Edytuj"
2. Nawigacja do `/recipes/:id/edit`
3. Formularz edycji (prefilled z danymi)

### 8.3. Usuwanie przepisu

**Przepływ:**

1. User klika "Usuń"
2. DeleteConfirmationDialog otwiera się
3. Dialog pokazuje:
   - Jeśli assignments > 0: ostrzeżenie o usunięciu przypisań
   - Jeśli assignments === 0: proste potwierdzenie
4. User klika "Anuluj" → dialog zamyka się
5. User klika "Usuń przepis" → mutation
6. Button disabled + spinner "Usuwanie..."
7. Success → toast + redirect `/recipes`
8. Error → toast z błędem, dialog pozostaje otwarty

### 8.4. Nawigacja do kalendarza (z AssignmentsInfo)

**Przepływ:**

1. User klika "Zobacz kalendarz →"
2. Nawigacja do `/calendar`
3. Calendar pokazuje bieżący tydzień

### 8.5. Powrót do listy

**Przepływ:**

1. User klika "Powrót do listy"
2. Nawigacja do `/recipes`
3. Lista przepisów (cached data)

## 9. Warunki i walidacja

### 9.1. Warunek: 404 handling

```typescript
if (error?.message === 'Recipe not found') {
  return <NotFoundPage message="Przepis nie znaleziony" />;
}
```

### 9.2. Warunek: Show/hide AssignmentsInfo

```typescript
{recipe.meal_plan_assignments > 0 && (
  <AssignmentsInfo count={recipe.meal_plan_assignments} />
)}
```

### 9.3. Warunek: Show updated date

```typescript
{updatedAt !== createdAt && (
  <div>Ostatnia edycja: ...</div>
)}
```

### 9.4. Warunek: Delete dialog message variant

```typescript
{assignmentsCount > 0 ? (
  <span>...usunięcie spowoduje usunięcie przypisań</span>
) : (
  <span>Czy na pewno chcesz usunąć?</span>
)}
```

### 9.5. Sortowanie składników

```typescript
ingredients.sort((a, b) => a.sort_order - b.sort_order);
```

## 10. Obsługa błędów

### 10.1. Recipe not found (404)

- Wyświetlenie error page "Przepis nie znaleziony"
- Link "Powrót do listy przepisów"

### 10.2. Unauthorized (401)

- Redirect do `/login?redirect=/recipes/:id`

### 10.3. Network error (fetch failed)

- Error message z retry button
- Toast: "Nie udało się załadować przepisu"

### 10.4. Delete failed

- Toast: "Nie udało się usunąć przepisu"
- Dialog pozostaje otwarty
- User może spróbować ponownie

## 11. Kroki implementacji

### Krok 1: Struktura plików

```
src/
├── pages/
│   └── recipes/
│       └── [id].astro
├── components/
│   └── recipes/
│       ├── RecipeDetailsView.tsx
│       ├── RecipeDetailsHeader.tsx
│       ├── RecipeDetailsContent.tsx
│       ├── RecipeMeta.tsx
│       ├── IngredientsSection.tsx
│       ├── InstructionsSection.tsx
│       ├── AssignmentsInfo.tsx
│       ├── DeleteConfirmationDialog.tsx
│       └── RecipeDetailsSkeleton.tsx
```

### Krok 2: useQuery dla fetch recipe

### Krok 3: useMutation dla delete

### Krok 4: Implementacja komponentów

### Krok 5: Stylowanie + accessibility

### Krok 6: Testy

---

**Koniec planu implementacji widoku Recipe Details**
