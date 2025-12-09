export const prerender = false;

import type { APIRoute } from "astro";
import { mealPlanQuerySchema, createMealPlanSchema } from "@/lib/validation/meal-plan.schema";
import {
  getMealPlanForWeek,
  verifyRecipeOwnership,
  checkDuplicateAssignment,
  createMealPlanAssignment,
} from "@/lib/services/meal-plan.service";
import type { WeekCalendarResponseDto, ErrorResponseDto, ValidationErrorResponseDto } from "@/types";

/**
 * GET /api/meal-plan - Get meal plan assignments for a specific week
 *
 * Returns all meal plan assignments for the authenticated user for a given week.
 * Requires valid Supabase session cookie.
 *
 * @param request - HTTP request
 * @param url - Request URL with query parameters
 * @param locals - Astro locals containing supabase client
 * @returns 200 OK with WeekCalendarResponseDto on success
 * @returns 400 Bad Request if validation fails
 * @returns 401 Unauthorized if not authenticated
 * @returns 500 Internal Server Error if database operation fails
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Step 1: Parse query parameters
    const queryParams = Object.fromEntries(url.searchParams);

    // Step 2: Validate query parameters with Zod
    const validation = mealPlanQuerySchema.safeParse(queryParams);

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

    // Step 4: Fetch meal plan via service
    const result: WeekCalendarResponseDto = await getMealPlanForWeek(
      locals.supabase,
      user.id,
      validation.data.week_start_date
    );

    // Step 5: Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 6: Error handling
    console.error("Error in GET /api/meal-plan:", error);

    // TODO: Add Sentry logging
    // Sentry.captureException(error, {
    //   tags: { endpoint: 'GET /api/meal-plan' },
    //   user: { id: user.id },
    //   extra: { week_start_date: validation.data.week_start_date }
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

/**
 * POST /api/meal-plan - Create a new meal plan assignment
 *
 * Assigns a recipe to a specific day and meal type in the user's weekly calendar.
 * Requires valid Supabase session cookie.
 *
 * Request body must include:
 * - recipe_id: UUID of the recipe to assign
 * - week_start_date: Monday date in YYYY-MM-DD format
 * - day_of_week: 1-7 (1 = Monday, 7 = Sunday)
 * - meal_type: breakfast | second_breakfast | lunch | dinner
 *
 * @param request - HTTP request with JSON body
 * @param locals - Astro locals containing supabase client
 * @returns 201 Created with MealPlanAssignmentDto on success
 * @returns 400 Bad Request if validation fails or slot is already assigned
 * @returns 401 Unauthorized if not authenticated
 * @returns 404 Not Found if recipe doesn't exist or doesn't belong to user
 * @returns 500 Internal Server Error if database operation fails
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Authentication check (early return for unauthenticated requests)
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

    // Step 2: Parse and validate request body
    const body = await request.json();
    const validation = createMealPlanSchema.safeParse(body);

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

    const input = validation.data;

    // Step 3: Verify recipe ownership (security check)
    const recipeExists = await verifyRecipeOwnership(locals.supabase, input.recipe_id, user.id);

    if (!recipeExists) {
      const errorResponse: ErrorResponseDto = {
        error: "Recipe not found or does not belong to user",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Check for duplicate assignment
    const isDuplicate = await checkDuplicateAssignment(
      locals.supabase,
      user.id,
      input.week_start_date,
      input.day_of_week,
      input.meal_type
    );

    if (isDuplicate) {
      const errorResponse: ErrorResponseDto = {
        error: "This meal slot is already assigned. Remove existing assignment first.",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 5: Create the assignment
    const { data: assignment, error: createError } = await createMealPlanAssignment(locals.supabase, user.id, input);

    if (createError || !assignment) {
      // Check if it's a duplicate key error (race condition)
      if (createError?.message?.includes("duplicate key")) {
        const errorResponse: ErrorResponseDto = {
          error: "This meal slot is already assigned. Remove existing assignment first.",
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw createError || new Error("Failed to create assignment");
    }

    // Step 6: Return success response (201 Created)
    return new Response(JSON.stringify(assignment), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 7: Global error handling
    console.error("Error in POST /api/meal-plan:", error);

    // TODO: Add Sentry logging
    // Sentry.captureException(error, {
    //   tags: { endpoint: 'POST /api/meal-plan' },
    //   user: { id: user?.id },
    //   extra: { request_body: body }
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
