/**
 * Update Password API Endpoint
 *
 * Server-side endpoint for updating password after reset
 * Based on spec 31_1_auth-spec.md section 4.5 (US-003)
 *
 * Flow:
 * 1. User clicks link in reset email (with access_token)
 * 2. Client sends new password + confirm password
 * 3. Server validates with Zod schema
 * 4. Server calls Supabase Auth updateUser
 * 5. Supabase updates password and invalidates old token
 * 6. Client receives success response
 * 7. Client redirects to /login
 */

import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client";
import { updatePasswordSchema } from "@/lib/validation/auth.schema";
import { getAuthErrorMessage } from "@/lib/utils/auth-errors";

// Disable prerendering for API routes (dynamic)
export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod schema (includes password confirmation check)
    const validation = updatePasswordSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { newPassword } = validation.data;

    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Update password
    // Note: User must be authenticated via reset token (from email link)
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      // Map Supabase error to user-friendly Polish message
      const userMessage = getAuthErrorMessage(error);

      return new Response(
        JSON.stringify({
          success: false,
          error: userMessage,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Success - password updated
    return new Response(
      JSON.stringify({
        success: true,
        message: "HasBo zostaBo zmienione",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Unexpected server error
    console.error("Update password error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "WystpiB nieoczekiwany bBd. Spr�buj ponownie.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
