export const prerender = false;

import type { APIRoute } from "astro";
import { mealPlanQuerySchema } from "@/lib/validation/meal-plan.schema";
import { getMealPlanForWeek } from "@/lib/services/meal-plan.service";
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