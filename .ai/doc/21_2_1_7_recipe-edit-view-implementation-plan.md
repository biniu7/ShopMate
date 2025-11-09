# Plan implementacji widoku Recipe Edit

## 1. Przegląd

Widok Recipe Edit umożliwia edycję istniejącego przepisu. Jest to formularz identyczny jak Recipe Create, ale z danymi wstępnie wypełnionymi z istniejącego przepisu. Dodatkowo zawiera info alert informujący że zmiany propagują się do wszystkich przypisań w kalendarzu. Po pomyślnej aktualizacji użytkownik jest przekierowywany do widoku szczegółów przepisu z toast notification "Przepis zaktualizowany pomyślnie".

**Główne różnice względem Recipe Create:**
- Pre-filled form (fetch existing recipe first)
- PUT /api/recipes/:id zamiast POST /api/recipes
- Info alert: "Zmiany zaktualizują wszystkie przypisania w kalendarzu"
- Button label: "Zapisz zmiany" zamiast "Zapisz przepis"
- Cancel confirmation jeśli formularz dirty: "Odrzucić zmiany?"
- Success redirect do `/recipes/:id` (not to new recipe)

## 2. Routing widoku

**Ścieżka:** `/recipes/[id]/edit`

**URL Parameters:**
- `id` - UUID przepisu

**Typ:** Strona Astro z dynamicznym komponentem React (client:load)

**Zabezpieczenia:**
- Middleware sprawdza autentykację
- RLS zapewnia że tylko właściciel ma dostęp
- 404 jeśli przepis nie istnieje lub nie należy do użytkownika

## 3. Struktura komponentów

```
src/pages/recipes/[id]/edit.astro (Astro page)
└── RecipeEditView.tsx (React component, client:load)
    ├── RecipeEditForm.tsx (reuses RecipeForm components)
    │   ├── FormHeader.tsx (breadcrumbs + info alert)
    │   ├── InfoAlert ("Zmiany zaktualizują wszystkie przypisania")
    │   ├── NameInput.tsx (from Create)
    │   ├── InstructionsTextarea.tsx (from Create)
    │   ├── IngredientsList.tsx (from Create)
    │   └── FormActions.tsx
    │       ├── CancelButton (with dirty check)
    │       └── SaveButton ("Zapisz zmiany")
    └── DiscardChangesDialog (conditional)
```

## 4. Szczegóły komponentów

### 4.1. RecipeEditView (Główny kontener)

**Opis:**
Główny kontener zarządzający fetchem istniejącego przepisu i renderowaniem formularza edycji.

**Główne elementy:**
```tsx
<div className="recipe-edit-view">
  {isLoading && <RecipeFormSkeleton />}

  {error && <ErrorMessage error={error} />}

  {recipe && (
    <div className="container mx-auto max-w-3xl p-4">
      <RecipeEditForm
        recipeId={recipe.id}
        initialData={recipe}
      />
    </div>
  )}
</div>
```

**Propsy:**
```typescript
interface RecipeEditViewProps {
  recipeId: string; // z URL params
}
```

### 4.2. RecipeEditForm

**Opis:**
Formularz edycji identyczny jak RecipeForm z Recipe Create, ale z pre-filled data i PUT mutation.

**Główne elementy:**
```tsx
<form onSubmit={handleSubmit(onSubmit)}>
  <FormHeader recipeId={recipeId} recipeName={initialData.name} />

  <InfoAlert>
    Zmiany zaktualizują wszystkie przypisania w kalendarzu
  </InfoAlert>

  <div className="space-y-6 mt-6">
    <NameInput {...} />
    <InstructionsTextarea {...} />
    <IngredientsList {...} />
  </div>

  <FormActions
    onCancel={handleCancel}
    isSubmitting={mutation.isLoading}
    isValid={isValid}
    isDirty={isDirty}
    saveButtonLabel="Zapisz zmiany"
  />
</form>
```

