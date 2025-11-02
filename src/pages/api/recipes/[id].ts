export const prerender = false;

import type { APIRoute } from "astro";
import { getRecipeByIdParamsSchema } from "@/lib/validation/recipe.schema";
import { getRecipeById } from "@/lib/services/recipe.service";
import type { RecipeResponseDto, ErrorResponseDto } from "@/types";

/**
 * GET /api/recipes/:id - Get single recipe with all ingredients
 *
 * Fetches a single recipe with all ingredients and meal plan assignments count.
 * Only returns recipes that belong to the authenticated user.
 * Requires valid Supabase session cookie.
 *
 * @param params - Route parameters containing recipe ID
 * @param locals - Astro locals containing supabase client
 * @returns 200 OK with RecipeResponseDto on success
 * @returns 400 Bad Request if recipe ID is invalid UUID
 * @returns 401 Unauthorized if not authenticated
 * @returns 404 Not Found if recipe doesn't exist or doesn't belong to user
 * @returns 500 Internal Server Error if database operation fails
 */
export const GET: APIRoute = async ({ params, locals }) => {
  // Step 1: Validate path parameter :id
  const validation = getRecipeByIdParamsSchema.safeParse({ id: params.id });

  if (!validation.success) {
    const errorResponse: ErrorResponseDto = {
      error: "Invalid recipe ID format",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = validation.data;

  // Step 2: Authentication check
  const {
    data: { user },
    error: authError,
  } = await locals.supabase.auth.getUser();

  if (authError || !user) {
    const errorResponse: ErrorResponseDto = {
      error: "Unauthorized",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 3: Business logic - fetch recipe via service
  try {
    const recipe: RecipeResponseDto | null = await getRecipeById(locals.supabase, id, user.id);

    // If recipe not found or doesn't belong to user, return 404
    if (!recipe) {
      const errorResponse: ErrorResponseDto = {
        error: "Recipe not found",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Happy path - return recipe
    return new Response(JSON.stringify(recipe), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 5: Error handling
    console.error("Error in GET /api/recipes/:id:", error);

    // TODO: Add Sentry logging
    // Sentry.captureException(error, {
    //   tags: { endpoint: 'GET /api/recipes/:id', recipeId: id },
    //   user: { id: user.id }
    // });

    const errorResponse: ErrorResponseDto = {
      error: "Internal server error",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
