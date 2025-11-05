/**
 * Shopping List Item Update API Endpoint
 * PATCH /api/shopping-lists/:list_id/items/:item_id - Update item checked status
 *
 * This is the ONLY mutation allowed on saved shopping lists (snapshot pattern).
 * Updating is_checked does NOT violate immutability.
 */

import type { APIRoute } from "astro";
import { updateShoppingListItemSchema, uuidParamSchema } from "@/lib/validation/shopping-list.schema";
import { updateItemCheckedStatus } from "@/lib/services/shopping-list.service";
import type { ErrorResponseDto, ValidationErrorResponseDto } from "@/types";

export const prerender = false;

/**
 * PATCH /api/shopping-lists/:list_id/items/:item_id
 * Toggle item checked status (mark as purchased/unpurchased)
 *
 * Request Body: { is_checked: boolean }
 * Response: 200 OK with updated ShoppingListItem
 * Errors: 400 (validation), 401 (unauthorized), 404 (not found), 500 (server error)
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    const supabase = locals.supabase;
    const { list_id, item_id } = params;

    // Step 1: Validate path parameters (UUID format)
    const listIdValidation = uuidParamSchema.safeParse(list_id);
    const itemIdValidation = uuidParamSchema.safeParse(item_id);

    if (!listIdValidation.success) {
      const errorResponse: ValidationErrorResponseDto = {
        error: "Validation Error",
        details: { list_id: ["Nieprawidłowy format UUID"] },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!itemIdValidation.success) {
      const errorResponse: ValidationErrorResponseDto = {
        error: "Validation Error",
        details: { item_id: ["Nieprawidłowy format UUID"] },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      const errorResponse: ErrorResponseDto = {
        error: "Bad Request",
        message: "Nieprawidłowy format JSON",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 3: Validate request body
    const bodyValidation = updateShoppingListItemSchema.safeParse(requestBody);
    if (!bodyValidation.success) {
      const errorResponse: ValidationErrorResponseDto = {
        error: "Validation Error",
        details: bodyValidation.error.flatten().fieldErrors,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const errorResponse: ErrorResponseDto = {
        error: "Unauthorized",
        message: "Musisz być zalogowany aby wykonać tę operację",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 5: Update item checked status via service
    const updatedItem = await updateItemCheckedStatus(
      supabase,
      listIdValidation.data,
      itemIdValidation.data,
      user.id,
      bodyValidation.data.is_checked
    );

    // Step 6: Return updated item
    return new Response(JSON.stringify(updatedItem), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Step 7: Error handling
    // Distinguish NOT_FOUND from other errors
    if (error instanceof Error && error.message === "NOT_FOUND") {
      const errorResponse: ErrorResponseDto = {
        error: "Not Found",
        message: "Element listy nie został znaleziony",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Log unexpected errors for debugging
    console.error("Error updating shopping list item:", error);

    // Generic server error response
    const errorResponse: ErrorResponseDto = {
      error: "Internal Server Error",
      message: "Wystąpił błąd podczas aktualizacji elementu",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