**Zarządzanie stanem:**
```typescript
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function RecipeEditForm({ recipeId, initialData }: RecipeEditFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [discardDialogOpen, setDiscardDialogOpen] = React.useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, isDirty },
  } = useForm<CreateRecipeFormData>({
    resolver: zodResolver(createRecipeSchema),
    mode: 'onChange',
    defaultValues: {
      name: initialData.name,
      instructions: initialData.instructions,
      ingredients: initialData.ingredients.map(ing => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        sort_order: ing.sort_order,
      })),
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'ingredients',
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateRecipeFormData) => {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update recipe');
      }

      return response.json() as Promise<RecipeResponseDto>;
    },
    onSuccess: (updatedRecipe) => {
      // Invalidate all related queries
      queryClient.invalidateQueries(['recipe', recipeId]);
      queryClient.invalidateQueries(['recipes']);
      queryClient.invalidateQueries(['meal-plan']); // Live update

      toast.success('Przepis zaktualizowany pomyślnie');
      router.push(`/recipes/${updatedRecipe.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Nie udało się zaktualizować przepisu');
    },
  });

  const onSubmit = (data: CreateRecipeFormData) => {
    const dataWithSortOrder = {
      ...data,
      ingredients: data.ingredients.map((ing, index) => ({
        ...ing,
        sort_order: index,
      })),
    };

    mutation.mutate(dataWithSortOrder);
  };

  const handleCancel = () => {
    if (isDirty) {
      setDiscardDialogOpen(true);
    } else {
      router.push(`/recipes/${recipeId}`);
    }
  };

  const handleDiscard = () => {
    router.push(`/recipes/${recipeId}`);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>

      <DiscardChangesDialog
        isOpen={discardDialogOpen}
        onClose={() => setDiscardDialogOpen(false)}
        onDiscard={handleDiscard}
      />
    </>
  );
}
```

**Propsy:**
```typescript
interface RecipeEditFormProps {
  recipeId: string;
  initialData: RecipeResponseDto;
}
```

### 4.3. InfoAlert

**Opis:**
Alert informacyjny o propagacji zmian do kalendarza.

**Główne elementy:**
```tsx
<Alert variant="info" className="my-4">
  <Info className="h-4 w-4" />
  <AlertDescription>
    Zmiany zaktualizują wszystkie przypisania w kalendarzu. Wcześniej wygenerowane listy zakupów pozostaną niezmienione (snapshot).
  </AlertDescription>
</Alert>
```

### 4.4. DiscardChangesDialog

**Opis:**
Dialog potwierdzający odrzucenie niezapisanych zmian.

**Główne elementy:**
```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Odrzucić zmiany?</DialogTitle>
      <DialogDescription>
        Masz niezapisane zmiany. Czy na pewno chcesz opuścić stronę? Wszystkie zmiany zostaną utracone.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter>
      <Button variant="ghost" onClick={onClose}>
        Kontynuuj edycję
      </Button>
      <Button variant="destructive" onClick={onDiscard}>
        Odrzuć zmiany
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Propsy:**
```typescript
interface DiscardChangesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => void;
}
```

### 4.5. FormActions (Modified)

**Rozszerzone propsy z Recipe Create:**

```typescript
interface FormActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean; // NEW
  saveButtonLabel?: string; // NEW (default: "Zapisz przepis")
}
```

Implementacja:
```tsx
<div className="form-actions sticky bottom-0 bg-white border-t p-4 flex gap-4 justify-end shadow-lg">
  <Button
    type="button"
    onClick={onCancel}
    variant="ghost"
    disabled={isSubmitting}
  >
    Anuluj
  </Button>

  <Button
    type="submit"
    disabled={!isValid || isSubmitting}
  >
    {isSubmitting ? (
      <>
        <Spinner className="h-4 w-4 mr-2" />
        Zapisywanie...
      </>
    ) : (
      saveButtonLabel || 'Zapisz przepis'
    )}
  </Button>
</div>
```

## 5. Typy

### 5.1. Istniejące typy

Używa tych samych typów co Recipe Create:
- `CreateRecipeDto` (request body)
- `RecipeResponseDto` (response)
- `createRecipeSchema` (Zod validation)

## 6. Integracja API

### 6.1. Endpoint: GET /api/recipes/:id (fetch for pre-fill)

