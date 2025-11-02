export const prerender = false;

import type { APIRoute } from "astro";
import { RecipeSchema, recipeListQuerySchema } from "@/lib/validation/recipe.schema";
import { createRecipe, getRecipesList } from "@/lib/services/recipe.service";
import type {
  PaginatedResponse,
  RecipeListItemDto,
  ErrorResponseDto,
  ValidationErrorResponseDto,
} from "@/types";

/**
 * POST /api/recipes - Create a new recipe
 *
 * Creates a new recipe with ingredients for the authenticated user.
 * Requires valid Supabase session cookie.
 *
 * @param request - HTTP request with CreateRecipeDto in body
 * @param locals - Astro locals containing supabase client
 * @returns 201 Created with RecipeResponseDto on success
 * @returns 401 Unauthorized if not authenticated
 * @returns 400 Bad Request if validation fails
 * @returns 500 Internal Server Error if database operation fails
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // Step 1: Authentication check
  const {
    data: { user },
    error: authError,
  } = await locals.supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Step 2: Parse request body
    const body = await request.json();

    // Step 3: Validate with Zod
    const validation = RecipeSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 4: Create recipe via service
    const recipe = await createRecipe(locals.supabase, user.id, validation.data);

    // Step 5: Return success response
    return new Response(JSON.stringify(recipe), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 6: Error handling
    console.error("Recipe creation error:", error);

    // TODO: Add Sentry logging
    // Sentry.captureException(error, {
    //   tags: { endpoint: 'POST /api/recipes' },
    //   user: { id: user.id }
    // });

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Something went wrong. Our team has been notified.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * GET /api/recipes - Get user's recipes with search, sorting, and pagination
 *
 * Returns a paginated list of recipes for the authenticated user.
 * Supports optional search, sorting, and pagination parameters.
 *
 * @param request - HTTP request
 * @param url - Request URL with query parameters
 * @param locals - Astro locals containing supabase client
 * @returns 200 OK with paginated recipes | 401 unauthorized | 400 validation error | 500 server error
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Step 1: Parse query parameters
    const queryParams = Object.fromEntries(url.searchParams);

    // Step 2: Validate query parameters
    const validation = recipeListQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      const errorResponse: ValidationErrorResponseDto = {
        error: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 3: Authentication check
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      const errorResponse: ErrorResponseDto = {
        error: "Unauthorized",
        message: "Authentication required",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Fetch recipes via service
    const result: PaginatedResponse<RecipeListItemDto> = await getRecipesList(
      locals.supabase,
      user.id,
      validation.data
    );

    // Step 5: Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 6: Error handling
    console.error("Error in GET /api/recipes:", error);

    const errorResponse: ErrorResponseDto = {
      error: "Internal server error",
      message: "An unexpected error occurred",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
