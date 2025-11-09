# Plan implementacji widoku Recipe Create

## 1. Przegląd

Widok Recipe Create umożliwia użytkownikom dodawanie nowych przepisów do swojej kolekcji w aplikacji ShopMate. Jest to formularz z walidacją w czasie rzeczywistym, dynamiczną listą składników oraz responsywnym layoutem. Główne funkcjonalności to: walidacja inline, character counter dla instrukcji, dynamiczne dodawanie/usuwanie składników (min 1, max 50), oraz integracja z API przez TanStack Query mutation.

Po pomyślnym zapisaniu przepisu użytkownik jest przekierowywany do widoku szczegółów nowo utworzonego przepisu z toast notification "Przepis dodany pomyślnie".

## 2. Routing widoku

**Ścieżka:** `/recipes/new`

**Typ:** Strona Astro z dynamicznym komponentem React (client:load)

**Zabezpieczenia:**
- Middleware sprawdza autentykację użytkownika
- Brak sesji → przekierowanie do `/login?redirect=/recipes/new`
- RLS zapewnia że utworzony przepis jest przypisany do zalogowanego użytkownika

## 3. Struktura komponentów

```
src/pages/recipes/new.astro (Astro page)
└── RecipeCreateView.tsx (React component, client:load)
    └── RecipeForm.tsx
        ├── FormHeader.tsx
        │   └── Breadcrumbs ("Przepisy > Dodaj przepis")
        ├── NameInput.tsx
        │   └── Error message (conditional)
        ├── InstructionsTextarea.tsx
        │   ├── Character counter (5000/5000)
        │   └── Error message (conditional)
        ├── IngredientsList.tsx
        │   ├── IngredientRow.tsx × n (min 1, max 50)
        │   │   ├── QuantityInput
        │   │   ├── UnitInput
        │   │   ├── NameInput
        │   │   └── DeleteButton (icon button)
        │   └── AddIngredientButton
        └── FormActions.tsx (sticky bottom)
            ├── CancelButton
            └── SaveButton (disabled if invalid)
```

## 4. Szczegóły komponentów

### 4.1. RecipeCreateView (Główny kontener)

**Opis:**
Główny kontener widoku zawierający formularz tworzenia przepisu.

**Główne elementy:**
```tsx
<div className="recipe-create-view">
  <div className="container mx-auto max-w-3xl p-4">
    <RecipeForm />
  </div>
</div>
```

**Propsy:** Brak

### 4.2. RecipeForm

**Opis:**
Formularz zarządzający stanem wszystkich pól (name, instructions, ingredients). Używa `react-hook-form` z `zod` resolver dla walidacji. Implementuje TanStack Query mutation do POST /api/recipes.

**Główne elementy:**
```tsx
<form onSubmit={handleSubmit(onSubmit)} className="recipe-form">
  <FormHeader />

  <div className="space-y-6">
    <NameInput
      value={watch('name')}
      onChange={(value) => setValue('name', value)}
      error={errors.name?.message}
    />

    <InstructionsTextarea
      value={watch('instructions')}
      onChange={(value) => setValue('instructions', value)}
      error={errors.instructions?.message}
    />

    <IngredientsList
      ingredients={fields}
      onAdd={append}
      onRemove={remove}
      onUpdate={(index, field, value) => update(index, { ...fields[index], [field]: value })}
      errors={errors.ingredients}
    />
  </div>

  <FormActions
    onCancel={() => router.back()}
    isSubmitting={mutation.isLoading}
    isValid={isValid}
  />
</form>
```

**Obsługiwane interakcje:**
- Submit → mutation → POST /api/recipes
- Success → redirect do /recipes/:id + toast
- Error → toast z retry

**Typy:**
```typescript
interface RecipeFormData {
  name: string;
  instructions: string;
  ingredients: IngredientInputDto[];
}
```

### 4.3. NameInput

**Opis:**
Input dla nazwy przepisu z walidacją inline (3-100 znaków).

