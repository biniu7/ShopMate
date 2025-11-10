export const prerender = false;

import type { APIRoute } from "astro";
import { z } from "zod";
import { OpenRouterService } from "@/lib/services/openrouter";
import type { ErrorResponseDto, ValidationErrorResponseDto } from "@/types";

/**
 * Zod schema for categorize ingredients request body
 */
const categorizeIngredientsSchema = z.object({
  ingredients: z
    .array(
      z.object({
        id: z.string().uuid("ID składnika musi być w formacie UUID"),
        name: z
          .string()
          .min(1, "Nazwa składnika nie może być pusta")
          .max(100, "Nazwa składnika nie może przekraczać 100 znaków"),
      })
    )
    .min(1, "Lista składników nie może być pusta")
    .max(100, "Można kategoryzować maksymalnie 100 składników na raz"),
});

/**
 * Response type for categorize ingredients endpoint
 */
interface CategorizeIngredientsResponseDto {
  success: boolean;
  categories: Record<string, string>;
}

/**
 * POST /api/ai/categorize-ingredients - Categorize recipe ingredients using AI
 *
 * Categorizes a list of ingredients into predefined categories using OpenRouter API.
 * Categories: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne
 *
 * @param request - HTTP request with ingredients array in body
 * @param locals - Astro locals containing supabase client
 * @returns 200 OK with categories mapping on success
 * @returns 401 Unauthorized if not authenticated
 * @returns 400 Bad Request if validation fails
 * @returns 500 Internal Server Error if AI categorization fails
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // Step 1: Authentication check
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

  try {
    // Step 2: Parse request body
    const body = await request.json();

    // Step 3: Validate with Zod
    const validation = categorizeIngredientsSchema.safeParse(body);

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

    const { ingredients } = validation.data;

    // Step 4: Call OpenRouter service for categorization
    const service = new OpenRouterService();
    const result = await service.categorizeIngredients(ingredients);

    // Step 5: Handle categorization failure
    if (!result.success) {
      const errorResponse: ErrorResponseDto = {
        error: "Categorization failed",
        message: result.error?.message || "Failed to categorize ingredients",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 6: Return success response
    const successResponse: CategorizeIngredientsResponseDto = {
      success: true,
      categories: result.categories,
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 7: Error handling
    console.error("[API] Categorize ingredients error:", error);

    // TODO: Add Sentry logging
    // Sentry.captureException(error, {
    //   tags: { endpoint: 'POST /api/ai/categorize-ingredients' },
    //   user: { id: user.id }
    // });

    const errorResponse: ErrorResponseDto = {
      error: "Internal server error",
      message: "An unexpected error occurred. Our team has been notified.",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
