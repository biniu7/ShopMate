/**
 * Toaster Component
 * Global toast notification container using Sonner
 */
import { Toaster as SonnerToaster } from "sonner";

/**
 * Toaster Component
 * Should be placed at the root layout level
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          fontFamily: "system-ui, -apple-system, sans-serif",
        },
        className: "toast",
        duration: 5000,
      }}
    />
  );
}