**Request:**
```
GET /api/recipes/550e8400-e29b-41d4-a716-446655440000
```

**Response:** `RecipeResponseDto` (same as Recipe Details)

### 6.2. Endpoint: PUT /api/recipes/:id (update)

**Request:**
```
PUT /api/recipes/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "name": "Spaghetti Carbonara (Updated)",
  "instructions": "1. Boil pasta al dente...\n2. Cook bacon crispy...",
  "ingredients": [
    {
      "name": "spaghetti",
      "quantity": 600,
      "unit": "g",
      "sort_order": 0
    }
    // ... other ingredients
  ]
}
```

**Response (200 OK):**
```typescript
RecipeResponseDto
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  user_id: "123e4567-e89b-12d3-a456-426614174000",
  name: "Spaghetti Carbonara (Updated)",
  instructions: "1. Boil pasta al dente...",
  created_at: "2025-01-26T10:00:00Z",
  updated_at: "2025-01-26T11:30:00Z", // UPDATED
  ingredients: [
    // ... new ingredients with new IDs (full replacement)
  ]
}
```

**Error Responses:**
- 400 Bad Request (validation)
- 401 Unauthorized
- 404 Not Found

**Note:** Zmiany propagują się do meal plan assignments (live update), ale NIE do wcześniej zapisanych shopping lists (snapshot pattern).

## 7. Interakcje użytkownika

### 7.1. Edycja przepisu

**Przepływ:**
1. User wchodzi na `/recipes/:id/edit` (z Recipe Details)
2. Fetch existing recipe → pre-fill form
3. User modyfikuje pola
4. `isDirty` becomes true
5. User klika "Zapisz zmiany" → PUT mutation
6. Success → toast + redirect do `/recipes/:id`

### 7.2. Anulowanie z dirty form

**Przepływ:**
1. User modyfikuje formularz (`isDirty = true`)
2. User klika "Anuluj"
3. DiscardChangesDialog otwiera się
4. User wybiera:
   - "Kontynuuj edycję" → dialog zamyka się
   - "Odrzuć zmiany" → redirect do `/recipes/:id`

### 7.3. Anulowanie z clean form

**Przepływ:**
1. User nie modyfikował formularza (`isDirty = false`)
2. User klika "Anuluj"
3. Natychmiastowy redirect do `/recipes/:id` (brak dialogu)

## 8. Warunki i walidacja

### 8.1. Walidacja identyczna jak Recipe Create

- Name: 3-100 znaków
- Instructions: 10-5000 znaków
- Ingredients: min 1, max 50
- Wszystkie validation messages takie same

### 8.2. Warunek: Show discard dialog

```typescript
const handleCancel = () => {
  if (isDirty) {
    setDiscardDialogOpen(true);
  } else {
    router.push(`/recipes/${recipeId}`);
  }
};
```

### 8.3. Warunek: Enable save button

```typescript
<Button disabled={!isValid || isSubmitting}>
  Zapisz zmiany
</Button>
```

## 9. Obsługa błędów

### 9.1. Recipe not found (404) podczas fetch

- Error message: "Przepis nie znaleziony"
- Link do `/recipes`

### 9.2. Update failed (400, 500)

- Toast z komunikatem błędu
- User pozostaje w formularzu
- Może spróbować ponownie

### 9.3. Unauthorized (401)

- Redirect do `/login?redirect=/recipes/:id/edit`

## 10. Kroki implementacji

### Krok 1: Struktura plików

```
src/
├── pages/
│   └── recipes/
│       └── [id]/
│           └── edit.astro
├── components/
│   └── recipes/
│       ├── RecipeEditView.tsx
│       ├── RecipeEditForm.tsx (reuses Recipe Create components)
│       ├── InfoAlert.tsx
│       └── DiscardChangesDialog.tsx
```

### Krok 2: Fetch existing recipe z pre-fill

### Krok 3: PUT mutation z invalidation

### Krok 4: Dirty state tracking z discard dialog

### Krok 5: Info alert o propagacji zmian

### Krok 6: Testy (reuse Recipe Create tests z modifications)

---

**Koniec planu implementacji widoku Recipe Edit**
