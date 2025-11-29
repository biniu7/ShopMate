/**
 * Przykładowy test E2E dla Playwright
 * Ten plik pokazuje jak pisać testy end-to-end
 */

import { test, expect } from '@playwright/test';

test.describe('ShopMate Homepage', () => {
  test('should display the homepage', async ({ page }) => {
    // Przejdź do strony głównej
    await page.goto('/');

    // Poczekaj na załadowanie strony
    await page.waitForLoadState('networkidle');

    // Sprawdź czy tytuł strony jest poprawny
    await expect(page).toHaveTitle(/ShopMate/i);
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/');

    // Sprawdź czy nawigacja jest dostępna
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
  });
});

test.describe('Example form interactions', () => {
  test('should fill and submit a form', async ({ page }) => {
    // Ten test jest przykładowy - dostosuj do rzeczywistych formularzy w aplikacji
    await page.goto('/');

    // Przykład wypełniania formularza
    // await page.fill('input[name="email"]', 'test@example.com');
    // await page.fill('input[name="password"]', 'password123');
    // await page.click('button[type="submit"]');

    // Sprawdź rezultat
    // await expect(page).toHaveURL('/dashboard');
  });
});

test.describe('Example navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');

    // Kliknij w link (przykład - dostosuj do rzeczywistych linków)
    // await page.click('a[href="/recipes"]');
    // await expect(page).toHaveURL('/recipes');
  });
});