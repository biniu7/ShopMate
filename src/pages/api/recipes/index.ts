export const prerender = false;

import type { APIRoute } from "astro";
import { RecipeSchema } from "@/lib/validation/recipe.schema";
import { createRecipe } from "@/lib/services/recipe.service";

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
