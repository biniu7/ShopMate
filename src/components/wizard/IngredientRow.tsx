import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";
import type { SaveShoppingListItemDto, IngredientCategory } from "@/types";
import { INGREDIENT_CATEGORIES } from "@/types";

interface IngredientRowProps {
  item: SaveShoppingListItemDto;
  onUpdate: (field: keyof SaveShoppingListItemDto, value: string | number | null | IngredientCategory) => void;
  onRemove: () => void;
}

/**
 * Edytowalny wiersz składnika w preview listy zakupów
 */
export default function IngredientRow({ item, onUpdate, onRemove }: IngredientRowProps) {
  return (
    <div className="ingredient-row flex items-center gap-2 p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
      {/* Checkbox (disabled - tylko dla preview) */}
      <Checkbox checked={false} disabled className="flex-shrink-0" />

      {/* Quantity */}
      <Input
        type="number"
        value={item.quantity ?? ""}
        onChange={(e) => onUpdate("quantity", e.target.value ? Number(e.target.value) : null)}
        className="w-20 flex-shrink-0"
        placeholder="200"
        min="0"
        step="any"
      />

      {/* Unit */}
      <Input
        type="text"
        value={item.unit ?? ""}
        onChange={(e) => onUpdate("unit", e.target.value || null)}
        className="w-20 flex-shrink-0"
        placeholder="g"
        maxLength={50}
      />

      {/* Ingredient name */}
      <Input
        type="text"
        value={item.ingredient_name}
        onChange={(e) => onUpdate("ingredient_name", e.target.value)}
        className="flex-1 min-w-0"
        placeholder="Nazwa składnika"
        maxLength={100}
        required
      />

      {/* Category */}
      <Select value={item.category} onValueChange={(value) => onUpdate("category", value as IngredientCategory)}>
        <SelectTrigger className="w-32 flex-shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {INGREDIENT_CATEGORIES.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Delete button */}
      <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Usuń składnik" className="flex-shrink-0">
        <Trash2 className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}