**Główne elementy:**
```tsx
<div className="name-input-field">
  <Label htmlFor="recipe-name">
    Nazwa przepisu <span className="text-red-500">*</span>
  </Label>
  <Input
    id="recipe-name"
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder="np. Spaghetti Carbonara"
    aria-invalid={!!error}
    aria-describedby={error ? 'name-error' : undefined}
    autoFocus
  />
  {error && (
    <p id="name-error" className="text-sm text-red-600 mt-1">
      {error}
    </p>
  )}
</div>
```

**Obsługiwana walidacja:**
- Min 3 znaki, max 100
- Trim whitespace
- Required field

**Propsy:**
```typescript
interface NameInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}
```

### 4.4. InstructionsTextarea

**Opis:**
Textarea dla instrukcji z auto-resize i character counter (10-5000 znaków).

**Główne elementy:**
```tsx
<div className="instructions-field">
  <Label htmlFor="recipe-instructions">
    Instrukcje <span className="text-red-500">*</span>
  </Label>
  <Textarea
    id="recipe-instructions"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder="Opisz krok po kroku jak przygotować przepis..."
    rows={8}
    className="resize-none"
    aria-invalid={!!error}
    aria-describedby={error ? 'instructions-error' : 'instructions-counter'}
  />
  <div className="flex justify-between items-center mt-1">
    <p id="instructions-counter" className="text-sm text-gray-600">
      {value.length}/5000
    </p>
    {error && (
      <p id="instructions-error" className="text-sm text-red-600">
        {error}
      </p>
    )}
  </div>
</div>
```

**Obsługiwana walidacja:**
- Min 10 znaków, max 5000
- Required field

**Propsy:**
```typescript
interface InstructionsTextareaProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}
```

### 4.5. IngredientsList

**Opis:**
Dynamiczna lista składników z możliwością dodawania/usuwania. Min 1 składnik (nie można usunąć ostatniego), max 50.

**Główne elementy:**
```tsx
<div className="ingredients-list">
  <Label>
    Składniki <span className="text-red-500">*</span>
  </Label>
  <p className="text-sm text-gray-600 mb-4">
    Dodaj składniki (minimum 1, maksimum 50)
  </p>

  <div className="space-y-3">
    {ingredients.map((ingredient, index) => (
      <IngredientRow
        key={ingredient.id}
        index={index}
        ingredient={ingredient}
        onUpdate={(field, value) => onUpdate(index, field, value)}
        onRemove={() => onRemove(index)}
        canRemove={ingredients.length > 1}
        error={errors?.[index]}
      />
    ))}
  </div>

  <Button
    type="button"
    onClick={() => onAdd({ name: '', quantity: null, unit: null, sort_order: ingredients.length })}
    variant="outline"
    disabled={ingredients.length >= 50}
    className="mt-4 w-full"
  >
    <Plus className="h-4 w-4 mr-2" />
    Dodaj składnik
  </Button>
</div>
```

**Obsługiwane interakcje:**
- Click "+ Dodaj składnik" → append nowy wiersz
- Click delete na wierszu → remove (jeśli length > 1)
- Update pola → update w array

**Obsługiwana walidacja:**
- Min 1 składnik (nie można usunąć ostatniego)
- Max 50 składników (button disabled)

**Propsy:**
```typescript
interface IngredientsListProps {
  ingredients: IngredientInputDto[];
  onAdd: (ingredient: IngredientInputDto) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof IngredientInputDto, value: any) => void;
  errors?: Record<number, any>;
}
```

### 4.6. IngredientRow

**Opis:**
Pojedynczy wiersz składnika z 3 inputami (ilość, jednostka, nazwa) + przycisk delete.

