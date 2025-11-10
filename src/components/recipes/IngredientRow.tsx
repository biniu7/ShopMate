/**
 * Ingredient Row Component
 * Single row for ingredient input (quantity, unit, name, delete button)
 */
import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { IngredientInputDto } from "@/types";

interface IngredientRowProps {
  index: number;
  ingredient: IngredientInputDto;
  onUpdate: (field: keyof IngredientInputDto, value: any) => void;
  onRemove: () => void;
  canRemove: boolean;
  error?: any;
}

/**
 * Ingredient Row Component
 * Displays inputs for quantity, unit, name and delete button
 */
export const IngredientRow = memo<IngredientRowProps>(({ index, ingredient, onUpdate, onRemove, canRemove, error }) => {
  return (
    <div className="ingredient-row">
      <div className="flex gap-2 items-start">
        {/* Quantity Input */}
        <div className="w-24">
          <Input
            type="number"
            value={ingredient.quantity ?? ""}
            onChange={(e) => onUpdate("quantity", e.target.value ? Number(e.target.value) : null)}
            placeholder="200"
            min="0"
            step="0.01"
            aria-label={`Ilość składnika ${index + 1}`}
            className="text-sm"
          />
        </div>

        {/* Unit Input */}
        <div className="w-24">
          <Input
            type="text"
            value={ingredient.unit ?? ""}
            onChange={(e) => onUpdate("unit", e.target.value || null)}
            placeholder="g"
            maxLength={50}
            aria-label={`Jednostka składnika ${index + 1}`}
            className="text-sm"
          />
        </div>

        {/* Name Input */}
        <div className="flex-1">
          <Input
            type="text"
            value={ingredient.name}
            onChange={(e) => onUpdate("name", e.target.value)}
            placeholder="np. mąka"
            maxLength={100}
            aria-invalid={!!error?.name}
            aria-describedby={error?.name ? `ingredient-${index}-error` : undefined}
            required
            className={`text-sm ${error?.name ? "border-red-500 focus-visible:ring-red-500" : ""}`}
            aria-label={`Nazwa składnika ${index + 1}`}
          />
        </div>

        {/* Delete Button */}
        <Button
          type="button"
          onClick={onRemove}
          variant="ghost"
          size="icon"
          disabled={!canRemove}
          aria-label={`Usuń składnik ${index + 1}`}
          className="flex-shrink-0 h-10 w-10 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title={!canRemove ? "Wymagany minimum 1 składnik" : "Usuń składnik"}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Error Message */}
      {error?.name && (
        <p id={`ingredient-${index}-error`} className="text-sm text-red-600 mt-1 ml-1 flex items-center gap-1" role="alert">
          <span>⚠</span> {error.name.message || error.name}
        </p>
      )}
    </div>
  );
});

IngredientRow.displayName = "IngredientRow";
