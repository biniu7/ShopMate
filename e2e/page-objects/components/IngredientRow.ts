/**
 * Ingredient Row Component
 * Component Object for single ingredient row in recipe form
 */
import { type Page, type Locator } from "@playwright/test";

export interface IngredientRowData {
  name: string;
  quantity?: string;
  unit?: string;
}

export class IngredientRow {
  readonly page: Page;
  readonly index: number;
  readonly nameInput: Locator;
  readonly quantityInput: Locator;
  readonly unitInput: Locator;
  readonly removeButton: Locator;

  constructor(page: Page, index: number) {
    this.page = page;
    this.index = index;
    this.nameInput = page.getByTestId(`ingredient-name-${index}`);
    this.quantityInput = page.getByTestId(`ingredient-quantity-${index}`);
    this.unitInput = page.getByTestId(`ingredient-unit-${index}`);
    this.removeButton = page.getByTestId(`remove-ingredient-${index}`);
  }

  /**
   * Fill ingredient row with data
   */
  async fill(data: IngredientRowData) {
    // Name is required
    await this.nameInput.fill(data.name);

    // Quantity and unit are optional
    if (data.quantity) {
      await this.quantityInput.fill(data.quantity);
    }
    if (data.unit) {
      await this.unitInput.fill(data.unit);
    }
  }

  /**
   * Fill ingredient name only
   */
  async fillName(name: string) {
    await this.nameInput.fill(name);
  }

  /**
   * Fill ingredient quantity only
   */
  async fillQuantity(quantity: string) {
    await this.quantityInput.fill(quantity);
  }

  /**
   * Fill ingredient unit only
   */
  async fillUnit(unit: string) {
    await this.unitInput.fill(unit);
  }

  /**
   * Remove this ingredient row
   */
  async remove() {
    await this.removeButton.click();
  }

  /**
   * Check if remove button is enabled
   */
  async canRemove(): Promise<boolean> {
    return await this.removeButton.isEnabled();
  }

  /**
   * Get ingredient error message
   */
  async getError(): Promise<string | null> {
    const errorElement = this.page.locator(`#ingredient-${this.index}-error`);
    if (await errorElement.isVisible()) {
      return await errorElement.textContent();
    }
    return null;
  }

  /**
   * Check if ingredient row is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.nameInput.isVisible();
  }

  /**
   * Get current values from ingredient row
   */
  async getValues(): Promise<IngredientRowData> {
    return {
      name: (await this.nameInput.inputValue()) || "",
      quantity: (await this.quantityInput.inputValue()) || undefined,
      unit: (await this.unitInput.inputValue()) || undefined,
    };
  }
}
