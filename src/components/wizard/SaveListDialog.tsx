import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { ShoppingListPreviewMetadataDto } from "@/types";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface SaveListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  metadata: ShoppingListPreviewMetadataDto | null;
}

/**
 * Dialog zapisywania listy zakupów
 */
export default function SaveListDialog({ isOpen, onClose, onSave, metadata }: SaveListDialogProps) {
  const [listName, setListName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Ustaw domyślną nazwę po otwarciu dialogu
  useEffect(() => {
    if (isOpen) {
      setListName(getDefaultName(metadata));
    }
  }, [isOpen, metadata]);

  const handleSave = async () => {
    if (!listName.trim()) return;

    setIsSaving(true);
    try {
      await onSave(listName.trim());
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && listName.trim() && !isSaving) {
      handleSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zapisz listę zakupów</DialogTitle>
          <DialogDescription>Podaj nazwę dla listy zakupów</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label htmlFor="list-name">Nazwa listy</Label>
          <Input
            id="list-name"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={getDefaultName(metadata)}
            maxLength={200}
            disabled={isSaving}
            className="mt-2"
          />
          <p className="text-sm text-gray-600 mt-1">{listName.length}/200 znaków</p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Anuluj
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !listName.trim()}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />}
            Zapisz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Generuje domyślną nazwę listy zakupów
 */
function getDefaultName(metadata: ShoppingListPreviewMetadataDto | null): string {
  if (metadata?.source === "calendar" && metadata.week_start_date) {
    return `Lista zakupów - tydzień ${formatWeekRange(metadata.week_start_date)}`;
  }
  return `Lista zakupów - ${format(new Date(), "d MMMM yyyy", { locale: pl })}`;
}

/**
 * Formatuje zakres tygodnia (np. "20-26 stycznia")
 */
function formatWeekRange(weekStartDate: string): string {
  const startDate = new Date(weekStartDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const month = format(startDate, "MMMM", { locale: pl });

  return `${startDay}-${endDay} ${month}`;
}
