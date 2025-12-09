/**
 * Auth Error Mapping Utility
 *
 * Maps Supabase auth errors to user-friendly Polish messages
 * Based on spec 31_1_auth-spec.md section 2.3.2 and 3.5
 */

/**
 * Map Supabase auth errors to user-friendly Polish messages
 *
 * @param error - Error object from Supabase Auth
 * @returns User-friendly error message in Polish
 */
export function getAuthErrorMessage(error: unknown): string {
  // Extract error code or message
  const errorCode = error?.code || error?.message || "";
  const errorMessage = typeof errorCode === "string" ? errorCode.toLowerCase() : "";

  // Error mapping based on spec 2.3.2 - Extended version
  const errorMap: Record<string, string> = {
    // Authentication errors
    invalid_credentials: "Nieprawidłowy email lub hasło",
    "invalid login credentials": "Nieprawidłowy email lub hasło",
    "email not confirmed": "Email nie został potwierdzony. Sprawdź skrzynkę pocztową.",
    email_not_confirmed: "Email nie został potwierdzony. Sprawdź skrzynkę pocztową.",

    // Registration errors
    email_exists: "Konto z tym adresem email już istnieje",
    "user already registered": "Konto z tym adresem email już istnieje",
    weak_password: "Hasło jest zbyt słabe",
    "password is too weak": "Hasło jest zbyt słabe",

    // Validation errors
    invalid_email: "Nieprawidłowy adres email",
    "invalid email": "Nieprawidłowy adres email",

    // User not found
    user_not_found: "Nie znaleziono użytkownika o tym adresie email",
    "user not found": "Nie znaleziono użytkownika o tym adresie email",

    // Rate limiting
    over_email_send_rate_limit: "Zbyt wiele prób. Spróbuj ponownie za chwilę.",
    "email rate limit exceeded": "Zbyt wiele prób. Spróbuj ponownie za chwilę.",
    too_many_requests: "Zbyt wiele prób. Spróbuj ponownie za chwilę.",

    // Token/session errors
    "invalid refresh token": "Sesja wygasła. Zaloguj się ponownie.",
    "refresh token not found": "Sesja wygasła. Zaloguj się ponownie.",
    token_expired: "Sesja wygasła. Zaloguj się ponownie.",

    // Password reset errors
    "invalid reset token": "Link resetujący wygasł. Poproś o nowy.",
    "reset token expired": "Link resetujący wygasł. Poproś o nowy.",

    // Network/connection errors
    "fetch failed": "Brak połączenia. Sprawdź internet i spróbuj ponownie.",
    "network error": "Brak połączenia. Sprawdź internet i spróbuj ponownie.",
    "failed to fetch": "Brak połączenia. Sprawdź internet i spróbuj ponownie.",

    // Signup confirmation
    "signup requires email confirmation": "Sprawdź swoją skrzynkę email i potwierdź adres.",
  };

  // Check if we have a mapped message
  for (const [code, message] of Object.entries(errorMap)) {
    if (errorMessage.includes(code)) {
      return message;
    }
  }

  // Check if error object has a user-friendly message
  if (error?.message && typeof error.message === "string") {
    // Return original message if it looks user-friendly (not a code)
    if (!error.message.includes("_") && error.message.length > 10) {
      return error.message;
    }
  }

  // Default fallback
  return "Coś poszło nie tak. Spróbuj ponownie za chwilę.";
}

/**
 * Check if error is a network/connection error
 */
export function isNetworkError(error: unknown): boolean {
  const errorMessage =
    (typeof error?.message === "string" ? error.message : "").toLowerCase() ||
    (typeof error?.code === "string" ? error.code : "").toLowerCase();

  return (
    errorMessage.includes("fetch") ||
    errorMessage.includes("network") ||
    errorMessage.includes("connection") ||
    error instanceof TypeError
  );
}

/**
 * Check if error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  const errorMessage =
    (typeof error?.message === "string" ? error.message : "").toLowerCase() ||
    (typeof error?.code === "string" ? error.code : "").toLowerCase();

  return errorMessage.includes("rate limit") || errorMessage.includes("too many") || error?.status === 429;
}

/**
 * Check if error is a session expired error
 */
export function isSessionExpiredError(error: unknown): boolean {
  const errorMessage =
    (typeof error?.message === "string" ? error.message : "").toLowerCase() ||
    (typeof error?.code === "string" ? error.code : "").toLowerCase();

  return (
    errorMessage.includes("token expired") ||
    errorMessage.includes("session expired") ||
    errorMessage.includes("invalid refresh token") ||
    errorMessage.includes("refresh token not found")
  );
}
