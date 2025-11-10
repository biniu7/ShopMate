import React, { useState } from "react";
import type { SaveShoppingListItemDto, ShoppingListPreviewMetadataDto } from "@/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, AlertTriangle } from "lucide-react";
import ShoppingListPreview from "./ShoppingListPreview";
import NavigationButtons from "./NavigationButtons";
import SaveListDialog from "./SaveListDialog";

interface Step4_PreviewEditProps {
  items: SaveShoppingListItemDto[];
  metadata: ShoppingListPreviewMetadataDto | null;
  onUpdateItem: (index: number, field: string, value: string | number | null) => void;
  onRemoveItem: (index: number) => void;
  onAddItem: (item: SaveShoppingListItemDto) => void;
  onBack: () => void;
  onCancel: () => void;
  onSave: (name: string) => Promise<void>;
}

/**
 * Krok 4: Preview i edycja listy zakupów przed zapisem
 */
export default function Step4_PreviewEdit({
  items,
  metadata,
  onUpdateItem,
  onRemoveItem,
  onAddItem,
  onBack,
  onCancel,
  onSave,
}: Step4_PreviewEditProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  /**
   * Dodaj nowy pusty składnik do listy
   */
  const handleAddItem = () => {
    const newItem: SaveShoppingListItemDto = {
      ingredient_name: "",
      quantity: null,
      unit: null,
      category: "Inne",
      sort_order: items.length,
    };
    onAddItem(newItem);
  };

  /**
   * Walidacja przed zapisem
   */
  const isValid = items.length > 0 && items.every((item) => item.ingredient_name.trim().length > 0);

  return (
    <div className="step-4">
      <h2 className="text-2xl font-semibold mb-2">Podgląd listy zakupów</h2>
      <p className="text-gray-600 mb-6">Sprawdź i edytuj listę przed zapisem</p>

      {metadata && (
        <Alert variant={metadata.ai_categorization_status === "success" ? "default" : "default"} className="mb-6">
          {metadata.ai_categorization_status === "success" ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Lista zawiera <strong>{metadata.total_items}</strong> składników z{" "}
                <strong>{metadata.total_recipes}</strong> {metadata.total_recipes === 1 ? "przepisu" : "przepisów"}.
                Kategoryzacja AI: sukces.
              </AlertDescription>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription>
                Lista zawiera <strong>{metadata.total_items}</strong> składników z{" "}
                <strong>{metadata.total_recipes}</strong> {metadata.total_recipes === 1 ? "przepisu" : "przepisów"}.
                Automatyczna kategoryzacja niedostępna - możesz ręcznie przypisać kategorie.
              </AlertDescription>
            </>
          )}
        </Alert>
      )}

      <ShoppingListPreview
        items={items}
        onUpdateItem={onUpdateItem}
        onRemoveItem={onRemoveItem}
        onAddItem={handleAddItem}
      />

      {!isValid && items.length > 0 && (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Wszystkie składniki muszą mieć nazwę. Usuń puste składniki lub uzupełnij ich nazwy.
          </AlertDescription>
        </Alert>
      )}

      <NavigationButtons
        onBack={onBack}
        onCancel={onCancel}
        onSave={() => setSaveDialogOpen(true)}
        saveLabel="Zapisz listę"
      />

      <SaveListDialog
        isOpen={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={onSave}
        metadata={metadata}
      />
    </div>
  );
}
