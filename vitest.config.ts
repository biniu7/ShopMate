import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment dla testów DOM
    environment: 'jsdom',

    // Globalne funkcje testowe (describe, it, expect)
    globals: true,

    // Setup files
    setupFiles: ['./tests/setup.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.astro/',
        'build/',
        'tests/**',                  // Wszystkie testy w folderze tests/
        'src/**/*.test.{ts,tsx}',    // Pliki testowe kolokowane z kodem
        'src/**/*.spec.{ts,tsx}',    // Pliki spec kolokowane z kodem
        '**/*.config.*',             // Pliki konfiguracyjne
        '**/*.d.ts',                 // Definicje TypeScript
        '**/types.ts',               // Pliki z typami
        'src/env.d.ts',              // Env types Astro
      ],
      // Progi coverage (zgodnie z tech-stack.md)
      // Dla MVP: 60%, docelowo: src/lib min 80%, components min 60%
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },

    // Include patterns (tylko .test.ts, nie .spec.ts dla Playwright)
    include: [
      'src/**/*.test.{ts,tsx}',
      'tests/**/*.test.{ts,tsx}',
    ],

    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      '.astro',
      'build',
      'tests/e2e/**', // Wyklucz testy E2E Playwright
    ],
  },

  // Resolve aliases (zgodnie z tsconfig.json)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});