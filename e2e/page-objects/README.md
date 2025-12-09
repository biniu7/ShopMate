# Page Object Model (POM) - ShopMate E2E Tests

## Struktura katalogów

```
e2e/
├── page-objects/
│   ├── components/
│   │   └── IngredientRow.ts      # Komponent pojedynczego wiersza składnika
│   ├── RecipesListPage.ts        # Strona listy przepisów
│   ├── RecipeCreatePage.ts       # Strona tworzenia przepisu
│   ├── index.ts                  # Centralny punkt eksportu
│   └── README.md                 # Ten plik
└── recipe-create.spec.ts         # Przykładowe testy E2E

```

## Wzorzec Page Object Model

Page Object Model (POM) to wzorzec projektowy, który:

- Enkapsuluje logikę stron w osobne klasy
- Separuje strukturę strony od logiki testów
- Ułatwia utrzymanie testów przy zmianach w UI
- Promuje reużywalność kodu

## Konwencja data-test-id

Wszystkie Page Objects używają atrybutów `data-test-id` do lokalizowania elementów:

```typescript
// ✅ Dobre - używa data-test-id
this.submitButton = page.getByTestId("submit-recipe-button");

// ❌ Złe - używa selektorów CSS/text
this.submitButton = page.locator("button.submit");
this.submitButton = page.getByText("Zapisz przepis");
```

### Mapa data-test-id

#### RecipesListPage

- `add-recipe-button` - Przycisk "Dodaj przepis" (desktop)
- `add-recipe-button-fab` - FAB "Dodaj przepis" (mobile)

#### RecipeCreatePage

- `recipe-form` - Kontener formularza
- `recipe-name-input` - Pole nazwy przepisu
- `recipe-instructions-textarea` - Pole instrukcji
- `add-ingredient-button` - Przycisk "Dodaj składnik"
- `ingredient-name-{index}` - Nazwa składnika (np. `ingredient-name-0`)
- `ingredient-quantity-{index}` - Ilość składnika
- `ingredient-unit-{index}` - Jednostka składnika
- `remove-ingredient-{index}` - Przycisk usuwania składnika
- `cancel-button` - Przycisk "Anuluj"
- `submit-recipe-button` - Przycisk "Zapisz przepis"

## Użycie w testach

### Import Page Objects

```typescript
import { RecipesListPage, RecipeCreatePage, type RecipeData } from "./page-objects";
import { generateRecipeName } from "./helpers/test-data";
```

### Dynamiczne nazwy przepisów

**WAŻNE**: Zawsze używaj dynamicznie generowanych nazw przepisów w testach, aby uniknąć konfliktów przy wielokrotnym uruchamianiu testów.

```typescript
// ✅ Dobre - dynamiczna nazwa
const uniqueRecipeName = generateRecipeName("Spaghetti Carbonara");
const testRecipe: RecipeData = {
  name: uniqueRecipeName,
  // ...
};

// ❌ Złe - hardcoded nazwa
const testRecipe: RecipeData = {
  name: "Spaghetti Carbonara", // Może powodować konflikty!
  // ...
};
```

Funkcja `generateRecipeName()` dodaje timestamp do nazwy:

```typescript
generateRecipeName("Test Recipe");
// Zwraca: "Test Recipe 1234567890123"
```

### Wzorzec Arrange-Act-Assert

```typescript
test("should create recipe", async ({ page }) => {
  // Arrange - Przygotuj dane i obiekty
  const recipesListPage = new RecipesListPage(page);
  const recipeCreatePage = new RecipeCreatePage(page);

  const testRecipe: RecipeData = {
    name: "Test Recipe",
    instructions: "Test instructions",
    ingredients: [{ name: "ingredient 1", quantity: "100", unit: "g" }],
  };

  // Act - Wykonaj akcje
  await recipesListPage.goto();
  await recipesListPage.clickAddRecipeButton();
  await recipeCreatePage.fillRecipeForm(testRecipe);
  await recipeCreatePage.clickSubmit();

  // Assert - Sprawdź wynik
  await recipeCreatePage.waitForSuccessRedirect();
  expect(page.url()).toMatch(/\/recipes\/[a-f0-9-]+$/);
});
```

### Uproszczona wersja z helper method

```typescript
test("should create recipe - simplified", async ({ page }) => {
  // Arrange
  const recipeCreatePage = new RecipeCreatePage(page);
  const testRecipe: RecipeData = {
    /* ... */
  };

  // Act - createRecipe() łączy Arrange, Act
  await recipeCreatePage.createRecipe(testRecipe);

  // Assert
  expect(page.url()).toMatch(/\/recipes\/[a-f0-9-]+$/);
});
```

