/**
 * ShoppingListDetailsContent - główna zawartość z tytułem, meta informacjami oraz accordion
 */
import { ListMeta } from "./ListMeta";
import { CategoriesAccordion } from "./CategoriesAccordion";
import type { ShoppingListResponseDto } from "@/types";

interface ShoppingListDetailsContentProps {
  list: ShoppingListResponseDto;
  onToggleItem: (itemId: string, currentChecked: boolean) => void;
}

export function ShoppingListDetailsContent({ list, onToggleItem }: ShoppingListDetailsContentProps) {
  return (
    <div className="shopping-list-details-content container mx-auto max-w-4xl p-4">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">{list.name}</h1>

      <ListMeta createdAt={list.created_at} weekStartDate={list.week_start_date} />

      <div className="mt-8">
        <CategoriesAccordion items={list.items} onToggleItem={onToggleItem} />
      </div>
    </div>
  );
}
