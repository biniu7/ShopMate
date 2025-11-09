/**
 * Sort Dropdown Component for Recipes List
 * Allows users to sort recipes by different criteria
 */
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { RecipeSortOption } from "@/types";
import { RECIPE_SORT_LABELS } from "@/types";

interface SortDropdownProps {
  value: RecipeSortOption;
  onChange: (value: RecipeSortOption) => void;
}

/**
 * Sort Dropdown Component
 * Select component with sort options for recipes list
 */
export function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <div className="sort-dropdown">
      <Label htmlFor="sort-select" className="sr-only">
        Sortuj przepisy
      </Label>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="sort-select" className="w-[200px]" aria-label="Sortuj przepisy">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created_desc">{RECIPE_SORT_LABELS.created_desc}</SelectItem>
          <SelectItem value="created_asc">{RECIPE_SORT_LABELS.created_asc}</SelectItem>
          <SelectItem value="name_asc">{RECIPE_SORT_LABELS.name_asc}</SelectItem>
          <SelectItem value="name_desc">{RECIPE_SORT_LABELS.name_desc}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
