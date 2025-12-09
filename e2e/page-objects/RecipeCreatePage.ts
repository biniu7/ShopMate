/**
 * Recipe Create Page Object
 * Page Object Model for /recipes/new page
 */
import { type Page, type Locator } from "@playwright/test";

export interface IngredientData {
  name: string;
  quantity?: string;
  unit?: string;
}

export interface RecipeData {
  name: string;
  instructions: string;
  ingredients: IngredientData[];
}

export class RecipeCreatePage {
  readonly page: Page;
  readonly recipeForm: Locator;
  readonly nameInput: Locator;
  readonly instructionsTextarea: Locator;
  readonly addIngredientButton: Locator;
  readonly cancelButton: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.recipeForm = page.getByTestId("recipe-form");
    this.nameInput = page.getByTestId("recipe-name-input");
    this.instructionsTextarea = page.getByTestId("recipe-instructions-textarea");
    this.addIngredientButton = page.getByTestId("add-ingredient-button");
    this.cancelButton = page.getByTestId("cancel-button");
    this.submitButton = page.getByTestId("submit-recipe-button");
  }

  /**
   * Navigate to recipe create page
   */
  async goto() {
    await this.page.goto("/recipes/new", { waitUntil: "domcontentloaded", timeout: 30000 });
    // Wait for the form to be rendered (indicates React has hydrated)
    await this.recipeForm.waitFor({ state: "visible", timeout: 15000 });
  }

  /**
   * Wait for form to load
   */
  async waitForFormLoad() {
    await this.recipeForm.waitFor({ state: "visible" });
  }

  /**
   * Fill recipe name
   */
  async fillName(name: string) {
    await this.nameInput.fill(name);
  }

  /**
   * Fill recipe instructions
   */
  async fillInstructions(instructions: string) {
    await this.instructionsTextarea.fill(instructions);
  }

  /**
   * Get ingredient field locators by index
   */
  getIngredient(index: number) {
    return {
      name: this.page.getByTestId(`ingredient-name-${index}`),
      quantity: this.page.getByTestId(`ingredient-quantity-${index}`),
      unit: this.page.getByTestId(`ingredient-unit-${index}`),
      removeButton: this.page.getByTestId(`remove-ingredient-${index}`),
    };
  }

  /**
   * Fill single ingredient by index
   */
  async fillIngredient(index: number, ingredient: IngredientData) {
    const ingredientFields = this.getIngredient(index);

    // Wait for fields to be visible before filling
    await ingredientFields.name.waitFor({ state: "visible", timeout: 10000 });

    // Name is required
    await ingredientFields.name.fill(ingredient.name);

    // Quantity and unit are optional
    if (ingredient.quantity) {
      await ingredientFields.quantity.fill(ingredient.quantity);
    }
    if (ingredient.unit) {
      await ingredientFields.unit.fill(ingredient.unit);
    }
  }

  /**
   * Click "Add Ingredient" button
   * Returns the index of the newly added ingredient
   */
  async clickAddIngredient(): Promise<number> {
    // Count current ingredients before adding
    const currentCount = await this.page.getByTestId(/^ingredient-name-\d+$/).count();

    await this.addIngredientButton.click();

    // Wait for new ingredient row to be added to DOM
    const newIngredientIndex = currentCount;
    const newIngredient = this.getIngredient(newIngredientIndex);
    await newIngredient.name.waitFor({ state: "visible", timeout: 5000 });

    return newIngredientIndex;
  }

  /**
   * Remove ingredient by index
   */
  async removeIngredient(index: number) {
    const ingredientFields = this.getIngredient(index);
    await ingredientFields.removeButton.click();
  }

  /**
   * Fill entire recipe form
   * Arrange: Prepares all form data
   */
  async fillRecipeForm(recipe: RecipeData) {
    // Fill basic fields
    await this.fillName(recipe.name);
    await this.fillInstructions(recipe.instructions);

    // Fill ingredients (first ingredient already exists)
    for (let i = 0; i < recipe.ingredients.length; i++) {
      // Add new ingredient row if needed (except first one)
      if (i > 0) {
        await this.clickAddIngredient();
      }
      await this.fillIngredient(i, recipe.ingredients[i]);
    }
  }

  /**
   * Click cancel button
   */
  async clickCancel() {
    await this.cancelButton.click();
  }

  /**
   * Click submit button
   * Act: Submits the form
   */
  async clickSubmit() {
    // Wait for button to be visible and enabled (form validation)
    await this.submitButton.waitFor({ state: "visible", timeout: 10000 });

    // Playwright's click() automatically waits for the element to be enabled
    // but we can explicitly check if needed for debugging
    await this.submitButton.click({ timeout: 10000 });
  }

  /**
   * Check if submit button is enabled
   */
  async isSubmitButtonEnabled(): Promise<boolean> {
    return await this.submitButton.isEnabled();
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitButtonDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  /**
   * Get form validation error for name field
   */
  async getNameError(): Promise<string | null> {
    const errorElement = this.page.locator("#name-error");
    if (await errorElement.isVisible()) {
      return await errorElement.textContent();
    }
    return null;
  }

  /**
   * Get form validation error for instructions field
   */
  async getInstructionsError(): Promise<string | null> {
    const errorElement = this.page.locator("#instructions-error");
    if (await errorElement.isVisible()) {
      return await errorElement.textContent();
    }
    return null;
  }

  /**
   * Get ingredient error by index
   */
  async getIngredientError(index: number): Promise<string | null> {
    const errorElement = this.page.locator(`#ingredient-${index}-error`);
    if (await errorElement.isVisible()) {
      return await errorElement.textContent();
    }
    return null;
  }

  /**
   * Wait for successful submission and redirect
   */
  async waitForSuccessRedirect() {
    await this.page.waitForURL(/\/recipes\/[a-f0-9-]+$/, { timeout: 15000 });
    // Wait for recipe details to load (not just URL)
    // Wait for the skeleton to disappear and actual content to load
    const recipeTitle = this.page.locator(".recipe-details-content h1");
    await recipeTitle.waitFor({ state: "visible", timeout: 15000 });
  }

  /**
   * Get recipe name from details page after successful creation
   * Useful for verifying the created recipe name
   */
  async getRecipeNameFromDetailsPage(): Promise<string | null> {
    const recipeNameElement = this.page.locator("h1").first();
    if (await recipeNameElement.isVisible()) {
      return await recipeNameElement.textContent();
    }
    return null;
  }

  /**
   * Get recipe instructions from details page
   */
  async getRecipeInstructionsFromDetailsPage(): Promise<string | null> {
    const instructionsElement = this.page.locator(".instructions-section p");
    if (await instructionsElement.isVisible()) {
      return await instructionsElement.textContent();
    }
    return null;
  }

  /**
   * Get ingredients list from details page
   */
  async getIngredientsFromDetailsPage(): Promise<string[]> {
    const ingredientElements = this.page.locator(".ingredients-section li");
    const count = await ingredientElements.count();
    const ingredients: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await ingredientElements.nth(i).textContent();
      if (text) {
        ingredients.push(text.trim());
      }
    }

    return ingredients;
  }

  /**
   * Get ingredients count from details page
   */
  async getIngredientsCountFromDetailsPage(): Promise<number> {
    const ingredientElements = this.page.locator(".ingredients-section li");
    return await ingredientElements.count();
  }

  /**
   * Complete recipe creation flow
   * Combines Arrange, Act, Assert pattern
   */
  async createRecipe(recipe: RecipeData) {
    // Arrange
    await this.goto();
    await this.waitForFormLoad();

    // Act
    await this.fillRecipeForm(recipe);
    await this.clickSubmit();

    // Wait for redirect (part of Assert)
    await this.waitForSuccessRedirect();
  }
}
