/**
 * Discard Changes Dialog Component
 * Confirmation dialog for discarding unsaved changes
 */
import { memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DiscardChangesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => void;
}

/**
 * Discard Changes Dialog
 * Shows confirmation dialog when user tries to leave form with unsaved changes
 */
export const DiscardChangesDialog = memo<DiscardChangesDialogProps>(({ isOpen, onClose, onDiscard }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Odrzucić zmiany?</DialogTitle>
          <DialogDescription>
            Masz niezapisane zmiany. Czy na pewno chcesz opuścić stronę? Wszystkie zmiany zostaną utracone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Kontynuuj edycję
          </Button>
          <Button variant="destructive" onClick={onDiscard}>
            Odrzuć zmiany
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

DiscardChangesDialog.displayName = "DiscardChangesDialog";
