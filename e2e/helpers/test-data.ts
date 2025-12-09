/**
 * Test Data Helpers
 * Utilities for generating dynamic test data
 */

/**
 * Generate unique recipe name with timestamp
 * Prevents conflicts when running tests multiple times
 */
export function generateRecipeName(baseName = "Test Recipe"): string {
  const timestamp = Date.now();
  return `${baseName} ${timestamp}`;
}

/**
 * Generate unique recipe name with date and random suffix
 */
export function generateUniqueRecipeName(baseName = "Test Recipe"): string {
  const date = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
  const random = Math.floor(Math.random() * 10000);
  return `${baseName} ${date}-${random}`;
}

/**
 * Generate simple unique suffix
 */
export function generateUniqueSuffix(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/**
 * Create recipe name with unique suffix
 */
export function withUniqueSuffix(baseName: string): string {
  return `${baseName} [${generateUniqueSuffix()}]`;
}
