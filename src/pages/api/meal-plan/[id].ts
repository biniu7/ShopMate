export const prerender = false;

import type { APIRoute } from "astro";
import { z } from "zod";
import { deleteMealPlanAssignment, NotFoundError, DatabaseError } from "@/lib/services/meal-plan.service";
import type { DeleteMealPlanResponseDto, ErrorResponseDto } from "@/types";

// UUID validation schema
const uuidSchema = z.string().uuid();

/**
 * DELETE /api/meal-plan/:id
 *
 * Usuwa przypisanie przepisu z kalendarza.
 * Wymaga uwierzytelnienia. Użytkownik może usunąć tylko swoje przypisania.
 */
export const DELETE: APIRoute = async (context) => {
  const { params } = context;
  const supabase = context.locals.supabase;

  // ===================================================================
  // Step 1: Extract and validate ID parameter
  // ===================================================================
  const assignmentId = params.id;

  if (!assignmentId) {
    const errorResponse: ErrorResponseDto = {
      error: "Missing assignment ID",
      message: "Assignment ID is required in URL path",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate UUID format
  const idValidation = uuidSchema.safeParse(assignmentId);
  if (!idValidation.success) {
    const errorResponse: ErrorResponseDto = {
      error: "Invalid assignment ID format",
      message: "Assignment ID must be a valid UUID",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ===================================================================
  // Step 2: Authentication check
  // ===================================================================
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.warn("[DELETE /api/meal-plan/:id] Unauthorized access attempt:", {
      assignmentId,
      authError: authError?.message,
    });

    const errorResponse: ErrorResponseDto = {
      error: "Unauthorized",
      message: "You must be logged in to perform this action",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ===================================================================
  // Step 3: Call service to delete assignment
  // ===================================================================
  try {
    await deleteMealPlanAssignment(supabase, user.id, assignmentId);

    // Success response
    const successResponse: DeleteMealPlanResponseDto = {
      message: "Assignment removed successfully",
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // ===================================================================
    // Step 4: Error handling
    // ===================================================================

    // Not Found Error (404)
    if (error instanceof NotFoundError) {
      const errorResponse: ErrorResponseDto = {
        error: "Assignment not found",
        message: error.message,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Database Error (500)
    if (error instanceof DatabaseError) {
      console.error("[DELETE /api/meal-plan/:id] Database error:", {
        assignmentId,
        userId: user.id,
        error: error.message,
      });

      // TODO: Sentry logging w production
      // if (import.meta.env.PROD) {
      //   Sentry.captureException(error, { tags: { endpoint: 'delete_meal_plan' } });
      // }

      const errorResponse: ErrorResponseDto = {
        error: "Internal server error",
        message: "An unexpected error occurred while deleting the assignment",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Unexpected errors (500)
    console.error("[DELETE /api/meal-plan/:id] Unexpected error:", {
      assignmentId,
      userId: user.id,
      error,
    });

    // TODO: Sentry logging w production
    // if (import.meta.env.PROD) {
    //   Sentry.captureException(error);
    // }

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
