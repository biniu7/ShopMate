import type { APIRoute } from "astro";
import { trackExportSchema } from "@/lib/validation/analytics.schema";
import { trackExportEvent } from "@/lib/services/analytics.service";

/**
 * POST /api/analytics/export
 *
 * Track PDF/TXT export events for analytics purposes.
 * This is an optional tracking endpoint - actual file generation happens client-side.
 *
 * @security Requires authentication (Supabase session)
 * @security User can only track exports of their own shopping lists
 *
 * @returns 204 No Content - Export event tracked successfully
 * @returns 401 Unauthorized - User not authenticated
 * @returns 400 Bad Request - Invalid request data
 * @returns 404 Not Found - Shopping list not found or access denied
 * @returns 500 Internal Server Error - Unexpected error during tracking
 */
export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Authentication check
    // Verify user is authenticated via Supabase session
    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Parse and validate request body
    // Use Zod schema to ensure data integrity
    const body = await request.json();
    const validation = trackExportSchema.safeParse(body);

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

    const { shopping_list_id, format } = validation.data;

    // 3. Authorization: Check if shopping list belongs to user
    // Security: Users can only track exports of their own lists
    // Query only 'id' field for performance (lightweight check)
    const { data: list, error: listError } = await locals.supabase
      .from("shopping_lists")
      .select("id")
      .eq("id", shopping_list_id)
      .eq("user_id", user.id)
      .single();

    if (listError || !list) {
      // Return 404 to avoid leaking information about list existence
      return new Response(
        JSON.stringify({
          error: "Not found",
          message: "Shopping list not found or access denied",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 4. Track export event
    // MVP: Simple console logging
    // Future: Can be extended to persistent analytics storage
    await trackExportEvent({
      userId: user.id,
      shoppingListId: shopping_list_id,
      format,
      timestamp: new Date().toISOString(),
    });

    // 5. Success response (204 No Content)
    // No response body needed - tracking is fire-and-forget from client perspective
    return new Response(null, { status: 204 });
  } catch (error) {
    // Catch-all error handler for unexpected errors
    console.error("[POST /api/analytics/export] Unexpected error:", error);

    // TODO: Send to Sentry in production
    // Sentry.captureException(error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to track export event",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
