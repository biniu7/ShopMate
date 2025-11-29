import { includeIgnoreFile } from "@eslint/compat";
import eslint from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import eslintPluginAstro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y";
import pluginReact from "eslint-plugin-react";
import reactCompiler from "eslint-plugin-react-compiler";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import vitest from "eslint-plugin-vitest";
import playwright from "eslint-plugin-playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";

// File path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

const baseConfig = tseslint.config({
  extends: [eslint.configs.recommended, tseslint.configs.strict, tseslint.configs.stylistic],
  rules: {
    "no-console": "warn",
    "no-unused-vars": "off",
  },
});

const jsxA11yConfig = tseslint.config({
  files: ["**/*.{js,jsx,ts,tsx}"],
  extends: [jsxA11y.flatConfigs.recommended],
  languageOptions: {
    ...jsxA11y.flatConfigs.recommended.languageOptions,
  },
  rules: {
    ...jsxA11y.flatConfigs.recommended.rules,
  },
});

const reactConfig = tseslint.config({
  files: ["**/*.{js,jsx,ts,tsx}"],
  extends: [pluginReact.configs.flat.recommended],
  languageOptions: {
    ...pluginReact.configs.flat.recommended.languageOptions,
    globals: {
      window: true,
      document: true,
    },
  },
  plugins: {
    "react-hooks": eslintPluginReactHooks,
    "react-compiler": reactCompiler,
  },
  settings: { react: { version: "detect" } },
  rules: {
    ...eslintPluginReactHooks.configs.recommended.rules,
    "react/react-in-jsx-scope": "off",
    "react-compiler/react-compiler": "error",
  },
});

// Vitest configuration dla testów jednostkowych
const vitestConfig = tseslint.config({
  files: ["**/*.test.{ts,tsx}", "tests/**/*.{ts,tsx}", "!tests/e2e/**"],
  plugins: {
    vitest,
  },
  rules: {
    ...vitest.configs.recommended.rules,
    "vitest/expect-expect": "warn",
    "vitest/no-disabled-tests": "warn",
    "vitest/no-focused-tests": "error",
    "vitest/valid-expect": "error",
  },
  languageOptions: {
    globals: {
      ...vitest.environments.env.globals,
    },
  },
});

// Playwright configuration dla testów E2E
const playwrightConfig = tseslint.config({
  files: ["tests/e2e/**/*.spec.{ts,tsx}"],
  plugins: {
    playwright,
  },
  rules: {
    ...playwright.configs["flat/recommended"].rules,
    "playwright/no-focused-test": "error",
    "playwright/valid-expect": "error",
    "playwright/prefer-web-first-assertions": "warn",
  },
});

export default tseslint.config(
  includeIgnoreFile(gitignorePath),
  {
    ignores: ["src/db/database.types.ts"],
  },
  baseConfig,
  jsxA11yConfig,
  reactConfig,
  vitestConfig,
  playwrightConfig,
  eslintPluginAstro.configs["flat/recommended"],
  eslintPluginPrettier
);
