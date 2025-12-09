/**
 * Instructions Textarea Component
 * Textarea for recipe instructions with character counter
 */
import { memo } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface InstructionsTextareaProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

/**
 * Instructions Textarea Component
 * Displays textarea with character counter (max 5000)
 */
export const InstructionsTextarea = memo<InstructionsTextareaProps>(({ value, onChange, error }) => {
  const charCount = value.length;
  const maxChars = 5000;
  const isNearLimit = charCount > maxChars * 0.9;

  return (
    <div className="instructions-field space-y-2">
      <Label htmlFor="recipe-instructions" className="text-base font-medium">
        Instrukcje <span className="text-red-500">*</span>
      </Label>
      <Textarea
        id="recipe-instructions"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Opisz krok po kroku jak przygotować przepis...

1. Przygotuj składniki
2. ..."
        rows={8}
        className={`resize-none ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
        aria-invalid={!!error}
        aria-describedby={error ? "instructions-error" : "instructions-counter"}
      />
      <div className="flex justify-between items-center">
        <p
          id="instructions-counter"
          className={`text-sm ${isNearLimit ? "text-orange-600 font-medium" : "text-gray-600"}`}
          aria-live="polite"
        >
          {charCount}/{maxChars}
        </p>
        {error && (
          <p id="instructions-error" className="text-sm text-red-600 flex items-center gap-1" role="alert">
            <span>⚠</span> {error}
          </p>
        )}
      </div>
    </div>
  );
});

InstructionsTextarea.displayName = "InstructionsTextarea";
