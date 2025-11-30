/**
 * Authentication Setup for Playwright E2E Tests
 * This file handles user login and saves the authentication state
 */
import { test as setup, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.join(__dirname, "../playwright/.auth/user.json");

setup("authenticate", async ({ page }) => {
  // Get test user credentials from environment
  const email = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error("E2E_USERNAME and E2E_PASSWORD must be set in .env.test file");
  }

  console.log(`Attempting to login as: ${email}`);

  // Listen to console messages to debug
  page.on("console", (msg) => console.log("Browser console:", msg.text()));

  // Navigate to login page
  await page.goto("/login", { waitUntil: "networkidle" });
  console.log("Current URL after goto:", page.url());

  // Wait for form to be ready
  await page.waitForSelector("input#email", { state: "visible" });
  await page.waitForTimeout(1000); // Give React time to hydrate

  // Fill in login form
  await page.fill("input#email", email);
  await page.fill("input#password", password);
  console.log("Form filled, clicking submit");

  // Take screenshot before submit
  await page.screenshot({ path: "test-results/before-submit.png" });

  // Click login button and wait for navigation
  await page.click('button[type="submit"]');

  // Wait a bit to see what happens
  await page.waitForTimeout(2000);
  console.log("Current URL after clicking submit:", page.url());

  // Take screenshot after submit
  await page.screenshot({ path: "test-results/after-submit.png" });

  // Wait for redirect to home or recipes page
  await page.waitForURL(/\/(recipes|dashboard|home)?$/, { timeout: 10000 });

  // Verify we're logged in by checking for auth indicators
  // This could be a user menu, logout button, etc.
  // Adjust selector based on your app's layout
  await expect(page).not.toHaveURL(/\/login/);

  console.log("Authentication successful");

  // Save signed-in state to 'authFile'
  await page.context().storageState({ path: authFile });
});
