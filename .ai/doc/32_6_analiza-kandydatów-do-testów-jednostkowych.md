# Analiza kandydatów do testów jednostkowych - ShopMate

Data: 2025-11-29

## Przegląd struktury komponentów

Na podstawie przeanalizowanej struktury projektu ShopMate, zidentyfikowano elementy najbardziej odpowiednie do testów jednostkowych.

---

## 🎯 PRIORYTET 1: Pure Functions & Utils

### 1. Calendar Utils (`src/lib/utils/calendar.ts`)

**Funkcje do testowania:**

- `groupCellsByDay(cells: CalendarCellViewModel[])`
- `truncateText(text: string, maxLength: number)`
- `getDayName(dayOfWeek: number)`
- `getMealTypeLabel(mealType: MealType)`

**Dlaczego:**

- ✅ Pure functions - łatwe do testowania
- ✅ Logika biznesowa (grupowanie, formatowanie)
- ✅ Brak zależności zewnętrznych
- ✅ Krytyczne dla UI kalendarza

**Przykładowe testy:**

```typescript
describe('groupCellsByDay', () => {
  it('should group cells by day of week', () => {
    const cells = [
      { dayOfWeek: 1, mealType: 'breakfast', ... },
      { dayOfWeek: 1, mealType: 'lunch', ... },
      { dayOfWeek: 2, mealType: 'breakfast', ... }
    ];
    const result = groupCellsByDay(cells);
    expect(result.get(1)).toHaveLength(2);
    expect(result.get(2)).toHaveLength(1);
  });
});

describe('truncateText', () => {
  it('should truncate text longer than maxLength', () => {
    expect(truncateText('Very long recipe name', 10)).toBe('Very long...');
  });

  it('should not truncate short text', () => {
    expect(truncateText('Short', 10)).toBe('Short');
  });
});
```

---

### 2. Date Utils (`src/lib/utils/date.ts`)

**Funkcje do testowania:**

- `getCurrentWeekStart(): string`
- `getMealTypeLabel(mealType: MealType): string`
- `getDayName(dayOfWeek: number): string`
- `formatDate(date: Date): string`

**Dlaczego:**

- ✅ Pure functions
- ✅ Logika dat jest podatna na błędy
- ✅ Używane w wielu miejscach (calendar, wizard)
- ✅ Edge cases (przełom roku, miesiąca, strefy czasowe)

---

### 3. Wizard Reducer (`ShoppingListWizard.tsx`)

```typescript
function wizardReducer(state: WizardState, action: WizardAction): WizardState;
```

**Dlaczego:**

- ✅ Pure function - deterministyczna
- ✅ Złożona logika state management
- ✅ Wiele akcji do przetestowania (TOGGLE_MEAL, ADD_ITEM, UPDATE_ITEM)
- ✅ Krytyczna dla flow wizarda

**Przykładowe testy:**

```typescript
describe("wizardReducer", () => {
  describe("TOGGLE_MEAL", () => {
    it("should add meal to empty selectedMeals", () => {
      const state = { ...initialState, selectedMeals: [] };
      const action = {
        type: "TOGGLE_MEAL",
        payload: { dayOfWeek: 1, mealType: "breakfast" },
      };
      const newState = wizardReducer(state, action);

      expect(newState.selectedMeals).toHaveLength(1);
      expect(newState.selectedMeals[0]).toEqual({
        day_of_week: 1,
        meal_types: ["breakfast"],
      });
    });

    it("should remove meal type when toggling selected meal", () => {
      const state = {
        ...initialState,
        selectedMeals: [{ day_of_week: 1, meal_types: ["breakfast"] }],
      };
      const action = {
        type: "TOGGLE_MEAL",
        payload: { dayOfWeek: 1, mealType: "breakfast" },
      };
      const newState = wizardReducer(state, action);

      expect(newState.selectedMeals).toHaveLength(0);
    });
  });

  describe("UPDATE_ITEM", () => {
    it("should update item at specific index", () => {
      const state = {
        ...initialState,
        modifiedItems: [{ ingredient_name: "Mleko", quantity: 1, unit: "l", category: "Nabiał" }],
      };
      const action = {
        type: "UPDATE_ITEM",
        payload: { index: 0, field: "quantity", value: 2 },
      };
      const newState = wizardReducer(state, action);

      expect(newState.modifiedItems[0].quantity).toBe(2);
    });
  });
});
```

---

## 🎯 PRIORYTET 2: Validation Schemas (Zod)

### 4. Recipe Schema (`src/lib/validation/recipe.schema.ts`)

```typescript
export const RecipeSchema = z.object({
  name: z.string().min(3).max(100),
  instructions: z.string().min(10).max(5000),
  ingredients: z.array(...).min(1).max(50)
});
```

**Dlaczego:**

- ✅ Krytyczne dla bezpieczeństwa danych
- ✅ Łatwe do testowania (input → validation result)
- ✅ Wiele edge cases (granice, trim, optional fields)
- ✅ Używane w API i formach

