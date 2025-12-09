/**
 * Ingredient Row Component
 * Single row for ingredient input (quantity, unit, name, delete button)
 */
import { memo, useCallback } from "react";
import { Controller } from "react-hook-form";
import type { Control, FieldError } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { RecipeSchemaType } from "@/lib/validation/recipe.schema";

interface IngredientRowProps {
  index: number;
  control: Control<RecipeSchemaType>;
  onRemove: (index: number) => void;
  canRemove: boolean;
  error?: { name?: FieldError; quantity?: FieldError; unit?: FieldError };
}

/**
 * Ingredient Row Component
 * Displays inputs for quantity, unit, name and delete button
 */
export const IngredientRow = memo<IngredientRowProps>(({ index, control, onRemove, canRemove, error }) => {
  const handleRemoveClick = useCallback(() => {
    onRemove(index);
  }, [index, onRemove]);

  // Block non-numeric input for quantity field
  const handleQuantityKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, decimal point
    if (
      [46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (e.keyCode === 65 && e.ctrlKey === true) ||
      (e.keyCode === 67 && e.ctrlKey === true) ||
      (e.keyCode === 86 && e.ctrlKey === true) ||
      (e.keyCode === 88 && e.ctrlKey === true) ||
      // Allow: home, end, left, right
      (e.keyCode >= 35 && e.keyCode <= 39)
    ) {
      return;
    }
    // Block if not a number (0-9)
    if ((e.shiftKey || e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  }, []);

  return (
    <div className="ingredient-row">
      <div className="flex gap-2 items-start">
        {/* Quantity Input */}
        <div className="w-24">
          <Controller
            name={`ingredients.${index}.quantity`}
            control={control}
            render={({ field }) => (
              <Input
                type="number"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                onKeyDown={handleQuantityKeyDown}
                placeholder="200"
                min="0"
                step="0.01"
                inputMode="numeric"
                aria-label={`Ilość składnika ${index + 1}`}
                className="text-sm"
                data-testid={`ingredient-quantity-${index}`}
              />
            )}
          />
        </div>

        {/* Unit Input */}
        <div className="w-24">
          <Controller
            name={`ingredients.${index}.unit`}
            control={control}
            render={({ field }) => (
              <Input
                type="text"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value || null)}
                placeholder="g"
                maxLength={50}
                aria-label={`Jednostka składnika ${index + 1}`}
                className="text-sm"
                data-testid={`ingredient-unit-${index}`}
              />
            )}
          />
        </div>

        {/* Name Input */}
        <div className="flex-1">
          <Controller
            name={`ingredients.${index}.name`}
            control={control}
            render={({ field }) => (
              <Input
                type="text"
                value={field.value}
                onChange={field.onChange}
                placeholder="np. mąka"
                maxLength={100}
                aria-invalid={!!error?.name}
                aria-describedby={error?.name ? `ingredient-${index}-error` : undefined}
                required
                className={`text-sm ${error?.name ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                aria-label={`Nazwa składnika ${index + 1}`}
                data-testid={`ingredient-name-${index}`}
              />
            )}
          />
        </div>

        {/* Delete Button */}
        <Button
          type="button"
          onClick={handleRemoveClick}
          variant="ghost"
          size="icon"
          disabled={!canRemove}
          aria-label={`Usuń składnik ${index + 1}`}
          className="flex-shrink-0 h-10 w-10 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title={!canRemove ? "Wymagany minimum 1 składnik" : "Usuń składnik"}
          data-testid={`remove-ingredient-${index}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Error Message */}
      {error?.name && (
        <p
          id={`ingredient-${index}-error`}
          className="text-sm text-red-600 mt-1 ml-1 flex items-center gap-1"
          role="alert"
        >
          <span>⚠</span> {error.name.message || error.name}
        </p>
      )}
    </div>
  );
});

IngredientRow.displayName = "IngredientRow";
