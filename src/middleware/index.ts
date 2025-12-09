import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client";

/**
 * Public paths - accessible without authentication
 * Using whitelist strategy (answer 5.A):
 * - All paths NOT in this list require authentication
 * - Auth API endpoints & Server-Rendered Astro Pages
 */
const PUBLIC_PATHS = [
  // Public pages
  "/",
  "/login",
  "/register",
  "/reset-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/reset-password",
];

/**
 * Check if path is public (no auth required)
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"));
}

/**
 * Authentication Middleware
 *
 * Features (based on spec 31_1_auth-spec.md section 3.1 and answers):
 * - Session check and refresh for all requests
 * - Protected routes redirect to /login with ?redirect parameter
 * - Logged-in users on /login redirect to /dashboard
 * - Session persistence via httpOnly cookies
 */
export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create Supabase server instance with SSR support
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Make supabase available in locals for API endpoints and pages
  locals.supabase = supabase;

  // IMPORTANT: Always get user session first (automatic token refresh)
  // This refreshes the session if refresh token is valid
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Store user in locals if authenticated
  if (user) {
    locals.user = {
      email: user.email || "",
      id: user.id,
    };
  } else {
    locals.user = null;
  }

  const pathname = url.pathname;

  // Handle logged-in users trying to access auth pages (answer 5: redirect to /dashboard)
  if (user && (pathname === "/login" || pathname === "/register")) {
    return redirect("/dashboard");
  }

  // Handle protected routes (non-public paths)
  if (!isPublicPath(pathname)) {
    if (!user) {
      // No session - redirect to login with original URL as redirect parameter
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      return redirect(redirectUrl);
    }
  }

  // Continue to the requested page
  return next();
});
