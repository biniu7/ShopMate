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
      // TODO: Implement Supabase Auth call when backend is ready
      // For now, just show a placeholder message
      toast.info("Funkcja rejestracji zostanie wkrótce zaimplementowana");
      console.log("Register data:", validation.data);
    } catch (error) {
      console.error("Register error:", error);
      toast.error("Wystąpił błąd podczas rejestracji");
    } finally {
      setIsLoading(false);
    }
  };

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
