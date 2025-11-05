/**
 * Shopping List Service
 * Handles business logic for saving and retrieving shopping lists
 *
 * Implements snapshot pattern: saved lists are immutable and don't update
 * when recipes are edited.
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type {
  SaveShoppingListDto,
  ShoppingListResponseDto,
  ShoppingListListItemDto,
  ShoppingListItemDto,
  PaginatedResponse,
  PaginationMetadata,
} from "@/types";
import { INGREDIENT_CATEGORIES } from "@/types";

/**
 * Create a new shopping list with items (snapshot pattern)
 * Uses transaction-like approach to ensure atomicity
 *
 * @param supabase - Authenticated Supabase client
 * @param userId - ID of the user creating the list
 * @param dto - Shopping list data with items
 * @returns Created shopping list with all items
 * @throws Error if list creation or items insertion fails
 */
export async function createShoppingList(
  supabase: SupabaseClient,
  userId: string,
  dto: SaveShoppingListDto
): Promise<ShoppingListResponseDto> {
  // Step 1: Insert shopping list
  const { data: list, error: listError } = await supabase
    .from("shopping_lists")
    .insert({
      user_id: userId,
      name: dto.name || "Lista zakupów",
      week_start_date: dto.week_start_date || null,
    })
    .select()
    .single();

  if (listError) {
    throw new Error(`Failed to create shopping list: ${listError.message}`);
  }

  // Step 2: Insert shopping list items (batch insert for performance)
  const itemsToInsert = dto.items.map((item) => ({
    shopping_list_id: list.id,
    ingredient_name: item.ingredient_name,
    quantity: item.quantity ?? null,
    unit: item.unit ?? null,
    category: item.category,
    sort_order: item.sort_order,
    is_checked: false, // Default value for new items
  }));

  const { data: items, error: itemsError } = await supabase
    .from("shopping_list_items")
    .insert(itemsToInsert)
    .select();

  if (itemsError) {
    // Rollback: delete the list (CASCADE will handle any items that were inserted)
    await supabase.from("shopping_lists").delete().eq("id", list.id);
    throw new Error(`Failed to create shopping list items: ${itemsError.message}`);
  }

  // Step 3: Return full response with list and items
  return {
    ...list,
    items: items || [],
  };
}

/**
 * Get user's shopping lists with pagination
 * Returns simplified list items without full items array
 *
 * @param supabase - Authenticated Supabase client
 * @param userId - ID of the user
 * @param page - Page number (1-indexed)
 * @param limit - Number of items per page
 * @returns Paginated list of shopping lists with metadata
 * @throws Error if database queries fail
 */
export async function getUserShoppingLists(
  supabase: SupabaseClient,
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<ShoppingListListItemDto>> {
  // Calculate offset for pagination
  const offset = (page - 1) * limit;

  // Step 1: Get total count of lists for this user
  const { count, error: countError } = await supabase
    .from("shopping_lists")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) {
    throw new Error(`Failed to count shopping lists: ${countError.message}`);
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  // Step 2: Get paginated lists (sorted by created_at DESC - newest first)
  const { data: lists, error: listsError } = await supabase
    .from("shopping_lists")
    .select("id, name, week_start_date, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (listsError) {
    throw new Error(`Failed to fetch shopping lists: ${listsError.message}`);
  }

  // Step 3: Get items count for each list
  // This is more efficient than loading all items
  const listIds = lists?.map((list) => list.id) || [];

  let itemsCounts: Record<string, number> = {};

  if (listIds.length > 0) {
    const { data: itemsData, error: itemsError } = await supabase
      .from("shopping_list_items")
      .select("shopping_list_id")
      .in("shopping_list_id", listIds);

    if (itemsError) {
      throw new Error(`Failed to count items: ${itemsError.message}`);
    }

    // Count items per list
    itemsCounts = (itemsData || []).reduce((acc, item) => {
      acc[item.shopping_list_id] = (acc[item.shopping_list_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  // Step 4: Map to response DTO
  const data: ShoppingListListItemDto[] = (lists || []).map((list) => ({
    id: list.id,
    name: list.name,
    week_start_date: list.week_start_date,
    items_count: itemsCounts[list.id] || 0,
    created_at: list.created_at,
  }));

  const pagination: PaginationMetadata = {
    page,
    limit,
    total,
    total_pages: totalPages,
  };

  return {
    data,
    pagination,
  };
}

/**
 * Get a single shopping list by ID with all items (sorted)
 * Returns null if list not found or doesn't belong to user
 *
 * @param supabase - Authenticated Supabase client
 * @param userId - ID of the user
 * @param listId - ID of the shopping list
 * @returns Shopping list with sorted items, or null if not found
 * @throws Error if database query fails
 */
export async function getShoppingListById(
  supabase: SupabaseClient,
  userId: string,
  listId: string
): Promise<ShoppingListResponseDto | null> {
  // Fetch shopping list with items in a single query (optimized)
  const { data, error } = await supabase
    .from("shopping_lists")
    .select("*, shopping_list_items(*)")
    .eq("id", listId)
    .eq("user_id", userId) // Explicit filter (RLS also enforces this)
    .single();

  if (error) {
    // Not found errors are expected (return null)
    if (error.code === "PGRST116") {
      return null;
    }
    // Other errors are unexpected (throw)
    throw new Error(`Failed to fetch shopping list: ${error.message}`);
  }

  // Data not found (shouldn't happen with .single(), but defensive coding)
  if (!data) {
    return null;
  }

  // Extract items and sort them
  const items = data.shopping_list_items || [];
  const sortedItems = sortShoppingListItems(items);

  // Return response DTO
  return {
    id: data.id,
    user_id: data.user_id,
    name: data.name,
    week_start_date: data.week_start_date,
    created_at: data.created_at,
    updated_at: data.updated_at,
    items: sortedItems,
  };
}

/**
 * Sort shopping list items by category (fixed order), sort_order, and name
 *
 * Sorting order:
 * 1. Category - fixed order from INGREDIENT_CATEGORIES constant
 * 2. sort_order - within each category (ascending)
 * 3. ingredient_name - alphabetically, case-insensitive (within same sort_order)
 *
 * @param items - Unsorted shopping list items
 * @returns Sorted shopping list items
 */
function sortShoppingListItems(
  items: ShoppingListItemDto[]
): ShoppingListItemDto[] {
  // Create category order map for O(1) lookup
  const categoryOrder = INGREDIENT_CATEGORIES.reduce((acc, category, index) => {
    acc[category] = index;
    return acc;
  }, {} as Record<string, number>);

  return [...items].sort((a, b) => {
    // 1. Sort by category order (fixed order from INGREDIENT_CATEGORIES)
    const categoryDiff = categoryOrder[a.category] - categoryOrder[b.category];
    if (categoryDiff !== 0) return categoryDiff;

    // 2. Sort by sort_order within category
    const sortOrderDiff = a.sort_order - b.sort_order;
    if (sortOrderDiff !== 0) return sortOrderDiff;

    // 3. Sort alphabetically by ingredient name (case-insensitive)
    return a.ingredient_name
      .toLowerCase()
      .localeCompare(b.ingredient_name.toLowerCase());
  });
}
