/**
 * DeleteConfirmationDialog component
 * Modal confirming shopping list deletion
 */

import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  listId: string | null;
  listName: string | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmationDialog({
  isOpen,
  listName,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Usuń listę zakupów?</DialogTitle>
          <DialogDescription>
            Czy na pewno chcesz usunąć listę &quot;{listName}&quot;? Ta operacja jest nieodwracalna.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
            Anuluj
          </Button>

          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Usuwanie...
              </>
            ) : (
              "Usuń listę"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
