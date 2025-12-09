/**
 * Login API Endpoint
 *
 * Server-side authentication endpoint for user login
 * Based on spec 31_1_auth-spec.md section 4.3 and answer 2.B (server-side auth)
 *
 * Flow:
 * 1. Client sends email + password
 * 2. Server validates with Zod schema
 * 3. Server calls Supabase Auth signInWithPassword
 * 4. Server sets httpOnly cookies (automatic via @supabase/ssr)
 * 5. Client receives success response
 * 6. Client redirects to redirectUrl (answer 3.C - hybrid redirect)
 */

import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client";
import { loginSchema } from "@/lib/validation/auth.schema";
import { getAuthErrorMessage } from "@/lib/utils/auth-errors";

// Disable prerendering for API routes (dynamic)
export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod schema
    const validation = loginSchema.safeParse(body);
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

    const { email, password } = validation.data;

    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Attempt login via Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
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
          status: 401, // Unauthorized
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Success - cookies are automatically set by Supabase SSR
    // Session persistence enabled (answer 3: u|ytkownik pozostaje zalogowany po zamkniciu przegldarki)
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Unexpected server error
    console.error("Login error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "WystpiB nieoczekiwany bBd. Spróbuj ponownie.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};