/**
 * Shopping Lists API Endpoints
 * POST /api/shopping-lists - Save shopping list as immutable snapshot
 * GET /api/shopping-lists - Get user's shopping lists with pagination
 */

import type { APIRoute } from "astro";
import { saveShoppingListSchema, shoppingListQuerySchema } from "@/lib/validation/shopping-list.schema";
import { createShoppingList, getUserShoppingLists } from "@/lib/services/shopping-list.service";
import type { SaveShoppingListDto, ErrorResponseDto, ValidationErrorResponseDto } from "@/types";

export const prerender = false;

/**
 * POST /api/shopping-lists
 * Save shopping list as immutable snapshot after user edits preview
 *
 * Request body: SaveShoppingListDto
 * Response: 201 Created with ShoppingListResponseDto
 * Errors: 400 (validation), 401 (unauthorized), 500 (server error)
 */
export const POST: APIRoute = async ({ request, locals }) => {
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
        message: "You must be logged in to create a shopping list",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      const errorResponse: ErrorResponseDto = {
        error: "Invalid JSON",
        message: "Request body must be valid JSON",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 3: Validate with Zod
    const validation = saveShoppingListSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.flatten();
      const errorResponse: ValidationErrorResponseDto = {
        error: "Validation failed",
        details: errors.fieldErrors as Record<string, string[]>,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const dto: SaveShoppingListDto = validation.data;

    // Step 4: Create shopping list via service
    const shoppingList = await createShoppingList(supabase, user.id, dto);

    // Step 5: Return created list with 201 Created status
    return new Response(JSON.stringify(shoppingList), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating shopping list:", error);

    const errorResponse: ErrorResponseDto = {
      error: "Internal server error",
      message: "Failed to create shopping list",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * GET /api/shopping-lists
 * Get user's shopping lists with pagination
 *
 * Query params: page (default 1), limit (default 20, max 100)
 * Response: 200 OK with PaginatedResponse<ShoppingListListItemDto>
 * Errors: 400 (validation), 401 (unauthorized), 500 (server error)
 */
export const GET: APIRoute = async ({ request, locals }) => {
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

    // Step 2: Parse and validate query params
    const url = new URL(request.url);
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");

    const queryParams = {
      page: pageParam ? parseInt(pageParam, 10) : 1,
      limit: limitParam ? parseInt(limitParam, 10) : 20,
    };

    const validation = shoppingListQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      const errors = validation.error.flatten();
      const errorResponse: ValidationErrorResponseDto = {
        error: "Validation failed",
        details: errors.fieldErrors as Record<string, string[]>,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { page, limit } = validation.data;

    // Step 3: Fetch shopping lists via service
    const result = await getUserShoppingLists(supabase, user.id, page, limit);

    // Step 4: Return paginated lists with cache headers
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=300", // 5 min cache
      },
    });
  } catch (error) {
    console.error("Error fetching shopping lists:", error);

    const errorResponse: ErrorResponseDto = {
      error: "Internal server error",
      message: "Failed to fetch shopping lists",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