**Główne elementy:**
```tsx
<div className="ingredient-row flex gap-2 items-start">
  <div className="w-24">
    <Input
      type="number"
      value={ingredient.quantity ?? ''}
      onChange={(e) => onUpdate('quantity', e.target.value ? Number(e.target.value) : null)}
      placeholder="200"
      min="0"
      step="0.01"
    />
  </div>

  <div className="w-24">
    <Input
      type="text"
      value={ingredient.unit ?? ''}
      onChange={(e) => onUpdate('unit', e.target.value || null)}
      placeholder="g"
      maxLength={50}
    />
  </div>

  <div className="flex-1">
    <Input
      type="text"
      value={ingredient.name}
      onChange={(e) => onUpdate('name', e.target.value)}
      placeholder="mąka"
      maxLength={100}
      aria-invalid={!!error?.name}
      required
    />
    {error?.name && (
      <p className="text-sm text-red-600 mt-1">{error.name.message}</p>
    )}
  </div>

  <Button
    type="button"
    onClick={onRemove}
    variant="ghost"
    size="icon"
    disabled={!canRemove}
    aria-label="Usuń składnik"
    className="mt-0"
  >
    <Trash2 className="h-4 w-4 text-red-600" />
  </Button>
</div>
```

**Obsługiwane interakcje:**
- Input quantity → update
- Input unit → update
- Input name → update (required)
- Click delete → onRemove (disabled jeśli !canRemove)

**Obsługiwana walidacja:**
- Quantity: positive number, optional
- Unit: max 50 chars, optional
- Name: 1-100 chars, required

**Propsy:**
```typescript
interface IngredientRowProps {
  index: number;
  ingredient: IngredientInputDto;
  onUpdate: (field: keyof IngredientInputDto, value: any) => void;
  onRemove: () => void;
  canRemove: boolean;
  error?: any;
}
```

### 4.7. FormActions (Sticky bottom)

**Opis:**
Sticky footer z przyciskami Cancel i Save.

**Główne elementy:**
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
      'Zapisz przepis'
    )}
  </Button>
</div>
```

**Obsługiwane interakcje:**
- Click Anuluj → onCancel() → router.back() lub /recipes
- Click Zapisz → form submit (disabled jeśli invalid lub submitting)

**Obsługiwana walidacja:**
- Save button disabled jeśli formularz invalid

**Propsy:**
```typescript
interface FormActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  isValid: boolean;
}
```

### 4.8. FormHeader

**Opis:**
Nagłówek z breadcrumbs i tytułem.

**Główne elementy:**
```tsx
<div className="form-header mb-6">
  <Breadcrumbs items={[
    { label: 'Przepisy', href: '/recipes' },
    { label: 'Dodaj przepis', href: '/recipes/new' }
  ]} />

  <h1 className="text-3xl font-bold text-gray-900 mt-4">
    Dodaj nowy przepis
  </h1>
</div>
```

**Propsy:** Brak

## 5. Typy

### 5.1. Istniejące typy (z src/types.ts)

```typescript
export interface IngredientInputDto {
  name: string;
  quantity: number | null;
  unit: string | null;
  sort_order: number;
}

export interface CreateRecipeDto {
  name: string;
  instructions: string;
  ingredients: IngredientInputDto[];
}

export interface RecipeResponseDto extends Recipe {
  ingredients: IngredientResponseDto[];
  meal_plan_assignments?: number;
}
```

### 5.2. Validation schema (Zod)

Używamy istniejącego schema z `src/lib/validation/recipe.schema.ts`:

```typescript
import { z } from 'zod';

export const ingredientInputSchema = z.object({
  name: z.string().trim().min(1, 'Nazwa składnika jest wymagana').max(100),
  quantity: z.number().positive('Ilość musi być dodatnia').nullable(),
  unit: z.string().trim().max(50).nullable(),
  sort_order: z.number().int().min(0).default(0),
});

export const createRecipeSchema = z.object({
  name: z.string().trim().min(3, 'Nazwa musi mieć minimum 3 znaki').max(100, 'Nazwa może mieć maksimum 100 znaków'),
  instructions: z.string().trim().min(10, 'Instrukcje muszą mieć minimum 10 znaków').max(5000, 'Instrukcje mogą mieć maksimum 5000 znaków'),
  ingredients: z.array(ingredientInputSchema).min(1, 'Wymagany jest minimum 1 składnik').max(50, 'Maksimum 50 składników'),
});

