import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient as SupabaseClientType } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";

import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Browser client (for React components if needed)
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export type for use in services
export type SupabaseClient = SupabaseClientType<Database>;

/**
 * Cookie options for Supabase SSR
 * httpOnly: cookies not accessible via JavaScript (XSS protection)
 * secure: only sent over HTTPS (production)
 * sameSite: CSRF protection
 */
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

/**
 * Parse cookie header string into array of {name, value} objects
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

/**
 * Create Supabase server instance for SSR
 * Use in: middleware, API endpoints, Astro pages
 *
 * IMPORTANT: Uses getAll/setAll for cookie management (required by @supabase/ssr)
 */
export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};
