/**
 * Register API Endpoint
 *
 * Server-side authentication endpoint for user registration
 * Based on spec 31_1_auth-spec.md section 4.2 (US-001)
 *
 * Flow:
 * 1. Client sends email + password + confirmPassword
 * 2. Server validates with Zod schema (including password match)
 * 3. Server calls Supabase Auth signUp
 * 4. Supabase creates account and automatically logs in user
 * 5. Server sets httpOnly cookies (automatic via @supabase/ssr)
 * 6. Client receives success response
 * 7. Client redirects to /dashboard
 */

import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client";
import { registerSchema } from "@/lib/validation/auth.schema";
import { getAuthErrorMessage } from "@/lib/utils/auth-errors";

// Disable prerendering for API routes (dynamic)
export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod schema (includes password confirmation check)
    const validation = registerSchema.safeParse(body);
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

    // Attempt registration via Supabase Auth
    // Email confirmation is enabled - user will receive confirmation link
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // User will receive email with confirmation link
        // After clicking, they'll be redirected to login page
        emailRedirectTo: `${new URL(request.url).origin}/login`,
      },
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

    // Check if user was created successfully
    if (!data.user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Nie udało się utworzyć konta. Spróbuj ponownie.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Success - user created, but needs to confirm email
    // Note: User is NOT automatically logged in when email confirmation is enabled
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        requiresEmailConfirmation: true,
        message: "Konto utworzone! Sprawdź swoją skrzynkę email i kliknij link potwierdzający, aby aktywować konto.",
      }),
      {
        status: 201, // Created
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Unexpected server error
    console.error("Register error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
