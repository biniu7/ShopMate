/**
 * Delete Confirmation Dialog - dialog potwierdzający usunięcie przepisu
 * Wyświetla komunikat o konsekwencjach (usunięcie przypisań w kalendarzu)
 */
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: string;
  recipeName: string;
  assignmentsCount: number;
  onConfirm: () => void;
  isDeleting: boolean;
}

/**
 * DeleteConfirmationDialog
 * Modal dialog potwierdzający usunięcie przepisu
 * Wyświetla komunikat o konsekwencjach (usunięcie przypisań w kalendarzu jeśli istnieją)
 */
export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  recipeName,
  assignmentsCount,
  onConfirm,
  isDeleting,
}: DeleteConfirmationDialogProps) {
  // Plural forms for Polish
  const mealLabel = assignmentsCount === 1 ? "posiłku" : "posiłków";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Usuń przepis?</DialogTitle>
          <DialogDescription>
            {assignmentsCount > 0 ? (
              <>
                Ten przepis &quot;{recipeName}&quot; jest przypisany do{" "}
                <strong>
                  {assignmentsCount} {mealLabel}
                </strong>{" "}
                w kalendarzu. Usunięcie spowoduje usunięcie wszystkich przypisań.
              </>
            ) : (
              <>Czy na pewno chcesz usunąć przepis &quot;{recipeName}&quot;?</>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
            Anuluj
          </Button>

          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                Usuwanie...
              </>
            ) : assignmentsCount > 0 ? (
              "Usuń przepis i przypisania"
            ) : (
              "Usuń przepis"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
