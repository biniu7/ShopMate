/**
 * IngredientItem - pojedynczy składnik z checkbox i tekstem
 * Checked state: line-through + muted color
 */
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ShoppingListItemDto } from "@/types";

interface IngredientItemProps {
  item: ShoppingListItemDto;
  onToggle: () => void;
}

export function IngredientItem({ item, onToggle }: IngredientItemProps) {
  return (
    <div
      className={cn(
        "ingredient-item flex items-center gap-3 p-3 border rounded-lg transition",
        item.is_checked && "bg-gray-50"
      )}
    >
      <Checkbox
        id={`item-${item.id}`}
        checked={item.is_checked}
        onCheckedChange={onToggle}
        className="h-6 w-6"
        aria-label={`Zaznacz składnik: ${item.ingredient_name}`}
      />

      <Label
        htmlFor={`item-${item.id}`}
        className={cn("flex-1 cursor-pointer", item.is_checked && "line-through text-gray-500")}
      >
        <span className="flex items-baseline gap-2">
          {item.quantity && <strong className="text-gray-900">{item.quantity}</strong>}
          {item.unit && <span className="text-gray-600">{item.unit}</span>}
          <span>{item.ingredient_name}</span>
        </span>
      </Label>
    </div>
  );
}
