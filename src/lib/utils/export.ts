/**
 * Export utility functions for shopping lists
 * Handles filename generation and categorization
 */
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { formatWeekRange } from "@/lib/utils/date";
import type { ShoppingListItemDto, IngredientCategory, ShoppingListResponseDto } from "@/types";
import { CATEGORY_ORDER } from "@/types";

/**
 * Group shopping list items by category
 * @param items - Shopping list items
 * @returns Items grouped by category
 */
export function groupByCategory(items: ShoppingListItemDto[]): Record<IngredientCategory, ShoppingListItemDto[]> {
  return items.reduce(
    (acc, item) => {
      const category = item.category as IngredientCategory;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    },
    {} as Record<IngredientCategory, ShoppingListItemDto[]>
  );
}

/**
 * Generate filename for export
 * Sanitizes list name and adds date
 * @param listName - Original list name
 * @param extension - File extension (pdf or txt)
 * @returns Sanitized filename
 */
export function generateFilename(listName: string, extension: "pdf" | "txt"): string {
  const sanitized = listName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const date = format(new Date(), "yyyy-MM-dd");

  return `${sanitized}-${date}.${extension}`;
}

/**
 * Get all categories in fixed order (even if empty)
 * @returns Array of all category names in fixed order
 */
export function getAllCategories(): IngredientCategory[] {
  return CATEGORY_ORDER;
}

/**
 * Generate shopping list as plain text (TXT export)
 * @param list - Shopping list with items
 * @returns Plain text content
 */
export function generateShoppingListTXT(list: ShoppingListResponseDto): string {
  const lines: string[] = [];

  // Header
  lines.push("=".repeat(50));
  lines.push("LISTA ZAKUPÓW SHOPMATE");
  lines.push("=".repeat(50));
  lines.push("");
  lines.push(`Nazwa: ${list.name}`);
  lines.push(`Data utworzenia: ${format(new Date(list.created_at), "d MMMM yyyy, HH:mm", { locale: pl })}`);

  if (list.week_start_date) {
    lines.push(`Tydzień: ${formatWeekRange(list.week_start_date)}`);
  }

  lines.push("");
  lines.push("=".repeat(50));
  lines.push("");

  // Categories
  const groupedItems = groupByCategory(list.items);

  CATEGORY_ORDER.forEach((category) => {
    const items = groupedItems[category];
    if (!items || items.length === 0) return;

    lines.push(category.toUpperCase());
    lines.push("-".repeat(20));

    items.forEach((item) => {
      const parts: string[] = [];
      if (item.quantity) parts.push(String(item.quantity));
      if (item.unit) parts.push(item.unit);
      parts.push(item.ingredient_name);

      lines.push(`☐ ${parts.join(" ")}`);
    });

    lines.push("");
  });

  // Footer
  lines.push("=".repeat(50));
  lines.push(`Wygenerowano: ${format(new Date(), "d MMMM yyyy, HH:mm", { locale: pl })}`);
  lines.push("=".repeat(50));

  return lines.join("\n");
}

/**
 * Download text content as TXT file
 * @param content - Text content to download
 * @param filename - Filename for download
 */
export function downloadTXT(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
