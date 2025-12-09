# Struktura Komponentów RecipeCreateView

## Drzewo Komponentów ASCII

```
RecipeCreateView
├── QueryProvider
│   └── QueryClientProvider (@tanstack/react-query)
│       ├── div.recipe-create-view
│       │   └── div.container
│       │       └── RecipeForm
│       │           ├── form
│       │           │   ├── FormHeader
│       │           │   │   └── Breadcrumbs
│       │           │   │       └── nav (aria-label="Breadcrumb")
│       │           │   │           └── ol
│       │           │   │               └── li
│       │           │   │                   ├── a (href="/recipes")
│       │           │   │                   └── span (aria-current="page")
│       │           │   │
│       │           │   ├── Controller (name="name")
│       │           │   │   └── NameInput
│       │           │   │       ├── Label (shadcn/ui)
│       │           │   │       ├── Input (shadcn/ui)
│       │           │   │       └── p (error message)
│       │           │   │
│       │           │   ├── Controller (name="instructions")
│       │           │   │   └── InstructionsTextarea
│       │           │   │       ├── Label (shadcn/ui)
│       │           │   │       ├── Textarea (shadcn/ui)
│       │           │   │       └── div
│       │           │   │           ├── p (character counter)
│       │           │   │           └── p (error message)
│       │           │   │
│       │           │   ├── IngredientsList
│       │           │   │   ├── Label (shadcn/ui)
│       │           │   │   ├── div[role="list"]
│       │           │   │   │   └── IngredientRow × N (1-50 instances)
│       │           │   │   │       ├── Input (shadcn/ui) - quantity
│       │           │   │   │       ├── Input (shadcn/ui) - unit
│       │           │   │   │       ├── Input (shadcn/ui) - name
│       │           │   │   │       ├── Button (shadcn/ui) - delete
│       │           │   │   │       │   └── Trash2 (lucide-react)
│       │           │   │   │       └── p (error message)
│       │           │   │   │
│       │           │   │   ├── Button (shadcn/ui) - add ingredient
│       │           │   │   │   └── Plus (lucide-react)
│       │           │   │   └── div.bg-blue-50 (helper text)
│       │           │   │
│       │           │   └── FormActions
│       │           │       ├── Button (shadcn/ui) - Cancel
│       │           │       └── Button (shadcn/ui) - Submit
│       │           │           └── Loader2 (lucide-react)
│       │           │
│       │           └── (react-hook-form logic)
│       │               ├── useForm
│       │               ├── useFieldArray
│       │               └── useMutation (@tanstack/react-query)
│       │
│       └── Toaster (sonner via shadcn/ui)
```

## Opis Komponentów

### Główne Komponenty

#### RecipeCreateView

- **Lokalizacja**: `src/components/recipes/RecipeCreateView.tsx:13`
- **Rola**: Główny kontener widoku tworzenia przepisu
- **Cechy**: Wraps form with QueryProvider for TanStack Query

#### QueryProvider

- **Lokalizacja**: `src/components/providers/QueryProvider.tsx:8`
- **Rola**: Dostarcza context dla TanStack Query
- **Konfiguracja**:
  - staleTime: 0
  - refetchOnWindowFocus: true
  - retry: 3 (exponential backoff)

#### RecipeForm

- **Lokalizacja**: `src/components/recipes/RecipeForm.tsx:21`
- **Rola**: Główny formularz z logiką walidacji i submisji
- **Hooki**:
  - `useForm` - zarządzanie stanem formularza (react-hook-form)
  - `useFieldArray` - dynamiczna lista składników
  - `useMutation` - POST /api/recipes (TanStack Query)
- **Walidacja**: Zod schema (RecipeSchema)

### Komponenty Formularza

#### FormHeader

- **Lokalizacja**: `src/components/recipes/FormHeader.tsx:45`
- **Rola**: Nagłówek z breadcrumbs i tytułem
- **Podkomponenty**:
  - **Breadcrumbs** (FormHeader.tsx:11) - nawigacja okruszkowa
- **Props**: mode (create|edit), recipeName (optional)

#### NameInput

- **Lokalizacja**: `src/components/recipes/NameInput.tsx:19`
- **Rola**: Pole nazwy przepisu z walidacją
- **Walidacja**: 3-100 znaków, wymagane
- **Cechy**: autofocus, error handling, ARIA attributes

#### InstructionsTextarea

- **Lokalizacja**: `src/components/recipes/InstructionsTextarea.tsx:19`
- **Rola**: Pole instrukcji z licznikiem znaków
- **Walidacja**: 10-5000 znaków, wymagane
- **Cechy**:
  - Character counter (5000 max)
  - Warning przy 90% limitu
  - 8 wierszy textarea
  - aria-live="polite" dla licznika

#### IngredientsList

