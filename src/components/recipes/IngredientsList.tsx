/**
 * Ingredients List Component
 * Dynamic list of ingredients with add/remove functionality
 */
import { memo } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { IngredientRow } from "./IngredientRow";
import type { IngredientInputDto } from "@/types";

interface IngredientsListProps {
  ingredients: (IngredientInputDto & { id: string })[];
  onAdd: (ingredient: IngredientInputDto) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof IngredientInputDto, value: any) => void;
  errors?: Record<number, any>;
}

/**
 * Ingredients List Component
 * Manages dynamic list of ingredient rows (min 1, max 50)
 */
export const IngredientsList = memo<IngredientsListProps>(({ ingredients, onAdd, onRemove, onUpdate, errors }) => {
  const canAddMore = ingredients.length < 50;
  const canRemove = ingredients.length > 1;

  const handleAddIngredient = () => {
    onAdd({
      name: "",
      quantity: null,
      unit: null,
      sort_order: ingredients.length,
    });
  };

  return (
    <div className="ingredients-list space-y-4">
      {/* Header */}
      <div>
        <Label className="text-base font-medium">
          Składniki <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-gray-600 mt-1">
          Dodaj składniki (minimum 1, maksimum 50). Ilość i jednostka są opcjonalne.
        </p>
      </div>

      {/* Ingredients Rows */}
      <div className="space-y-3" role="list" aria-label="Lista składników">
        {ingredients.map((ingredient, index) => (
          <div key={ingredient.id} role="listitem">
            <IngredientRow
              index={index}
              ingredient={ingredient}
              onUpdate={(field, value) => onUpdate(index, field, value)}
              onRemove={() => onRemove(index)}
              canRemove={canRemove}
              error={errors?.[index]}
            />
          </div>
        ))}
      </div>

      {/* Add Ingredient Button */}
      <Button
        type="button"
        onClick={handleAddIngredient}
        variant="outline"
        disabled={!canAddMore}
        className="w-full border-dashed border-2 hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={!canAddMore ? "Osiągnięto maksimum 50 składników" : "Dodaj składnik"}
      >
        <Plus className="h-4 w-4 mr-2" />
        Dodaj składnik {!canAddMore && `(${ingredients.length}/50)`}
      </Button>

      {/* Helper text */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-xs text-blue-800">
          <strong>💡 Wskazówka:</strong> Ilość (np. 200) i jednostka (np. g, kg, sztuki) są opcjonalne. Nazwa składnika
          jest wymagana.
        </p>
      </div>
    </div>
  );
});

IngredientsList.displayName = "IngredientsList";
