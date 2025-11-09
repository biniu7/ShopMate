/**
 * Error Message Component for Recipes List
 * Displays error state with retry option
 */
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorMessageProps {
  error: Error;
  onRetry: () => void;
}

/**
 * Error Message Component
 * Displays error message with icon and retry button
 * Used when API requests fail
 */
export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  return (
    <div className="error-message py-16 text-center">
      <div className="max-w-md mx-auto">
        <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" aria-hidden="true" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Wystąpił błąd</h2>
        <p className="text-gray-600 mb-6">{error.message || "Nie udało się załadować przepisów"}</p>
        <Button onClick={onRetry} variant="outline" className="inline-flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Spróbuj ponownie
        </Button>
      </div>
    </div>
  );
}