export type CreateRecipeFormData = z.infer<typeof createRecipeSchema>;
```

## 6. Zarządzanie stanem

### 6.1. React Hook Form + Zod

```typescript
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function RecipeForm() {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CreateRecipeFormData>({
    resolver: zodResolver(createRecipeSchema),
    mode: 'onChange', // Validate on change for instant feedback
    defaultValues: {
      name: '',
      instructions: '',
      ingredients: [
        { name: '', quantity: null, unit: null, sort_order: 0 }
      ],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'ingredients',
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateRecipeFormData) => {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create recipe');
      }

      return response.json() as Promise<RecipeResponseDto>;
    },
    onSuccess: (newRecipe) => {
      toast.success('Przepis dodany pomyślnie');
      router.push(`/recipes/${newRecipe.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Nie udało się dodać przepisu');
    },
  });

  const onSubmit = (data: CreateRecipeFormData) => {
    // Assign sort_order based on index
    const dataWithSortOrder = {
      ...data,
      ingredients: data.ingredients.map((ing, index) => ({
        ...ing,
        sort_order: index,
      })),
    };

    mutation.mutate(dataWithSortOrder);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

### 6.2. Stan lokalny

- `useForm` zarządza całym stanem formularza
- `useFieldArray` dla dynamicznych składników
- `mutation` (TanStack Query) dla POST request
- Brak dodatkowego state poza react-hook-form

## 7. Integracja API

### 7.1. Endpoint: POST /api/recipes

**Request:**
```
POST /api/recipes
Content-Type: application/json

{
  "name": "Spaghetti Carbonara",
  "instructions": "1. Boil pasta...\n2. Cook bacon...",
  "ingredients": [
    {
      "name": "spaghetti",
      "quantity": 500,
      "unit": "g",
      "sort_order": 0
    },
    {
      "name": "bacon",
      "quantity": 200,
      "unit": "g",
      "sort_order": 1
    }
  ]
}
```

**Response (201 Created):**
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
    // ... other ingredients
  ]
}
```

**Error Responses:**

**400 Bad Request (Validation Error):**
```json
{
  "error": "Validation failed",
  "details": {
    "name": ["Name must be between 3 and 100 characters"],
    "instructions": ["Instructions must be between 10 and 5000 characters"],
    "ingredients": ["At least 1 ingredient required, maximum 50"]
  }
}
```

**401 Unauthorized:**
```json
{
  "error": "Authentication required"
}
```

## 8. Interakcje użytkownika

### 8.1. Wypełnianie formularza

**Przepływ:**
1. Użytkownik wchodzi na `/recipes/new`
2. Auto-focus na input "Nazwa przepisu"
3. User wpisuje nazwę → validation on change
4. User wpisuje instrukcje → character counter update
5. User wypełnia pierwszy składnik (name required)
6. User klika "+ Dodaj składnik" → nowy wiersz
7. User wypełnia kolejne składniki
8. Formularz valid → przycisk "Zapisz" enabled

### 8.2. Dodawanie składnika

**Przepływ:**
1. Click "+ Dodaj składnik"
2. `append()` nowy wiersz na końcu listy
3. Focus na first input nowego wiersza (quantity)
4. User wypełnia pola

### 8.3. Usuwanie składnika

**Przepływ:**
1. Click ikona trash na wierszu składnika
2. Jeśli `ingredients.length > 1` → `remove(index)`
3. Jeśli ostatni składnik → button disabled (tooltip: "Wymagany minimum 1 składnik")

### 8.4. Submit formularza

**Przepływ:**
1. User klika "Zapisz przepis"
2. `handleSubmit` trigger → `onSubmit(data)`
3. `mutation.mutate(data)` → POST /api/recipes
4. Button disabled + spinner "Zapisywanie..."
5. Success → toast + redirect do `/recipes/:id`
6. Error → toast z komunikatem błędu

### 8.5. Anulowanie

**Przepływ:**
1. User klika "Anuluj"
2. `router.back()` lub `/recipes`
3. Opcjonalnie: dialog "Odrzucić zmiany?" jeśli formularz dirty

## 9. Warunki i walidacja

### 9.1. Walidacja nazwa przepisu

- Min 3 znaki
- Max 100 znaków
- Trim whitespace
- Required field
- Error message: "Nazwa musi mieć minimum 3 znaki"

### 9.2. Walidacja instrukcje

- Min 10 znaków
- Max 5000 znaków
- Required field
- Character counter realtime
- Error message: "Instrukcje muszą mieć minimum 10 znaków"

### 9.3. Walidacja składniki lista

- Min 1 składnik
- Max 50 składników
- Button "+ Dodaj składnik" disabled jeśli length === 50
- Delete button disabled jeśli length === 1
- Error message: "Wymagany jest minimum 1 składnik"

### 9.4. Walidacja pojedynczego składnika

- Name: 1-100 znaków, required
- Quantity: positive number, optional
- Unit: max 50 znaków, optional
- sort_order: auto-assigned based on index

### 9.5. Warunek: Enable/disable submit button

```typescript
<Button
  type="submit"
  disabled={!isValid || mutation.isLoading}
>
  Zapisz przepis
</Button>
```

- Disabled jeśli formularz invalid (react-hook-form `isValid`)
- Disabled podczas submit (mutation.isLoading)

## 10. Obsługa błędów

### 10.1. Validation errors (client-side)

- Real-time validation przy wpisywaniu
- Error messages pod polami z aria-describedby
- Red border na invalid inputs

### 10.2. API errors (400 Bad Request)

- Toast: "Błąd walidacji: [szczegóły]"
- Error messages pod polami (jeśli server-side validation zwraca field-specific errors)

### 10.3. Auth errors (401)

- Redirect do `/login?redirect=/recipes/new`

### 10.4. Network errors

- Toast: "Nie udało się dodać przepisu. Sprawdź połączenie z internetem."
- Przycisk retry w toaście

### 10.5. Server errors (500)

- Toast: "Wystąpił błąd serwera. Spróbuj ponownie za chwilę."

## 11. Kroki implementacji

### Krok 1: Utworzenie struktury plików

```
src/
├── pages/
│   └── recipes/
│       └── new.astro
├── components/
│   └── recipes/
│       ├── RecipeCreateView.tsx
│       ├── RecipeForm.tsx
│       ├── FormHeader.tsx
│       ├── NameInput.tsx
│       ├── InstructionsTextarea.tsx
│       ├── IngredientsList.tsx
│       ├── IngredientRow.tsx
│       └── FormActions.tsx
└── lib/
    └── validation/
        └── recipe.schema.ts (już istnieje)
```

### Krok 2: Implementacja validation schema (Zod)

Użyć istniejącego `recipe.schema.ts` lub utworzyć zgodnie z sekcją 5.2.

### Krok 3: Implementacja RecipeForm z react-hook-form

- Setup useForm z zodResolver
- Setup useFieldArray dla ingredients
- Setup useMutation dla POST /api/recipes
- Handlers: onSubmit, append, remove, update

### Krok 4: Implementacja komponentów form fields

- NameInput
- InstructionsTextarea (z character counter)
- IngredientsList
- IngredientRow
- FormActions

### Krok 5: Stylowanie Tailwind + responsywność

- Mobile: vertical layout, full-width inputs
- Desktop: layout z max-width, spacing
- Sticky FormActions na bottom

### Krok 6: Accessibility

- Labels dla wszystkich inputs
- aria-invalid, aria-describedby
- Focus management (auto-focus name)
- Keyboard navigation

### Krok 7: Testy

- Unit tests dla validation schema
- Component tests dla form fields
- Integration test dla full form submission

### Krok 8: Deploy i smoke test

---

**Koniec planu implementacji widoku Recipe Create**
