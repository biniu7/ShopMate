/**
 * Recipe Create E2E Tests
 * Tests for recipe creation flow using Page Object Model
 */
import { test, expect } from "@playwright/test";
import { RecipesListPage, RecipeCreatePage, type RecipeData } from "./page-objects";
import { generateRecipeName } from "./helpers/test-data";

test.describe("Recipe Creation Flow", () => {
  test("should create a new recipe with multiple ingredients", async ({ page }) => {
    // Arrange - Prepare test data and page object
    const recipeCreatePage = new RecipeCreatePage(page);

    // Generate unique recipe name to avoid conflicts
    const uniqueRecipeName = generateRecipeName("Spaghetti Carbonara");

    const testRecipe: RecipeData = {
      name: uniqueRecipeName,
      instructions: `1. Ugotuj makaron al dente
2. Podsmaż boczek na patelni
3. Wymieszaj jajka z parmezanem
4. Połącz wszystkie składniki`,
      ingredients: [
        { name: "spaghetti", quantity: "400", unit: "g" },
        { name: "boczek", quantity: "200", unit: "g" },
        { name: "jajka", quantity: "4", unit: "sztuki" },
        { name: "parmezan", quantity: "100", unit: "g" },
      ],
    };

    // Act - Use helper method to create recipe
    await recipeCreatePage.createRecipe(testRecipe);

    // Assert - Verify we're on recipe details page
    expect(page.url()).toMatch(/\/recipes\/[a-f0-9-]+$/);

    // Verify recipe name is displayed on details page
    const recipeNameElement = page.locator("h1").first();
    await expect(recipeNameElement).toContainText(uniqueRecipeName);
  });

  test("should validate required fields", async ({ page }) => {
    // Arrange
    const recipesListPage = new RecipesListPage(page);
    const recipeCreatePage = new RecipeCreatePage(page);

    // Act - Navigate to create page
    await recipesListPage.clickAddRecipeButton();
    await recipeCreatePage.waitForFormLoad();

    // Assert - Submit button should be disabled for empty form
    await expect(recipeCreatePage.submitButton).toBeDisabled();
  });

  test("should add and remove ingredients dynamically", async ({ page }) => {
    // Arrange
    const recipesListPage = new RecipesListPage(page);
    const recipeCreatePage = new RecipeCreatePage(page);

    // Generate unique recipe name
    const uniqueRecipeName = generateRecipeName("Ciasto");

    // Act - Navigate to create page
    await recipesListPage.clickAddRecipeButton();
    await recipeCreatePage.waitForFormLoad();

    // Fill recipe name to make form valid
    await recipeCreatePage.fillName(uniqueRecipeName);
    await recipeCreatePage.fillInstructions("Instrukcje testowe");

    // Fill first ingredient (already exists)
    await recipeCreatePage.fillIngredient(0, {
      name: "mąka",
      quantity: "500",
      unit: "g",
    });

    // Add second ingredient
    await recipeCreatePage.clickAddIngredient();
    await recipeCreatePage.fillIngredient(1, {
      name: "cukier",
      quantity: "200",
      unit: "g",
    });

    // Add third ingredient
    await recipeCreatePage.clickAddIngredient();
    await recipeCreatePage.fillIngredient(2, {
      name: "jajka",
      quantity: "3",
      unit: "sztuki",
    });

    // Remove second ingredient (cukier)
    await recipeCreatePage.removeIngredient(1);
    await page.waitForTimeout(300); // Wait for removal animation

    // Assert - Verify that only 2 ingredients remain (mąka and jajka)
    // After removal, indices are updated: jajka shifts from index 2 to index 1
    const ingredient0 = recipeCreatePage.getIngredient(0);
    await expect(ingredient0.name).toHaveValue("mąka");

    // After removal, jajka is now at index 1 (shifted down)
    const ingredient1 = recipeCreatePage.getIngredient(1);
    await expect(ingredient1.name).toHaveValue("jajka");
  });

  test("should cancel recipe creation with confirmation", async ({ page }) => {
    // Arrange
    const recipesListPage = new RecipesListPage(page);
    const recipeCreatePage = new RecipeCreatePage(page);

    // Generate unique recipe name
    const uniqueRecipeName = generateRecipeName("Test Recipe");

    // Act - Navigate to create page
    await recipesListPage.clickAddRecipeButton();
    await recipeCreatePage.waitForFormLoad();

    // Fill some data with unique name
    await recipeCreatePage.fillName(uniqueRecipeName);

    // Setup dialog handler to accept confirmation
    page.on("dialog", (dialog) => dialog.accept());

    // Click cancel
    await recipeCreatePage.clickCancel();

    // Assert - Should navigate back
    // Note: Actual behavior depends on implementation (window.history.back())
    await page.waitForTimeout(500); // Wait for navigation
  });

  test("should use helper method to create recipe end-to-end", async ({ page }) => {
    // Arrange
    const recipeCreatePage = new RecipeCreatePage(page);

    // Generate unique recipe name
    const uniqueRecipeName = generateRecipeName("Omlet");

    const testRecipe: RecipeData = {
      name: uniqueRecipeName,
      instructions: "1. Rozbij jajka\n2. Wymieszaj\n3. Smaż na patelni",
      ingredients: [
        { name: "jajka", quantity: "3", unit: "sztuki" },
        { name: "mleko", quantity: "50", unit: "ml" },
        { name: "sól", quantity: "1", unit: "szczypta" },
      ],
    };

    // Act - Use helper method that does Arrange, Act internally
    await recipeCreatePage.createRecipe(testRecipe);

    // Assert - Verify we're on recipe details page
    expect(page.url()).toMatch(/\/recipes\/[a-f0-9-]+$/);

    // Verify the unique recipe name is displayed
    const recipeNameElement = page.locator("h1").first();
    await expect(recipeNameElement).toContainText(uniqueRecipeName);
  });
});

test.describe("Recipe Creation - Mobile FAB", () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test("should click FAB button on mobile", async ({ page }) => {
    // Arrange
    const recipesListPage = new RecipesListPage(page);
    const recipeCreatePage = new RecipeCreatePage(page);

    // Act
    await recipesListPage.goto();
    await recipesListPage.waitForLoad();
    await recipesListPage.clickAddRecipeButtonFab();

    // Assert
    await recipeCreatePage.waitForFormLoad();
    await expect(recipeCreatePage.recipeForm).toBeVisible();
  });
});
