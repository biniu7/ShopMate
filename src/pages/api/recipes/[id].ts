export const prerender = false;

import type { APIRoute } from "astro";
import { getRecipeByIdParamsSchema, deleteRecipeParamsSchema, RecipeSchema } from "@/lib/validation/recipe.schema";
import { getRecipeById, updateRecipe, deleteRecipe } from "@/lib/services/recipe.service";
import type {
  RecipeResponseDto,
  ErrorResponseDto,
  ValidationErrorResponseDto,
  DeleteRecipeResponseDto,
} from "@/types";

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

/**
 * PUT /api/recipes/:id - Update recipe and ingredients (full replacement)
 *
 * Updates an existing recipe with full replacement of ingredients.
 * All old ingredients are deleted and new ones are created.
 * Only allows updating recipes that belong to the authenticated user.
 * Changes propagate to meal plan assignments (live update).
 * Changes do NOT propagate to saved shopping lists (snapshot pattern).
 *
 * @param params - Route parameters containing recipe ID
 * @param request - Request object containing recipe data
 * @param locals - Astro locals containing supabase client
 * @returns 200 OK with RecipeResponseDto on success
 * @returns 400 Bad Request if validation fails
 * @returns 401 Unauthorized if not authenticated
 * @returns 404 Not Found if recipe doesn't exist or doesn't belong to user
 * @returns 500 Internal Server Error if database operation fails
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  // Step 1: Check authentication
  const {
    data: { user },
    error: authError,
  } = await locals.supabase.auth.getUser();

  if (authError || !user) {
    const errorResponse: ErrorResponseDto = {
      error: "Unauthorized",
      message: "User not authenticated",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = user.id;

  // Step 2: Validate path parameter
  const paramValidation = getRecipeByIdParamsSchema.safeParse({ id: params.id });
  if (!paramValidation.success) {
    const errorResponse: ErrorResponseDto = {
      error: "Bad Request",
      message: "Invalid recipe ID format",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id: recipeId } = paramValidation.data;

  // Step 3: Parse request body
  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    const errorResponse: ErrorResponseDto = {
      error: "Bad Request",
      message: "Invalid JSON in request body",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 4: Validate request body
  const validation = RecipeSchema.safeParse(requestBody);
  if (!validation.success) {
    const errorResponse: ValidationErrorResponseDto = {
      error: "Validation error",
      details: validation.error.flatten().fieldErrors,
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const updateData = validation.data;

  // Step 5: Update recipe via service
  try {
    const updatedRecipe = await updateRecipe(locals.supabase, recipeId, userId, updateData);

    if (!updatedRecipe) {
      const errorResponse: ErrorResponseDto = {
        error: "Not Found",
        message: "Recipe not found",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 6: Return success response
    return new Response(JSON.stringify(updatedRecipe), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to update recipe:", error);

    // TODO: Add Sentry logging
    // Sentry.captureException(error, {
    //   tags: { endpoint: 'PUT /api/recipes/:id', recipeId: recipeId },
    //   user: { id: userId }
    // });

    const errorResponse: ErrorResponseDto = {
      error: "Internal Server Error",
      message: "Failed to update recipe",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * DELETE /api/recipes/:id - Delete recipe with CASCADE deletion
 *
 * Deletes a recipe along with all associated data:
 * - All ingredients (CASCADE)
 * - All meal plan assignments (CASCADE)
 * Returns the count of deleted meal plan assignments.
 * Only allows deleting recipes that belong to the authenticated user.
 * Deletion is permanent - no soft delete.
 *
 * @param params - Route parameters containing recipe ID
 * @param locals - Astro locals containing supabase client
 * @returns 200 OK with DeleteRecipeResponseDto on success
 * @returns 400 Bad Request if recipe ID is invalid UUID
 * @returns 401 Unauthorized if not authenticated
 * @returns 404 Not Found if recipe doesn't exist or doesn't belong to user
 * @returns 500 Internal Server Error if database operation fails
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  // Step 1: Validate path parameter :id
  const validation = deleteRecipeParamsSchema.safeParse({ id: params.id });

  if (!validation.success) {
    const errorResponse: ErrorResponseDto = {
      error: "Validation error",
      message: "Invalid recipe ID format",
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
      message: "Authentication required",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 3: Business logic - delete recipe via service
  try {
    const result = await deleteRecipe(locals.supabase, id, user.id);

    // If recipe not found or doesn't belong to user, return 404
    if (!result) {
      const errorResponse: ErrorResponseDto = {
        error: "Not found",
        message: "Recipe not found or access denied",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Happy path - return success with deletion count
    const response: DeleteRecipeResponseDto = {
      message: "Recipe deleted successfully",
      deleted_meal_plan_assignments: result.deleted_meal_plan_assignments,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 5: Error handling
    console.error("Error in DELETE /api/recipes/:id:", error);

    // TODO: Add Sentry logging
    // Sentry.captureException(error, {
    //   tags: { endpoint: 'DELETE /api/recipes/:id', recipeId: id },
    //   user: { id: user.id }
    // });

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
