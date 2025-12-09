/**
 * Reset Password Request API Endpoint
 *
 * Server-side endpoint for requesting password reset email
 * Based on spec 31_1_auth-spec.md section 4.5 (US-003)
 *
 * Flow:
 * 1. Client sends email address
 * 2. Server validates with Zod schema
 * 3. Server calls Supabase Auth resetPasswordForEmail
 * 4. Supabase sends email with reset link (valid 24h as per spec)
 * 5. Client receives success response (always, even if email doesn't exist - security)
 */

import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client";
import { resetPasswordRequestSchema } from "@/lib/validation/auth.schema";
import { getAuthErrorMessage } from "@/lib/utils/auth-errors";

// Disable prerendering for API routes (dynamic)
export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod schema
    const validation = resetPasswordRequestSchema.safeParse(body);
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

    const { email } = validation.data;

    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Request password reset email
    // Note: Supabase will NOT error if email doesn't exist (security feature)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/reset-password`,
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

    // Success - email sent (or silently ignored if email doesn't exist)
    // IMPORTANT: Always return success for security (don't reveal if email exists)
    return new Response(
      JSON.stringify({
        success: true,
        message: "Link do resetowania hasBa zostaB wysBany na email",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Unexpected server error
    console.error("Reset password request error:", error);

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
