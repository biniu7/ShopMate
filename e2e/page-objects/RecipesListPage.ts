/**
 * Recipes List Page Object
 * Page Object Model for /recipes page
 */
import { type Page, type Locator } from "@playwright/test";

export class RecipesListPage {
  readonly page: Page;
  readonly addRecipeButton: Locator;
  readonly addRecipeButtonFab: Locator;
  readonly addRecipeLink: Locator;
  readonly addRecipeLinkFab: Locator;

  constructor(page: Page) {
    this.page = page;
    // Desktop button (for backward compatibility)
    this.addRecipeButton = page.getByTestId("add-recipe-button");
    // Mobile FAB button (for backward compatibility)
    this.addRecipeButtonFab = page.getByTestId("add-recipe-button-fab");
    // Desktop link (parent of button - better for navigation)
    this.addRecipeLink = page.locator('a[href="/recipes/new"]').first();
    // Mobile FAB link (parent of FAB button - better for navigation)
    this.addRecipeLinkFab = page.locator('a[href="/recipes/new"]').last();
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
    // Wait for link to be visible
    await this.addRecipeLink.waitFor({ state: "visible", timeout: 10000 });

    // Click and handle View Transitions by waiting for load state
    await this.addRecipeLink.click();

    // Wait for page load - networkidle works better with View Transitions
    await this.page.waitForLoadState("networkidle", { timeout: 15000 });

    // Wait for the form to be rendered (indicates React has hydrated)
    const recipeForm = this.page.getByTestId("recipe-form");
    await recipeForm.waitFor({ state: "visible", timeout: 15000 });
  }

  /**
   * Click "Add Recipe" FAB button (mobile version)
   */
  async clickAddRecipeButtonFab() {
    // Wait for FAB link to be visible
    await this.addRecipeLinkFab.waitFor({ state: "visible", timeout: 10000 });

    // Click and handle View Transitions by waiting for load state
    await this.addRecipeLinkFab.click();

    // Wait for page load - networkidle works better with View Transitions
    await this.page.waitForLoadState("networkidle", { timeout: 15000 });

    // Wait for the form to be rendered (indicates React has hydrated)
    const recipeForm = this.page.getByTestId("recipe-form");
    await recipeForm.waitFor({ state: "visible", timeout: 15000 });
  }

  /**
   * Wait for page to load
   */
  async waitForLoad() {
    await this.page.waitForLoadState("domcontentloaded");
  }
}
