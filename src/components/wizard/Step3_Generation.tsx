import React from "react";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Step3_GenerationProps {
  status: "idle" | "fetching" | "categorizing" | "done" | "error";
  progress: number;
}

const STATUS_MESSAGES: Record<string, { title: string; description: string }> = {
  idle: {
    title: "Przygotowanie...",
    description: "Inicjalizacja generowania listy",
  },
  fetching: {
    title: "Pobieram składniki...",
    description: "Łączę składniki z wybranych przepisów",
  },
  categorizing: {
    title: "Kategoryzuję składniki...",
    description: "AI przypisuje kategorie do składników",
  },
  done: {
    title: "Gotowe!",
    description: "Lista została wygenerowana",
  },
  error: {
    title: "Wystąpił błąd",
    description: "Nie udało się wygenerować listy",
  },
};

/**
 * Krok 3: Loading state podczas generowania listy
 */
export default function Step3_Generation({ status, progress }: Step3_GenerationProps) {
  const message = STATUS_MESSAGES[status] || STATUS_MESSAGES.idle;

  return (
    <div className="step-3 text-center py-16">
      <Loader2 className="h-16 w-16 mx-auto mb-6 animate-spin text-primary" />

      <h2 className="text-2xl font-semibold mb-2">{message.title}</h2>
      <p className="text-gray-600 mb-8">{message.description}</p>

      <div className="max-w-md mx-auto">
        <Progress value={progress} className="mb-2" />
        <div className="text-sm text-gray-600">{progress}%</div>
      </div>
    </div>
  );
}
