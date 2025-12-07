/**
 * API functions for shopping lists
 * Handles shopping list generation, preview, and CRUD operations
 */
import type {
  ShoppingListPreviewRequestDto,
  ShoppingListPreviewResponseDto,
  SaveShoppingListDto,
  ShoppingListResponseDto,
} from "@/types";

/**
 * Generate shopping list preview
 *
 * @param request - Preview request (calendar or recipes mode)
 * @returns Preview with items and metadata
 * @throws Error if request fails
 */
export async function generatePreview(
  request: ShoppingListPreviewRequestDto
): Promise<ShoppingListPreviewResponseDto> {
  const response = await fetch("/api/shopping-lists/preview", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to generate preview" }));
    throw new Error(errorData.error || "Failed to generate preview");
  }

  return response.json();
}

/**
 * Save shopping list
 *
 * @param data - Shopping list data (name, items, dates)
 * @returns Saved shopping list with ID
 * @throws Error if request fails
 */
export async function saveShoppingList(data: SaveShoppingListDto): Promise<ShoppingListResponseDto> {
  const response = await fetch("/api/shopping-lists", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to save shopping list" }));
    throw new Error(errorData.error || "Failed to save shopping list");
  }

  return response.json();
}

/**
 * Fetch single shopping list by ID
 *
 * @param listId - Shopping list ID
 * @returns Shopping list with items
 * @throws Error if request fails
 */
export async function fetchShoppingList(listId: string): Promise<ShoppingListResponseDto> {
  const response = await fetch(`/api/shopping-lists/${listId}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to fetch shopping list" }));
    throw new Error(errorData.error || "Failed to fetch shopping list");
  }

  return response.json();
}

/**
 * Delete shopping list
 *
 * @param listId - Shopping list ID
 * @returns Success response
 * @throws Error if request fails
 */
export async function deleteShoppingList(listId: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`/api/shopping-lists/${listId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to delete shopping list" }));
    throw new Error(errorData.error || "Failed to delete shopping list");
  }

  return response.json();
}
