import React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Plus } from "lucide-react";
import type { SaveShoppingListItemDto, IngredientCategory } from "@/types";
import { CATEGORY_ORDER } from "@/types";
import IngredientRow from "./IngredientRow";

interface ShoppingListPreviewProps {
  items: SaveShoppingListItemDto[];
  onUpdateItem: (index: number, field: string, value: string | number | null | IngredientCategory) => void;
  onRemoveItem: (index: number) => void;
  onAddItem: () => void;
}

/**
 * Preview listy zakupów z grupowaniem po kategoriach
 */
export default function ShoppingListPreview({
  items,
  onUpdateItem,
  onRemoveItem,
  onAddItem,
}: ShoppingListPreviewProps) {
  /**
   * Grupuje składniki po kategoriach
   */
  const itemsByCategory = React.useMemo(() => {
    const grouped: Record<IngredientCategory, SaveShoppingListItemDto[]> = {
      Nabiał: [],
      Warzywa: [],
      Owoce: [],
      Mięso: [],
      Pieczywo: [],
      Przyprawy: [],
      Inne: [],
    };

    items.forEach((item) => {
      grouped[item.category].push(item);
    });

    return grouped;
  }, [items]);

  /**
   * Znajduje globalny indeks składnika (potrzebny do onUpdateItem/onRemoveItem)
   */
  const getGlobalIndex = (item: SaveShoppingListItemDto): number => {
    return items.indexOf(item);
  };

  return (
    <div className="shopping-list-preview space-y-4">
      {CATEGORY_ORDER.map((category) => {
        const categoryItems = itemsByCategory[category];

        if (categoryItems.length === 0) return null;

        return (
          <Collapsible key={category} defaultOpen className="border rounded-lg">
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg [&[data-state=closed]_.chevron]:rotate-180">
              <div className="flex items-center gap-3">
                <ChevronDown className="chevron h-4 w-4 transition-transform duration-200" />
                <h3 className="font-semibold text-lg">{category}</h3>
                <Badge variant="secondary">{categoryItems.length}</Badge>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent className="p-4 pt-2">
              <div className="space-y-2">
                {categoryItems.map((item) => {
                  const globalIndex = getGlobalIndex(item);
                  return (
                    <IngredientRow
                      key={globalIndex}
                      item={item}
                      onUpdate={(field, value) => onUpdateItem(globalIndex, field, value)}
                      onRemove={() => onRemoveItem(globalIndex)}
                    />
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}

      {items.length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <p className="text-gray-600">Brak składników na liście</p>
        </div>
      )}

      <Button variant="outline" onClick={onAddItem} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Dodaj składnik
      </Button>
    </div>
  );
}
