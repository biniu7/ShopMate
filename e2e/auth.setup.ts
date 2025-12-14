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

  // Listen to console messages and errors to debug
  page.on("console", (msg) => console.log("Browser console:", msg.text()));
  page.on("pageerror", (err) => console.error("Browser error:", err.message));

  // Log all network requests to debug
  page.on("request", (request) => {
    if (request.url().includes("api")) {
      console.log(">>", request.method(), request.url());
    }
  });

  page.on("response", (response) => {
    if (response.url().includes("api")) {
      console.log("<<", response.status(), response.url());
    }
  });

  // Navigate to login page and wait for full load
  await page.goto("/login", { waitUntil: "networkidle" });
  console.log("Current URL after goto:", page.url());

  // Wait for form to be ready and interactive
  const emailInput = page.locator("input#email");
  const passwordInput = page.locator("input#password");

  await emailInput.waitFor({ state: "visible" });

  // Wait for React hydration to complete (wait for hydration error or timeout)
  await page.waitForTimeout(2000);

  // Fill in login form using type() for better React compatibility
  await emailInput.click();
  await emailInput.clear();
  await emailInput.type(email, { delay: 50 });

  await passwordInput.click();
  await passwordInput.clear();
  await passwordInput.type(password, { delay: 50 });

  console.log("Form filled");

  // Wait a bit for React state to update
  await page.waitForTimeout(500);

  // Check if submit button is enabled
  const submitButton = page.locator('button[type="submit"]');
  const isDisabled = await submitButton.isDisabled();
  console.log("Submit button disabled:", isDisabled);

  // Take screenshot before submit
  await page.screenshot({ path: "test-results/before-submit.png" });

  console.log("Clicking submit button");

  // Setup API response listener BEFORE clicking submit - wait for ANY status
  const loginResponsePromise = page.waitForResponse((response) => response.url().includes("/api/auth/login"), {
    timeout: 10000,
  });

  // Click login button (already defined above)
  await submitButton.click();
  console.log("Submit button clicked");

  // Wait for API response and check status
  const loginResponse = await loginResponsePromise;
  console.log("Login API URL:", loginResponse.url());
  console.log("Login API status:", loginResponse.status());

  // Verify successful login - just check status (body may not be available after redirect)
  if (loginResponse.status() !== 200) {
    throw new Error(`Login failed with status: ${loginResponse.status()}`);
  }

  console.log("Login API returned 200, waiting for redirect");

  // Wait for redirect to dashboard (default redirect after login)
  await page.waitForURL(/\/(recipes|dashboard)/, { timeout: 15000 });
  console.log("Current URL after clicking submit:", page.url());

  // Take screenshot after submit
  await page.screenshot({ path: "test-results/after-submit.png" });

  // Verify we're logged in by checking for auth indicators
  // This could be a user menu, logout button, etc.
  // Adjust selector based on your app's layout
  // eslint-disable-next-line playwright/no-standalone-expect
  await expect(page).not.toHaveURL(/\/login/);

  console.log("Authentication successful");

  // Save signed-in state to 'authFile'
  await page.context().storageState({ path: authFile });
});
