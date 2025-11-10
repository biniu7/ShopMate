import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface NavigationButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  saveLabel?: string;
  backLabel?: string;
  isSaving?: boolean;
}

/**
 * Komponent nawigacyjny dla kroków wizarda
 */
export default function NavigationButtons({
  onBack,
  onNext,
  onCancel,
  onSave,
  nextDisabled = false,
  nextLabel = "Dalej",
  saveLabel = "Zapisz",
  backLabel = "Wstecz",
  isSaving = false,
}: NavigationButtonsProps) {
  return (
    <div className="flex justify-between mt-8">
      <div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            {backLabel}
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Anuluj
          </Button>
        )}

        {onNext && (
          <Button onClick={onNext} disabled={nextDisabled}>
            {nextLabel}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}

        {onSave && (
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? "Zapisywanie..." : saveLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
