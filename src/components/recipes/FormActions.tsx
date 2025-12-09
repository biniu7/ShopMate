/**
 * Form Actions Component
 * Sticky footer with Cancel and Save buttons
 */
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface FormActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  isValid: boolean;
  mode?: "create" | "edit";
}

/**
 * Form Actions Component
 * Sticky bottom bar with form action buttons
 */
export const FormActions = memo<FormActionsProps>(({ onCancel, isSubmitting, isValid, mode = "create" }) => {
  const isEdit = mode === "edit";

  return (
    <div className="form-actions sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg mt-8 -mx-4">
      <div className="container mx-auto max-w-3xl flex gap-4 justify-end">
        <Button type="button" onClick={onCancel} variant="ghost" disabled={isSubmitting} className="min-w-24">
          Anuluj
        </Button>

        <Button type="submit" disabled={!isValid || isSubmitting} className="min-w-32">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isEdit ? "Aktualizowanie..." : "Zapisywanie..."}
            </>
          ) : isEdit ? (
            "Zapisz zmiany"
          ) : (
            "Zapisz przepis"
          )}
        </Button>
      </div>
    </div>
  );
});

FormActions.displayName = "FormActions";
