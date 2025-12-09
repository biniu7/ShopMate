/**
 * POST /api/shopping-lists/preview
 * Generate shopping list preview with aggregated ingredients and AI categorization
 *
 * This endpoint does NOT save the list to the database - it only returns a preview.
 * Users can review the preview before deciding to save it via POST /api/shopping-lists
 */

import type { APIContext } from "astro";
import { shoppingListPreviewRequestSchema } from "@/lib/validation/shopping-list.schema";
import { generateShoppingListPreview } from "@/lib/services/shopping-list-preview.service";

// Disable prerendering for this API route (server-side only)
export const prerender = false;

/**
 * POST handler for shopping list preview
 *
 * @param context - Astro API context
 * @returns Response with preview data or error
 */
export async function POST(context: APIContext) {
  try {
    // ============================================================================
    // Step 1: Authentication Check
    // ============================================================================
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      console.warn("[POST /api/shopping-lists/preview] Unauthorized access attempt");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[POST /api/shopping-lists/preview] User ${user.id} requesting preview`);

    // ============================================================================
    // Step 2: Parse & Validate Request Body
    // ============================================================================
    let body: unknown;
    try {
      body = await context.request.json();
    } catch (error) {
      console.error("[POST /api/shopping-lists/preview] Invalid JSON body:", error);
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validation = shoppingListPreviewRequestSchema.safeParse(body);

    if (!validation.success) {
      console.warn("[POST /api/shopping-lists/preview] Validation failed:", validation.error.flatten().fieldErrors);
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

    const validatedRequest = validation.data;

    // ============================================================================
    // Step 3: Generate Preview
    // ============================================================================
    const preview = await generateShoppingListPreview(context.locals.supabase, user.id, validatedRequest);

    // ============================================================================
    // Step 4: Return Success Response
    // ============================================================================
    console.log(
      `[POST /api/shopping-lists/preview] Preview generated successfully. ${preview.items.length} items, AI status: ${preview.metadata.ai_categorization_status}`
    );

    return new Response(JSON.stringify(preview), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // ============================================================================
    // Error Handling
    // ============================================================================

    // Business logic errors (thrown from service)
    if (error instanceof Error && error.message === "No recipes found") {
      console.warn("[POST /api/shopping-lists/preview] No recipes found for request");
      return new Response(JSON.stringify({ error: "No recipes selected or all selected meals are empty" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Unexpected errors
    console.error("[POST /api/shopping-lists/preview] Unexpected error:", error);

    // Log to Sentry if configured (optional - uncomment when Sentry is set up)
    // if (import.meta.env.SENTRY_DSN) {
    //   Sentry.captureException(error, {
    //     tags: { endpoint: "POST /api/shopping-lists/preview" },
    //     extra: { user_id: user?.id }
    //   });
    // }

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An unexpected error occurred while generating the preview",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
