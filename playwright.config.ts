import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

/**
 * Playwright configuration dla testów E2E ShopMate
 * Zgodnie z wytycznymi: tylko Chromium/Desktop Chrome browser
 */
export default defineConfig({
  // Katalog z testami E2E
  testDir: "./e2e",

  // Wzorzec nazw plików testowych
  testMatch: "**/*.spec.ts",

  // Ignoruj przykładowe testy
  testIgnore: "**/examples/**",

  // Timeout dla pojedynczego testu (30 sekund)
  timeout: 30 * 1000,

  // Globalne ustawienia expect
  expect: {
    // Timeout dla asercji (5 sekund)
    timeout: 5000,
  },

  // Konfiguracja dla niepowodzeń
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter - różne formaty dla CI i lokalnego dev
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"], process.env.CI ? ["github"] : ["line"]],

  // Współdzielona konfiguracja dla wszystkich projektów
  use: {
    // Base URL aplikacji (lokalny dev server)
    baseURL: "http://localhost:3000",

    // Collect trace on first retry
    trace: "on-first-retry",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Video on failure
    video: "retain-on-failure",

    // Browser context options
    locale: "pl-PL",
    timezoneId: "Europe/Warsaw",

    // Navigation timeout
    navigationTimeout: 10 * 1000,

    // Action timeout
    actionTimeout: 5 * 1000,
  },

  // Projekty testowe - tylko Chromium zgodnie z wytycznymi
  projects: [
    // Setup project - runs once before all tests
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    // Main test project - uses authenticated state
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Use authenticated state from setup
        storageState: path.resolve(__dirname, "playwright/.auth/user.json"),
        // Browser context dla izolacji testów
        contextOptions: {
          // Ignore HTTPS errors w środowisku developerskim
          ignoreHTTPSErrors: true,
        },
      },
      dependencies: ["setup"],
    },
  ],

  // Web Server - automatyczne uruchamianie dev servera
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: "ignore",
    stderr: "pipe",
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL || "",
      SUPABASE_KEY: process.env.SUPABASE_KEY || "",
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
    },
  },

  // Output folder dla artifacts
  outputDir: "test-results/",
});
