import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordRequestSchema, updatePasswordSchema } from "@/lib/validation/auth.schema";
import { toast } from "sonner";

interface ResetPasswordViewProps {
  isResetCallback: boolean;
}

export default function ResetPasswordView({ isResetCallback }: ResetPasswordViewProps) {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Tryb 1: Request password reset
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = resetPasswordRequestSchema.safeParse({ email });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as string] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement Supabase Auth call when backend is ready
      // For now, just show a placeholder message
      toast.info("Funkcja resetu hasła zostanie wkrótce zaimplementowana");
      console.log("Reset password for:", validation.data.email);
      setEmailSent(true);
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Nie udało się wysłać emaila. Sprawdź adres email.");
    } finally {
      setIsLoading(false);
    }
  };

  // Tryb 2: Update password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = updatePasswordSchema.safeParse({ newPassword, confirmPassword });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as string] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement Supabase Auth call when backend is ready
      // For now, just show a placeholder message
      toast.info("Funkcja zmiany hasła zostanie wkrótce zaimplementowana");
      console.log("Update password");
    } catch (error) {
      console.error("Update password error:", error);
      toast.error("Nie udało się zmienić hasła");
    } finally {
      setIsLoading(false);
    }
  };

  // Render based on mode
  if (isResetCallback) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Ustaw nowe hasło</h2>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          {/* New password field */}
          <div>
            <Label htmlFor="newPassword">Nowe hasło</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              aria-describedby={errors.newPassword ? "new-password-error" : undefined}
              aria-invalid={!!errors.newPassword}
              disabled={isLoading}
            />
            {errors.newPassword && (
              <p id="new-password-error" className="text-sm text-red-600 mt-1">
                {errors.newPassword}
              </p>
            )}
          </div>

          {/* Confirm password field */}
          <div>
            <Label htmlFor="confirmPassword">Powtórz nowe hasło</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
              aria-invalid={!!errors.confirmPassword}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p id="confirm-password-error" className="text-sm text-red-600 mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Zmieniam hasło..." : "Zmień hasło"}
          </Button>
        </form>
      </div>
    );
  }

  if (emailSent) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Sprawdź swoją skrzynkę email</h2>
        <p className="text-gray-600">
          Wysłaliśmy link do resetowania hasła na adres <strong>{email}</strong>
        </p>
        <p className="text-sm text-gray-500 mt-4">
          Jeśli email nie dotarł, sprawdź folder spam lub{" "}
          <button onClick={() => setEmailSent(false)} className="text-primary hover:underline">
            spróbuj ponownie
          </button>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Resetuj hasło</h2>
      <p className="text-gray-600 mb-4">Podaj swój adres email, a wyślemy Ci link do zresetowania hasła.</p>
      <form onSubmit={handleRequestReset} className="space-y-4">
        {/* Email field */}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="twoj@email.pl"
            aria-describedby={errors.email ? "email-error" : undefined}
            aria-invalid={!!errors.email}
            disabled={isLoading}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-red-600 mt-1">
              {errors.email}
            </p>
          )}
        </div>

        {/* Submit button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Wysyłam..." : "Wyślij link resetujący"}
        </Button>
      </form>

      {/* Link back to login */}
      <p className="text-center text-sm text-gray-600 mt-4">
        Pamiętasz hasło?{" "}
        <a href="/login" className="text-primary hover:underline">
          Zaloguj się
        </a>
      </p>
    </div>
  );
}