**Przykładowe testy:**

```typescript
describe("RecipeSchema", () => {
  it("should accept valid recipe", () => {
    const valid = {
      name: "Spaghetti Bolognese",
      instructions: "Cook pasta. Add sauce. Enjoy your meal!",
      ingredients: [{ name: "Pasta", quantity: 500, unit: "g", sort_order: 0 }],
    };

    expect(() => RecipeSchema.parse(valid)).not.toThrow();
  });

  it("should reject name too short", () => {
    const invalid = {
      name: "Ab",
      instructions: "Valid instructions here",
      ingredients: [{ name: "Pasta", quantity: null, unit: null, sort_order: 0 }],
    };

    expect(() => RecipeSchema.parse(invalid)).toThrow();
  });

  it("should trim whitespace from name", () => {
    const input = {
      name: "  Pasta  ",
      instructions: "Cook it well",
      ingredients: [{ name: "Pasta", quantity: null, unit: null, sort_order: 0 }],
    };

    const result = RecipeSchema.parse(input);
    expect(result.name).toBe("Pasta");
  });

  it("should require at least 1 ingredient", () => {
    const invalid = {
      name: "Recipe",
      instructions: "Instructions",
      ingredients: [],
    };

    expect(() => RecipeSchema.parse(invalid)).toThrow();
  });
});
```

---

### 5. Shopping List Schema (`src/lib/validation/shopping-list.schema.ts`)

**Dlaczego:**

- ✅ Walidacja kategorii (CATEGORY_ORDER)
- ✅ Agregacja składników
- ✅ Opcjonalne pola (quantity, unit)

---

## 🎯 PRIORYTET 3: Custom Hooks (React Testing Library)

### 6. useCalendar Hook (`src/components/hooks/useCalendar.ts`)

**Dlaczego:**

- ✅ Złożona logika state management (modals, selections)
- ✅ Można testować bez renderowania całego komponentu
- ✅ Wiele edge cases (empty state, loading, error)

**Przykładowe testy:**

```typescript
import { renderHook, act } from "@testing-library/react";
import { useCalendar } from "./useCalendar";

describe("useCalendar", () => {
  it("should initialize with current week", () => {
    const { result } = renderHook(() => useCalendar());

    expect(result.current.weekStartDate).toBeTruthy();
    expect(result.current.assignments).toEqual([]);
  });

  it("should open recipe picker when assigning recipe", () => {
    const { result } = renderHook(() => useCalendar());

    act(() => {
      result.current.handleAssignRecipe(1, "breakfast");
    });

    expect(result.current.recipePickerState.isOpen).toBe(true);
    expect(result.current.recipePickerState.targetCell).toEqual({
      dayOfWeek: 1,
      mealType: "breakfast",
    });
  });
});
```

---

## 🎯 PRIORYTET 4: Komponenty Prezentacyjne

### 7. MealCell Component (`src/components/MealCell.tsx`)

**Dlaczego:**

- ✅ Komponent prezentacyjny (props → UI)
- ✅ Dwa stany: empty vs assigned
- ✅ Event handlers (onClick)
- ✅ Accessibility (aria-labels)

**Przykładowe testy:**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MealCell } from './MealCell';

