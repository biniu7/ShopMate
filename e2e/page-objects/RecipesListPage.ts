/**
 * Recipes List Page Object
 * Page Object Model for /recipes page
 */
import { type Page, type Locator } from "@playwright/test";

export class RecipesListPage {
  readonly page: Page;
  readonly addRecipeButton: Locator;
  readonly addRecipeButtonFab: Locator;

  constructor(page: Page) {
    this.page = page;
    // Desktop button
    this.addRecipeButton = page.getByTestId("add-recipe-button");
    // Mobile FAB button
    this.addRecipeButtonFab = page.getByTestId("add-recipe-button-fab");
  }

  /**
   * Navigate to recipes list page
   */
  async goto() {
    await this.page.goto("/recipes");
  }

  /**
   * Click "Add Recipe" button (desktop version)
   */
  async clickAddRecipeButton() {
    // Simplified: navigate directly and wait for form to appear
    await this.page.goto("/recipes/new", { waitUntil: "domcontentloaded" });
    // Wait for the form to be rendered (indicates React has hydrated)
    await this.page.waitForSelector('[data-testid="recipe-form"]', { timeout: 15000 });
  }

  /**
   * Click "Add Recipe" FAB button (mobile version)
   */
  async clickAddRecipeButtonFab() {
    // Simplified: navigate directly and wait for form to appear
    await this.page.goto("/recipes/new", { waitUntil: "domcontentloaded" });
    // Wait for the form to be rendered (indicates React has hydrated)
    await this.page.waitForSelector('[data-testid="recipe-form"]', { timeout: 15000 });
  }

  /**
   * Wait for page to load
   */
  async waitForLoad() {
    await this.page.waitForLoadState("networkidle");
  }
}
