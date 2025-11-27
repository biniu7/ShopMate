/**
 * Map Supabase auth errors to user-friendly Polish messages
 */
export function getAuthErrorMessage(error: any): string {
  const errorCode = error?.code || error?.message || "";

  const errorMap: Record<string, string> = {
    invalid_credentials: "Nieprawidłowy email lub hasło",
    email_exists: "Konto z tym adresem email już istnieje",
    weak_password: "Hasło jest zbyt słabe",
    invalid_email: "Nieprawidłowy adres email",
    user_not_found: "Nie znaleziono użytkownika o tym adresie email",
    email_not_confirmed: "Email nie został potwierdzony. Sprawdź skrzynkę pocztową.",
    over_email_send_rate_limit: "Zbyt wiele prób. Spróbuj ponownie za chwilę.",
  };

  // Check if we have a mapped message
  for (const [code, message] of Object.entries(errorMap)) {
    if (errorCode.includes(code)) {
      return message;
    }
  }

  // Default fallback
  return "Coś poszło nie tak. Spróbuj ponownie za chwilę.";
}
