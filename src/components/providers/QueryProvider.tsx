/**
 * TanStack Query Provider for React Query
 * Provides query client context to all child components
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create query client with configuration
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: 0 for meal plan (always fresh)
            staleTime: 0,
            // Refetch on window focus
            refetchOnWindowFocus: true,
            // Retry failed requests 3 times
            retry: 3,
            // Exponential backoff
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // Retry mutations once
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
