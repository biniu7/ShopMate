/**
 * Custom hooks for password reset mutations
 * Uses TanStack Query for mutation state management
 */
import { useMutation } from "@tanstack/react-query";
import { requestPasswordReset, updatePassword } from "@/lib/api/auth";
import { toast } from "sonner";

/**
 * Hook for requesting password reset email
 *
 * @returns Mutation object with mutate function and state
 *
 * @example
 * const mutation = useResetPasswordRequestMutation();
 * mutation.mutate("user@example.com");
 */
export function useResetPasswordRequestMutation() {
  return useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
    onSuccess: (data) => {
      toast.success(data.message || "Link resetujący wysłany na email", {
        description: "Sprawdź swoją skrzynkę pocztową",
      });
    },
    onError: (error: Error) => {
      toast.error("Nie udało się wysłać emaila", {
        description: error.message || "Sprawdź adres email i spróbuj ponownie",
      });
    },
  });
}

/**
 * Hook for updating password after reset
 *
 * @returns Mutation object with mutate function and state
 *
 * @example
 * const mutation = useUpdatePasswordMutation();
 * mutation.mutate({ newPassword: "newPass123", confirmPassword: "newPass123" });
 */
export function useUpdatePasswordMutation() {
  return useMutation({
    mutationFn: ({ newPassword, confirmPassword }: { newPassword: string; confirmPassword: string }) =>
      updatePassword(newPassword, confirmPassword),
    onSuccess: (data) => {
      toast.success(data.message || "Hasło zostało zmienione", {
        description: "Przekierowywanie do strony logowania...",
      });

      // Redirect to login after 1.5s
      setTimeout(() => {
        // eslint-disable-next-line react-compiler/react-compiler
        window.location.href = "/login";
      }, 1500);
    },
    onError: (error: Error) => {
      toast.error("Nie udało się zmienić hasła", {
        description: error.message || "Spróbuj ponownie",
      });
    },
  });
}
