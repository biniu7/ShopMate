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
    const recipeNameElement = page.locator(".recipe-details-content h1");
    await expect(recipeNameElement).toContainText(uniqueRecipeName);

    // Verify instructions are displayed correctly
    const displayedInstructions = await recipeCreatePage.getRecipeInstructionsFromDetailsPage();
    expect(displayedInstructions).toBe(testRecipe.instructions);

    // Verify correct number of ingredients
    const ingredientsCount = await recipeCreatePage.getIngredientsCountFromDetailsPage();
    expect(ingredientsCount).toBe(testRecipe.ingredients.length);

    // Verify ingredients are displayed (at least check they contain the names)
    const displayedIngredients = await recipeCreatePage.getIngredientsFromDetailsPage();
    for (const ingredient of testRecipe.ingredients) {
      const found = displayedIngredients.some((displayed) => displayed.includes(ingredient.name));
      expect(found).toBe(true);
    }
  });

  test("should validate required fields", async ({ page }) => {
    // Arrange
    const recipesListPage = new RecipesListPage(page);
    const recipeCreatePage = new RecipeCreatePage(page);

    // Act - Navigate to create page
    await recipesListPage.goto();
    await recipesListPage.waitForLoad();
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
    await recipesListPage.goto();
    await recipesListPage.waitForLoad();
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

    // Wait for removal to complete by checking that the ingredient at index 1 is now "jajka"
    // (previously at index 2, shifted down after removal)
    const ingredient1AfterRemoval = recipeCreatePage.getIngredient(1);
    await expect(ingredient1AfterRemoval.name).toHaveValue("jajka", { timeout: 5000 });

    // Assert - Verify that only 2 ingredients remain (mąka and jajka)
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
    await recipesListPage.goto();
    await recipesListPage.waitForLoad();
    await recipesListPage.clickAddRecipeButton();
    await recipeCreatePage.waitForFormLoad();

    // Fill some data with unique name
    await recipeCreatePage.fillName(uniqueRecipeName);

    // Setup dialog handler to accept confirmation
    page.on("dialog", (dialog) => dialog.accept());

    // Click cancel
    await recipeCreatePage.clickCancel();

    // Assert - Should navigate back to recipes list
    // Wait for URL to change away from /recipes/new
    await page.waitForURL((url) => !url.pathname.includes("/recipes/new"), {
      timeout: 5000,
    });

    // Verify we're back on recipes list page
    await expect(page).toHaveURL("/recipes");
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
    const recipeNameElement = page.locator(".recipe-details-content h1");
    await expect(recipeNameElement).toContainText(uniqueRecipeName);

    // Verify instructions are displayed correctly
    const displayedInstructions = await recipeCreatePage.getRecipeInstructionsFromDetailsPage();
    expect(displayedInstructions).toBe(testRecipe.instructions);

    // Verify all ingredients are present
    const ingredientsCount = await recipeCreatePage.getIngredientsCountFromDetailsPage();
    expect(ingredientsCount).toBe(testRecipe.ingredients.length);

    // Verify each ingredient name appears in the displayed list
    const displayedIngredients = await recipeCreatePage.getIngredientsFromDetailsPage();
    testRecipe.ingredients.forEach((ingredient) => {
      const found = displayedIngredients.some((displayed) => displayed.includes(ingredient.name));
      expect(found).toBe(true);
    });
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