## API Reference

### RecipesListPage

#### Konstruktor

```typescript
new RecipesListPage(page: Page)
```

#### Metody

- `goto()` - Nawiguj do /recipes
- `clickAddRecipeButton()` - Kliknij przycisk "Dodaj przepis" (desktop)
- `clickAddRecipeButtonFab()` - Kliknij FAB "Dodaj przepis" (mobile)
- `waitForLoad()` - Czekaj na załadowanie strony

### RecipeCreatePage

#### Konstruktor

```typescript
new RecipeCreatePage(page: Page)
```

#### Metody podstawowe

- `goto()` - Nawiguj do /recipes/new
- `waitForFormLoad()` - Czekaj na załadowanie formularza
- `fillName(name: string)` - Wypełnij nazwę przepisu
- `fillInstructions(instructions: string)` - Wypełnij instrukcje

#### Metody składników

- `getIngredient(index: number)` - Pobierz lokatory składnika
- `fillIngredient(index: number, data: IngredientData)` - Wypełnij składnik
- `clickAddIngredient()` - Dodaj nowy wiersz składnika
- `removeIngredient(index: number)` - Usuń składnik

#### Metody formularza

- `fillRecipeForm(recipe: RecipeData)` - Wypełnij cały formularz
- `clickSubmit()` - Kliknij "Zapisz przepis"
- `clickCancel()` - Kliknij "Anuluj"
- `isSubmitButtonEnabled()` - Sprawdź czy przycisk submit jest aktywny
- `isSubmitButtonDisabled()` - Sprawdź czy przycisk submit jest nieaktywny

#### Metody walidacji

- `getNameError()` - Pobierz błąd walidacji nazwy
- `getInstructionsError()` - Pobierz błąd walidacji instrukcji
- `getIngredientError(index: number)` - Pobierz błąd składnika

#### Metody pomocnicze

- `waitForSuccessRedirect()` - Czekaj na przekierowanie po sukcesie
- `getRecipeNameFromDetailsPage()` - Pobierz nazwę przepisu ze strony szczegółów (po utworzeniu)
- `createRecipe(recipe: RecipeData)` - Kompleksowa metoda (Arrange + Act)

### IngredientRow

#### Konstruktor

```typescript
new IngredientRow(page: Page, index: number)
```

#### Metody

- `fill(data: IngredientRowData)` - Wypełnij cały wiersz
- `fillName(name: string)` - Wypełnij nazwę
- `fillQuantity(quantity: string)` - Wypełnij ilość
- `fillUnit(unit: string)` - Wypełnij jednostkę
- `remove()` - Usuń wiersz
- `canRemove()` - Sprawdź czy można usunąć
- `getError()` - Pobierz błąd walidacji
- `isVisible()` - Sprawdź widoczność
- `getValues()` - Pobierz aktualne wartości

## Typy danych

### RecipeData

```typescript
interface RecipeData {
  name: string;
  instructions: string;
  ingredients: IngredientData[];
}
```

### IngredientData

```typescript
interface IngredientData {
  name: string;
  quantity?: string;
  unit?: string;
}
```

### IngredientRowData

```typescript
interface IngredientRowData {
  name: string;
  quantity?: string;
  unit?: string;
}
```

## Best Practices

### 1. Używaj data-test-id

```typescript
// ✅ Dobre
page.getByTestId("submit-recipe-button");

// ❌ Złe
page.locator("button[type='submit']");
page.getByText("Zapisz przepis");
```

### 2. Enkapsuluj logikę w Page Objects

```typescript
// ✅ Dobre
await recipeCreatePage.fillRecipeForm(testRecipe);

// ❌ Złe - logika w teście
await page.getByTestId("recipe-name-input").fill(recipe.name);
await page.getByTestId("recipe-instructions-textarea").fill(recipe.instructions);
// ...
```

### 3. Używaj wzorca Arrange-Act-Assert

```typescript
test("example", async ({ page }) => {
  // Arrange - przygotuj dane i obiekty
  const recipePage = new RecipeCreatePage(page);
  const uniqueName = generateRecipeName("Test Recipe");
  const testData = {
    name: uniqueName,
    // ...
  };

  // Act - wykonaj akcje
  await recipePage.createRecipe(testData);

  // Assert - sprawdź wynik
  expect(page.url()).toMatch(/\/recipes\/[a-f0-9-]+$/);

  // Verify the unique name is displayed
  const displayedName = await recipePage.getRecipeNameFromDetailsPage();
  expect(displayedName).toContain(uniqueName);
});
```

