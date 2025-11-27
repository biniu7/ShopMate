import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema } from "@/lib/validation/auth.schema";
import { toast } from "sonner";

interface LoginViewProps {
  redirectUrl?: string;
}

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginView({ redirectUrl = "/dashboard" }: LoginViewProps) {
  const [formData, setFormData] = useState<LoginFormData>({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const validation = loginSchema.safeParse(formData);
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
      // Call server-side login API endpoint (answer 2.B - server-side auth)
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: validation.data.email,
          password: validation.data.password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Server returned error
        const errorMessage = data.error || "Nieprawidłowy email lub hasło";
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      // Success - cookies are set by server
      // Hybrid redirect (answer 3.C): API returns success, client does redirect
      toast.success("Zostałeś pomyślnie zalogowany");

      // Redirect to original URL or dashboard
      window.location.href = redirectUrl;
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Brak połączenia. Sprawdź internet i spróbuj ponownie.");
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Zaloguj się</h2>

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
        </div>

        {/* Submit button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Logowanie..." : "Zaloguj się"}
        </Button>
      </form>

      {/* Links */}
      <div className="space-y-2 mt-4">
        <p className="text-center text-sm">
          <a href="/reset-password" className="text-primary hover:underline">
            Nie pamiętam hasła
          </a>
        </p>
        <p className="text-center text-sm text-gray-600">
          Nie masz konta?{" "}
          <a href="/register" className="text-primary hover:underline">
            Zarejestruj się
          </a>
        </p>
      </div>
    </div>
  );
}