- **Lokalizacja**: `src/components/recipes/IngredientsList.tsx:24`
- **Rola**: Zarządzanie dynamiczną listą składników
- **Limity**: min 1, max 50 składników
- **Cechy**:
  - Przycisk "Dodaj składnik" (disabled przy 50)
  - Helper text z wskazówkami
  - role="list" dla accessibility

#### IngredientRow

- **Lokalizacja**: `src/components/recipes/IngredientRow.tsx:24`
- **Rola**: Pojedynczy wiersz składnika
- **Pola**:
  - **quantity** (number, optional) - szerokość 24 (w-24)
  - **unit** (text, optional, max 50) - szerokość 24 (w-24)
  - **name** (text, required, max 100) - flex-1
  - **delete button** (icon) - Trash2 icon
- **Cechy**: Error handling per field, ARIA labels

#### FormActions

- **Lokalizacja**: `src/components/recipes/FormActions.tsx:20`
- **Rola**: Sticky footer z przyciskami akcji
- **Przyciski**:
  - **Anuluj** (ghost variant) - disabled podczas submisji
  - **Zapisz przepis** (primary) - disabled gdy !isValid || isSubmitting
- **Cechy**:
  - Sticky positioning (bottom-0)
  - Loading state z Loader2 icon
  - Dirty check w handleCancel

### UI Components (shadcn/ui)

- **Label**: `@/components/ui/label`
- **Input**: `@/components/ui/input`
- **Textarea**: `@/components/ui/textarea`
- **Button**: `@/components/ui/button`
- **Toaster**: `@/components/ui/toaster` (sonner)

### Ikony (lucide-react)

- **Plus**: Dodaj składnik
- **Trash2**: Usuń składnik
- **Loader2**: Loading state (animate-spin)

## Przepływ Danych

```
User Input
    ↓
react-hook-form (Controller)
    ↓
Zod Validation (RecipeSchema)
    ↓
useMutation (TanStack Query)
    ↓
POST /api/recipes
    ↓
Success → toast.success → redirect to /recipes/{id}
Error → toast.error (with retry)
```

## Walidacja (Zod Schema)

```typescript
RecipeSchema {
  name: string (3-100 chars, trim)
  instructions: string (10-5000 chars, trim)
  ingredients: array (1-50 items) {
    name: string (1-100 chars)
    quantity: number | null (positive)
    unit: string | null (max 50)
    sort_order: number (min 0, default 0)
  }
}
```

## Accessibility (WCAG AA)

- **ARIA attributes**:
  - aria-label, aria-labelledby, aria-describedby
  - aria-invalid, aria-current
  - aria-live="polite" (character counter)
  - role="list", role="listitem", role="alert"
- **Breadcrumbs**: aria-label="Breadcrumb"
- **Error messages**: role="alert" z ikoną ⚠
- **Form**: noValidate, semantic HTML

## Optymalizacje

- **React.memo**: Wszystkie komponenty używają memo
- **displayName**: Ustawione dla wszystkich komponentów
- **useCallback**: W handleCancel (RecipeForm.tsx:99)
- **Controller**: Optymalizacja re-renderów (react-hook-form)

## Routing

- **Success redirect**: `/recipes/${newRecipe.id}` (1s delay)
- **Cancel**: `window.history.back()` (z dirty check)
- **Breadcrumbs**: `/recipes` → `/recipes/new`

## Error Handling

- **Mutation errors**: toast.error z retry action
- **Validation errors**: Inline per field z czerwonym borderem
- **Network errors**: Retry z exponential backoff (TanStack Query)
- **Console logging**: console.error dla debugowania

## Styling (Tailwind CSS 4)

- **Container**: max-w-3xl, mx-auto, p-4
- **Form**: bg-white, rounded-lg, shadow-sm, p-6 sm:p-8
- **Spacing**: space-y-8, space-y-4, gap-2
- **Responsive**: sm:p-8 (mobile-first)
- **States**: hover:, focus-visible:, disabled:
- **Colors**: gray-_, blue-_, red-\* (semantic)

## Pliki Zależne

1. `src/components/recipes/RecipeCreateView.tsx` - główny kontener
2. `src/components/recipes/RecipeForm.tsx` - logika formularza
3. `src/components/recipes/FormHeader.tsx` - nagłówek + breadcrumbs
4. `src/components/recipes/NameInput.tsx` - pole nazwy
5. `src/components/recipes/InstructionsTextarea.tsx` - pole instrukcji
6. `src/components/recipes/IngredientsList.tsx` - lista składników
7. `src/components/recipes/IngredientRow.tsx` - wiersz składnika
8. `src/components/recipes/FormActions.tsx` - przyciski akcji
9. `src/components/providers/QueryProvider.tsx` - TanStack Query provider
10. `src/lib/validation/recipe.schema.ts` - schemat walidacji
11. `src/types.ts` - typy TypeScript (RecipeResponseDto, IngredientInputDto)
