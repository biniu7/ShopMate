/**
 * Shopping List by ID API Endpoint
 * GET /api/shopping-lists/:id - Get single shopping list with all items
 */

import type { APIRoute } from "astro";
import { shoppingListIdParamSchema } from "@/lib/validation/shopping-list.schema";
import { getShoppingListById } from "@/lib/services/shopping-list.service";
import type { ErrorResponseDto } from "@/types";

export const prerender = false;

/**
 * GET /api/shopping-lists/:id
 * Get a single shopping list with all items (sorted by category, sort_order, name)
 *
 * Response: 200 OK with ShoppingListResponseDto
 * Errors: 401 (unauthorized), 404 (not found), 500 (server error)
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Authentication
    const supabase = locals.supabase;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const errorResponse: ErrorResponseDto = {
        error: "Unauthorized",
        message: "You must be logged in to view shopping lists",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Validate path parameter (id)
    const listId = params.id;
    const validation = shoppingListIdParamSchema.safeParse({ id: listId });

    if (!validation.success) {
      // Invalid UUID format - treat as 404 (security best practice)
      const errorResponse: ErrorResponseDto = {
        error: "Not Found",
        message: "Shopping list not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 3: Fetch shopping list by ID via service
    const shoppingList = await getShoppingListById(supabase, user.id, validation.data.id);

    // Step 4: Check if found
    if (!shoppingList) {
      // Not found or doesn't belong to user - return 404
      const errorResponse: ErrorResponseDto = {
        error: "Not Found",
        message: "Shopping list not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 5: Return shopping list with sorted items
    return new Response(JSON.stringify(shoppingList), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=300", // 5 min cache
      },
    });
  } catch (error) {
    console.error("Error fetching shopping list:", error);

    const errorResponse: ErrorResponseDto = {
      error: "Internal server error",
      message: "Failed to fetch shopping list",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
