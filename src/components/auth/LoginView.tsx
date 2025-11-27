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

    // Validation
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
      // TODO: Implement Supabase Auth call when backend is ready
      // For now, just show a placeholder message
      toast.info("Funkcja logowania zostanie wkrótce zaimplementowana");
      console.log("Login data:", validation.data);
      console.log("Redirect URL:", redirectUrl);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Wystąpił błąd podczas logowania");
    } finally {
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
