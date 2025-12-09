# Dokumentacja Testów - ShopMate

Ten dokument opisuje strategię testowania, strukturę katalogów oraz jak uruchamiać i pisać testy dla projektu ShopMate.

## Stack Testowy

- **Vitest** - framework do testów jednostkowych i integracyjnych
- **React Testing Library** - testowanie komponentów React
- **Playwright** - testy End-to-End (E2E)
- **@testing-library/jest-dom** - custom matchers dla DOM assertions

## Struktura Katalogów

```
tests/
├── README.md                 # Ten dokument
├── setup.ts                  # Globalna konfiguracja Vitest
├── helpers/                  # Helper functions i utilities
│   └── test-utils.tsx       # Custom render function z providers
├── fixtures/                 # Przykładowe dane testowe
│   └── sample-data.ts       # Factory functions dla testów
├── e2e/                      # Testy End-to-End Playwright
│   └── example.spec.ts      # Przykładowy test E2E
└── example.test.ts          # Przykładowy test jednostkowy
```

**Dodatkowo:**

- Testy jednostkowe mogą być kolokowane z kodem: `src/**/*.test.ts`
- Testy komponentów: `src/components/**/*.test.tsx`

## Uruchamianie Testów

### Testy Jednostkowe (Vitest)

```bash
# Uruchom wszystkie testy jednostkowe
npm run test

# Tryb watch (re-run testów przy zmianach)
npm run test:watch

# Raport pokrycia kodu
npm run test:coverage

# UI mode (wizualna nawigacja po testach)
npm run test:ui
```

### Testy E2E (Playwright)

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# UI mode (interaktywny debugger)
npm run test:e2e:ui

# Uruchom z widoczną przeglądarką
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# Codegen - nagrywanie testów
npm run test:e2e:codegen
```

## Strategia Testowania

### Piramida Testów

```
       /\
      /  \     E2E (10-15 testów)
     /    \    ↑ Ścieżki krytyczne
    /------\
   /        \   Integration (30-50 testów)
  /          \  ↑ API endpoints, hooks, forms
 /------------\
/______________\ Unit (100-200 testów)
                 ↑ Utils, schemas, services
```

### Podział Odpowiedzialności

#### 1. Testy Jednostkowe (80% testów)

**Co testować:**

- Funkcje utility (`src/lib/utils/`)
- Schematy walidacji Zod (`src/lib/validation/`)
- Serwisy logiczne (`src/lib/services/`)
- Czyste funkcje biznesowe

**Przykład:**

```typescript
import { describe, it, expect } from "vitest";
import { aggregateIngredients } from "@/lib/utils/ingredients";

describe("aggregateIngredients", () => {
  it("should combine ingredients with same name", () => {
    const ingredients = [
      { name: "Makaron", quantity: 200, unit: "g" },
      { name: "Makaron", quantity: 300, unit: "g" },
    ];

    const result = aggregateIngredients(ingredients);

    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(500);
  });
});
```

#### 2. Testy Integracyjne (15% testów)

**Co testować:**

- Komponenty React z logiką
- Formularze (react-hook-form + Zod)
- Custom hooks
- Integracje z API (z mockowaniem)

**Przykład:**

```typescript
import { render, screen, userEvent } from '@/tests/helpers/test-utils';
import { RecipeForm } from '@/components/RecipeForm';

describe('RecipeForm', () => {
  it('should submit valid recipe data', async () => {
    const onSubmit = vi.fn();
    render(<RecipeForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Nazwa przepisu'), 'Spaghetti');
    await userEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Spaghetti',
      // ...
    });
  });
});
```

#### 3. Testy E2E (5% testów)

**Co testować:**

- Krytyczne ścieżki użytkownika:
  - Rejestracja → Login → Dodanie przepisu → Przypisanie do kalendarza → Generowanie listy → Export
- Error scenarios (błędy sieciowe, walidacja)
- Edge cases (empty states, loading states)

**Przykład:**

```typescript
import { test, expect } from "@playwright/test";

test("user can create recipe and generate shopping list", async ({ page }) => {
  // Login
  await page.goto("/login");
  await page.fill('[name="email"]', "test@example.com");
  await page.fill('[name="password"]', "password123");
  await page.click('button[type="submit"]');

  // Create recipe
  await page.goto("/recipes/new");
  await page.fill('[name="name"]', "Spaghetti Carbonara");
  await page.click('button:has-text("Zapisz")');

  // Verify success
  await expect(page.locator("text=Przepis został zapisany")).toBeVisible();
});
```

## Best Practices

### Vitest

1. **Używaj `vi` object dla mocków:**

   ```typescript
   import { vi } from "vitest";

   const mockFn = vi.fn();
   vi.spyOn(console, "error").mockImplementation(() => {});
   ```

2. **Setup files dla reusable configuration:**
   - Globalne moki w `tests/setup.ts`
   - Custom matchers w setup files

3. **Leverage TypeScript:**

   ```typescript
   import { expectTypeOf } from "vitest";

   expectTypeOf(result).toMatchTypeOf<Recipe>();
   ```

4. **Coverage targets:**
   - `src/lib`: min. 80% coverage
   - `src/components`: min. 60% coverage

### Playwright

1. **Używaj locators resilient do zmian:**

   ```typescript
   // ✅ Dobre
   page.getByRole("button", { name: "Zapisz" });
   page.getByLabel("Email");

   // ❌ Złe (kruche)
   page.locator(".btn-primary");
   page.locator("#submit-button");
   ```

2. **Page Object Model dla maintainability:**

   ```typescript
   class LoginPage {
     constructor(private page: Page) {}

     async login(email: string, password: string) {
       await this.page.fill('[name="email"]', email);
       await this.page.fill('[name="password"]', password);
       await this.page.click('button[type="submit"]');
     }
   }
   ```

3. **Używaj test hooks:**

   ```typescript
   test.beforeEach(async ({ page }) => {
     // Setup przed każdym testem
     await page.goto("/");
   });
   ```

4. **Leverage trace viewer dla debugowania:**
   ```bash
   npx playwright show-trace trace.zip
   ```

## Fixtures i Test Data

### Factory Functions

Używaj factory functions z `tests/fixtures/sample-data.ts`:

```typescript
import { createRecipe, createIngredient } from "@/tests/fixtures/sample-data";

const recipe = createRecipe({ name: "Custom Recipe" });
const ingredient = createIngredient({ quantity: 500 });
```

### Mockowanie Supabase

```typescript
import { vi } from "vitest";

vi.mock("@/db/supabase.client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));
```

## CI/CD Integration

Testy są uruchamiane automatycznie w GitHub Actions:

- **Unit tests:** Przy każdym push i PR
- **E2E tests:** Przy każdym push do `main` i PR
- **Coverage:** Raport uploadowany do Codecov

## Troubleshooting

### Problem: Testy Vitest nie znajdują aliasów (@/)

**Rozwiązanie:** Sprawdź `vitest.config.ts` - aliasy muszą być skonfigurowane w `resolve.alias`.

### Problem: Playwright timeout

**Rozwiązanie:**

- Zwiększ timeout: `test.setTimeout(60000)`
- Sprawdź czy dev server działa: `npm run dev`

### Problem: Coverage jest za niski

**Rozwiązanie:**

- Uruchom `npm run test:coverage` i sprawdź raport w `coverage/index.html`
- Skup się na testowaniu krytycznych funkcji w `src/lib`

## Przydatne Linki

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Pytania?** Sprawdź tech-stack.md sekcja 7 lub Rule_Vitest.md / Rule_Playwright.md w `.ai/prompts/`
