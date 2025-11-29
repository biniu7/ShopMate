/**
 * Vitest setup file
 * Konfiguracja globalna dla testów jednostkowych i integracyjnych
 */

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup po każdym teście - usuwa renderowane komponenty
afterEach(() => {
  cleanup();
});

// Mock dla window.matchMedia (używany przez komponenty Radix UI)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock dla IntersectionObserver (używany przez react-intersection-observer)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock dla ResizeObserver (używany przez niektóre komponenty UI)
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;
