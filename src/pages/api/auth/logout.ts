/**
 * Logout API Endpoint
 *
 * Server-side endpoint for user logout
 * Based on spec 31_1_auth-spec.md section 4.4 (US-004)
 *
 * Flow:
 * 1. Client sends POST request (no body needed)
 * 2. Server calls Supabase Auth signOut
 * 3. Supabase invalidates session and clears cookies
 * 4. Client receives success response
 * 5. Client redirects to /login
 */

import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client";
import { getAuthErrorMessage } from "@/lib/utils/auth-errors";

// Disable prerendering for API routes (dynamic)
export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Sign out user - this will:
    // 1. Invalidate session in Supabase database
    // 2. Clear httpOnly cookies (automatic via @supabase/ssr)
    const { error } = await supabase.auth.signOut();

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

    // Success - user logged out, session cleared
    return new Response(
      JSON.stringify({
        success: true,
        message: "ZostaBe[ wylogowany",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Unexpected server error
    console.error("Logout error:", error);

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