describe('MealCell', () => {
  describe('Empty state', () => {
    it('should render assign button when no assignment', () => {
      const onAssign = vi.fn();
      render(
        <MealCell
          dayOfWeek={1}
          mealType="breakfast"
          mealTypeLabel="Śniadanie"
          assignment={null}
          onAssignRecipe={onAssign}
          onRemoveAssignment={vi.fn()}
          onPreviewRecipe={vi.fn()}
        />
      );

      expect(screen.getByText('Śniadanie')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /przypisz przepis/i })).toBeInTheDocument();
    });

    it('should call onAssignRecipe when clicking assign button', () => {
      const onAssign = vi.fn();
      render(<MealCell {...props} onAssignRecipe={onAssign} />);

      fireEvent.click(screen.getByRole('button', { name: /przypisz przepis/i }));
      expect(onAssign).toHaveBeenCalledWith(1, 'breakfast');
    });
  });

  describe('Assigned state', () => {
    const assignment = {
      id: '123',
      recipe_id: '456',
      recipe_name: 'Jajecznica',
      day_of_week: 1,
      meal_type: 'breakfast'
    };

    it('should render recipe name when assigned', () => {
      render(<MealCell {...props} assignment={assignment} />);

      expect(screen.getByText('Jajecznica')).toBeInTheDocument();
    });

    it('should call onPreviewRecipe when clicking recipe name', () => {
      const onPreview = vi.fn();
      render(<MealCell {...props} assignment={assignment} onPreviewRecipe={onPreview} />);

      fireEvent.click(screen.getByText('Jajecznica'));
      expect(onPreview).toHaveBeenCalledWith('456', '123');
    });
  });
});
```

---

### 8. ShoppingListPreview Component (`wizard/ShoppingListPreview.tsx`)

**Dlaczego:**

- ✅ Logika grupowania po kategoriach (useMemo)
- ✅ Funkcja `getGlobalIndex()` - krytyczna dla edycji
- ✅ Renderowanie warunkowe (kategorie bez itemów)

**Przykładowe testy:**

```typescript
describe('ShoppingListPreview', () => {
  it('should group items by category', () => {
    const items = [
      { ingredient_name: 'Mleko', category: 'Nabiał', ... },
      { ingredient_name: 'Masło', category: 'Nabiał', ... },
      { ingredient_name: 'Pomidor', category: 'Warzywa', ... }
    ];

    render(<ShoppingListPreview items={items} ... />);

    expect(screen.getByText('Nabiał')).toBeInTheDocument();
    expect(screen.getByText('Warzywa')).toBeInTheDocument();
    expect(screen.queryByText('Owoce')).not.toBeInTheDocument();
  });

  it('should call onUpdateItem with correct global index', () => {
    const onUpdate = vi.fn();
    const items = [
      { ingredient_name: 'A', category: 'Nabiał' },
      { ingredient_name: 'B', category: 'Warzywa' },
      { ingredient_name: 'C', category: 'Nabiał' }
    ];

    render(<ShoppingListPreview items={items} onUpdateItem={onUpdate} ... />);

    // Edytuj trzeci item (index 2) w kategorii Nabiał
    // ... trigger edit
    expect(onUpdate).toHaveBeenCalledWith(2, 'quantity', 5);
  });
});
```

---

## 🎯 PRIORYTET 5: API Functions (Mocked)

### 9. API Service Functions (`src/lib/api/recipes.ts`)

**Dlaczego:**

- ✅ Można testować z mock fetch
- ✅ Error handling (network errors, 404, 500)
- ✅ Response parsing

**Przykładowe testy:**

```typescript
import { vi } from "vitest";
import { fetchRecipe } from "./recipes";

describe("fetchRecipe", () => {
  it("should fetch recipe by id", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "123", name: "Pasta" }),
    });

    const result = await fetchRecipe("123");

    expect(fetch).toHaveBeenCalledWith("/api/recipes/123");
    expect(result).toEqual({ id: "123", name: "Pasta" });
  });

  it("should throw error when recipe not found", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    await expect(fetchRecipe("999")).rejects.toThrow();
  });
});
```

---

## ❌ NIE TESTUJ jednostkowo:

1. **Komponenty integracyjne** (DashboardView, Calendar) - lepiej E2E (Playwright)
2. **API endpoints** (`src/pages/api/*`) - integration tests
3. **Supabase queries** - integration tests z test database
4. **Komponenty z heavy side effects** - E2E tests
5. **UI components z Shadcn** - już przetestowane przez bibliotekę

---

## 📊 Podsumowanie priorytetów:

| Priorytet | Element             | Ilość testów | Effort | Value  |
| --------- | ------------------- | ------------ | ------ | ------ |
| 🥇 **1**  | Calendar utils      | ~10          | Low    | High   |
| 🥇 **1**  | Date utils          | ~8           | Low    | High   |
| 🥇 **1**  | wizardReducer       | ~15          | Medium | High   |
| 🥈 **2**  | RecipeSchema        | ~12          | Low    | High   |
| 🥈 **2**  | ShoppingListSchema  | ~10          | Low    | High   |
| 🥉 **3**  | useCalendar hook    | ~8           | Medium | Medium |
| 🥉 **3**  | MealCell            | ~10          | Medium | Medium |
| 🥉 **3**  | ShoppingListPreview | ~8           | Medium | Medium |

---

## 🚀 Zalecana kolejność implementacji:

### Faza 1: Utils (łatwy start, wysokie pokrycie)

```
src/lib/utils/__tests__/calendar.test.ts
src/lib/utils/__tests__/date.test.ts
```

### Faza 2: Validation (krytyczne dla bezpieczeństwa)

```
src/lib/validation/__tests__/recipe.schema.test.ts
src/lib/validation/__tests__/shopping-list.schema.test.ts
```

### Faza 3: Reducers (złożona logika)

```
src/components/wizard/__tests__/wizardReducer.test.ts
```

### Faza 4: Components (prezentacyjne)

```
src/components/__tests__/MealCell.test.tsx
src/components/wizard/__tests__/ShoppingListPreview.test.tsx
```

### Faza 5: Hooks (zaawansowane)

```
src/components/hooks/__tests__/useCalendar.test.ts
```

---

## Wnioski

Projekt ShopMate posiada wiele komponentów, które są doskonałymi kandydatami do testów jednostkowych. Priorytetem są pure functions i validation schemas, które zapewnią szybkie testy i wysokie pokrycie kodu przy niskim nakładzie pracy.

**Szacowane pokrycie kodu po Fazie 1:** ~25-30%
**Szacowane pokrycie kodu po Fazie 2:** ~40-45%
**Szacowane pokrycie kodu po wszystkich fazach:** ~60-70%