### 4. Używaj TypeScript dla type safety

```typescript
// ✅ Dobre - TypeScript sprawdzi poprawność
const recipe: RecipeData = {
  name: "Test",
  instructions: "Test instructions",
  ingredients: [{ name: "test" }],
};

// ❌ Złe - brak sprawdzania typów
const recipe = {
  nazwa: "Test", // błąd - powinno być 'name'
  skladniki: [], // błąd - powinno być 'ingredients'
};
```

### 5. Używaj metod pomocniczych dla złożonych operacji

```typescript
// ✅ Dobre - jedna metoda
await recipeCreatePage.createRecipe(testRecipe);

// ❌ Złe - powtarzanie kodu w każdym teście
await recipeCreatePage.goto();
await recipeCreatePage.waitForFormLoad();
await recipeCreatePage.fillRecipeForm(testRecipe);
await recipeCreatePage.clickSubmit();
await recipeCreatePage.waitForSuccessRedirect();
```

## Przykłady testów

Więcej przykładów znajdziesz w pliku `e2e/recipe-create.spec.ts`.

### Test tworzenia przepisu

```typescript
test("should create recipe with ingredients", async ({ page }) => {
  const recipesListPage = new RecipesListPage(page);
  const recipeCreatePage = new RecipeCreatePage(page);

  // Generate unique recipe name to avoid conflicts
  const uniqueRecipeName = generateRecipeName("Spaghetti Carbonara");

  const testRecipe: RecipeData = {
    name: uniqueRecipeName,
    instructions: "1. Ugotuj makaron\n2. Podsmaż boczek\n3. Wymieszaj",
    ingredients: [
      { name: "spaghetti", quantity: "400", unit: "g" },
      { name: "boczek", quantity: "200", unit: "g" },
    ],
  };

  await recipesListPage.goto();
  await recipesListPage.clickAddRecipeButton();
  await recipeCreatePage.fillRecipeForm(testRecipe);
  await recipeCreatePage.clickSubmit();
  await recipeCreatePage.waitForSuccessRedirect();

  // Verify unique recipe name is displayed
  const displayedName = await recipeCreatePage.getRecipeNameFromDetailsPage();
  expect(displayedName).toContain(uniqueRecipeName);
});
```

### Test walidacji

```typescript
test("should validate required fields", async ({ page }) => {
  const recipeCreatePage = new RecipeCreatePage(page);

  await recipeCreatePage.goto();
  await recipeCreatePage.waitForFormLoad();

  // Próba submit bez wypełnienia formularza
  await expect(recipeCreatePage.submitButton).toBeDisabled();
});
```

### Test dynamicznego dodawania składników

```typescript
test("should add and remove ingredients", async ({ page }) => {
  const recipeCreatePage = new RecipeCreatePage(page);

  await recipeCreatePage.goto();
  await recipeCreatePage.waitForFormLoad();

  // Dodaj składniki
  await recipeCreatePage.fillIngredient(0, { name: "mąka" });
  await recipeCreatePage.clickAddIngredient();
  await recipeCreatePage.fillIngredient(1, { name: "cukier" });

  // Usuń drugi składnik
  await recipeCreatePage.removeIngredient(1);

  // Sprawdź
  const ingredient0 = recipeCreatePage.getIngredient(0);
  await expect(ingredient0.name).toHaveValue("mąka");
});
```

## Rozszerzanie Page Objects

Aby dodać nowy Page Object:

1. Utwórz plik w `e2e/page-objects/`
2. Zdefiniuj klasę z locatorami używającymi `data-test-id`
3. Dodaj metody akcji (click, fill, etc.)
4. Dodaj metody pomocnicze (wait, validate, etc.)
5. Eksportuj klasę w `index.ts`

Przykład:

```typescript
// e2e/page-objects/RecipeDetailsPage.ts
export class RecipeDetailsPage {
  readonly page: Page;
  readonly recipeName: Locator;

  constructor(page: Page) {
    this.page = page;
    this.recipeName = page.getByTestId("recipe-name");
  }

  async goto(id: string) {
    await this.page.goto(`/recipes/${id}`);
  }
}

// e2e/page-objects/index.ts
export { RecipeDetailsPage } from "./RecipeDetailsPage";
```
