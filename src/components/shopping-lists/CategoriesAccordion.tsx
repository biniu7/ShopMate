/**
 * CategoriesAccordion - accordion z kategoriami składników
 * Tylko niepuste kategorie są wyświetlane
 */
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { IngredientItem } from "./IngredientItem";
import { CATEGORY_ORDER } from "@/types";
import type { ShoppingListItemDto } from "@/types";

interface CategoriesAccordionProps {
  items: ShoppingListItemDto[];
  onToggleItem: (itemId: string, currentChecked: boolean) => void;
}

export function CategoriesAccordion({ items, onToggleItem }: CategoriesAccordionProps) {
  return (
    <Accordion type="multiple" defaultValue={CATEGORY_ORDER} className="space-y-2">
      {CATEGORY_ORDER.map((category) => {
        const categoryItems = items
          .filter((item) => item.category === category)
          .sort((a, b) => a.sort_order - b.sort_order);

        if (categoryItems.length === 0) return null;

        return (
          <AccordionItem key={category} value={category}>
            <AccordionTrigger className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">{category}</span>
                <Badge variant="secondary">{categoryItems.length}</Badge>
              </div>
            </AccordionTrigger>

            <AccordionContent className="pt-4 space-y-2">
              {categoryItems.map((item) => (
                <IngredientItem key={item.id} item={item} onToggle={() => onToggleItem(item.id, item.is_checked)} />
              ))}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
