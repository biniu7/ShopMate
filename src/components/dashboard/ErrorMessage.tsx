/**
 * ErrorMessage - Komponent wyświetlający błędy
 * Pokazuje komunikat błędu z opcją ponowienia próby
 */

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorMessageProps {
  title?: string;
  message?: string;
  error?: Error | null;
  onRetry?: () => void;
}

export function ErrorMessage({
  title = "Wystąpił błąd",
  message = "Nie udało się załadować danych. Spróbuj ponownie.",
  error,
  onRetry,
}: ErrorMessageProps) {
  return (
    <div className="error-message max-w-2xl mx-auto py-12 px-4">
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-2">{title}</h3>

        {/* Message */}
        <p className="text-red-700 dark:text-red-300 mb-6">{message}</p>

        {/* Error details (dev mode) */}
        {error && import.meta.env.DEV && (
          <details className="mb-6 text-left">
            <summary className="text-sm text-red-600 dark:text-red-400 cursor-pointer mb-2">Szczegóły błędu</summary>
            <pre className="text-xs bg-red-100 dark:bg-red-900/20 p-3 rounded overflow-auto text-red-800 dark:text-red-200">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}

        {/* Retry button */}
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="lg">
            <RefreshCw className="w-4 h-4 mr-2" />
            Spróbuj ponownie
          </Button>
        )}
      </div>
    </div>
  );
}
