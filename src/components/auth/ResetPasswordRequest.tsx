/**
 * Reset Password Request Component
 * Form for requesting password reset email using React Hook Form
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordRequestSchema, type ResetPasswordRequestInput } from "@/lib/validation/auth.schema";
import { useResetPasswordRequestMutation } from "@/components/hooks/useResetPasswordMutation";

/**
 * Email sent success message component
 */
function EmailSentMessage({ email, onResend }: { email: string; onResend: () => void }) {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Sprawdź swoją skrzynkę email</h2>
      <p className="text-gray-600">
        Wysłaliśmy link do resetowania hasła na adres <strong>{email}</strong>
      </p>
      <p className="text-sm text-gray-500 mt-4">
        Jeśli email nie dotarł, sprawdź folder spam lub{" "}
        <button onClick={onResend} className="text-primary hover:underline">
          spróbuj ponownie
        </button>
      </p>
    </div>
  );
}

/**
 * Reset Password Request Form
 */
export default function ResetPasswordRequest() {
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ResetPasswordRequestInput>({
    resolver: zodResolver(resetPasswordRequestSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
    },
  });

  const mutation = useResetPasswordRequestMutation();

  const onSubmit = (data: ResetPasswordRequestInput) => {
    mutation.mutate(data.email, {
      onSuccess: () => {
        setSubmittedEmail(data.email);
        setEmailSent(true);
      },
    });
  };

  const handleResend = () => {
    setEmailSent(false);
    reset();
  };

  // Show success message if email was sent
  if (emailSent) {
    return <EmailSentMessage email={submittedEmail} onResend={handleResend} />;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Resetuj hasło</h2>
      <p className="text-gray-600 mb-4">Podaj swój adres email, a wyślemy Ci link do zresetowania hasła.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Email field */}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="twoj@email.pl"
            {...register("email")}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            disabled={isSubmitting || mutation.isPending}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-red-600 mt-1" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Submit button */}
        <Button type="submit" className="w-full" disabled={isSubmitting || mutation.isPending}>
          {mutation.isPending ? "Wysyłam..." : "Wyślij link resetujący"}
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
