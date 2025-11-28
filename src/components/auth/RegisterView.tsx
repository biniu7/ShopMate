import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema } from "@/lib/validation/auth.schema";
import { toast } from "sonner";

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterView() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const validation = registerSchema.safeParse(formData);
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
      // Call server-side register API endpoint
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: validation.data.email,
          password: validation.data.password,
          confirmPassword: validation.data.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Server returned error
        const errorMessage = data.error || "Nie udało się utworzyć konta. Spróbuj ponownie.";
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      // Success - show confirmation message about email
      if (data.requiresEmailConfirmation) {
        setEmailSent(true);
        toast.success(data.message);
      } else {
        // Fallback if email confirmation is disabled
        toast.success("Konto utworzone pomyślnie!");
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.error("Register error:", error);
      toast.error("Brak połączenia. Sprawdź internet i spróbuj ponownie.");
      setIsLoading(false);
    }
  };

  // Show success message after registration
  if (emailSent) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Sprawdź swoją skrzynkę email</h2>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800 mb-2">
            <strong>Konto zostało utworzone!</strong>
          </p>
          <p className="text-green-700 text-sm">
            Na adres <strong>{formData.email}</strong> wysłaliśmy link aktywacyjny.
            Kliknij w link, aby potwierdzić swoje konto i móc się zalogować.
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Nie widzisz wiadomości? Sprawdź folder spam lub poczekaj kilka minut.
          </p>
          <p className="text-center mt-4">
            <a href="/login" className="text-primary hover:underline">
              Wróć do logowania
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Utwórz konto</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email field */}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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

        {/* Password field */}
        <div>
          <Label htmlFor="password">Hasło</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            aria-describedby={errors.password ? "password-error" : undefined}
            aria-invalid={!!errors.password}
            disabled={isLoading}
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-red-600 mt-1">
              {errors.password}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Min. 8 znaków, 1 wielka litera, 1 cyfra
          </p>
        </div>

        {/* Confirm password field */}
        <div>
          <Label htmlFor="confirmPassword">Powtórz hasło</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
          {isLoading ? "Tworzę konto..." : "Zarejestruj się"}
        </Button>
      </form>

      {/* Link to login */}
      <p className="text-center text-sm text-gray-600 mt-4">
        Masz już konto?{" "}
        <a href="/login" className="text-primary hover:underline">
          Zaloguj się
        </a>
      </p>
    </div>
  );
}
