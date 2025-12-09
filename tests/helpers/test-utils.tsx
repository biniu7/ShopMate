/**
 * Test utilities dla React Testing Library
 * Custom render function z providers i helper functions
 */

import { render, type RenderOptions } from "@testing-library/react";
import { type ReactElement } from "react";

/**
 * Custom render function który opakowuje komponenty w niezbędne providery
 * Rozszerz ten wrapper o QueryClientProvider, Router, itp. gdy będą potrzebne
 */
function customRender(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { ...options });
}

// Re-export wszystkiego z testing-library
export * from "@testing-library/react";

// Override render function
export { customRender as render };
