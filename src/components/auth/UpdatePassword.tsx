/**
 * Update Password Component
 * Form for setting new password after reset using React Hook Form
 */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePasswordSchema, type UpdatePasswordInput } from "@/lib/validation/auth.schema";
import { useUpdatePasswordMutation } from "@/components/hooks/useResetPasswordMutation";

/**
 * Update Password Form
 * Allows user to set new password after clicking reset link
 */
export default function UpdatePassword() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    mode: "onChange", // Instant validation for password matching
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const mutation = useUpdatePasswordMutation();

  const onSubmit = (data: UpdatePasswordInput) => {
    mutation.mutate({
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword,
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Ustaw nowe hasło</h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* New password field */}
        <div>
          <Label htmlFor="newPassword">Nowe hasło</Label>
          <Input
            id="newPassword"
            type="password"
            {...register("newPassword")}
            aria-invalid={!!errors.newPassword}
            aria-describedby={errors.newPassword ? "new-password-error" : undefined}
            disabled={isSubmitting || mutation.isPending}
          />
          {errors.newPassword && (
            <p id="new-password-error" className="text-sm text-red-600 mt-1" role="alert">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        {/* Confirm password field */}
        <div>
          <Label htmlFor="confirmPassword">Powtórz nowe hasło</Label>
          <Input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
            disabled={isSubmitting || mutation.isPending}
          />
          {errors.confirmPassword && (
            <p id="confirm-password-error" className="text-sm text-red-600 mt-1" role="alert">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit button */}
        <Button type="submit" className="w-full" disabled={isSubmitting || mutation.isPending}>
          {mutation.isPending ? "Zmieniam hasło..." : "Zmień hasło"}
        </Button>
      </form>
    </div>
  );
}
