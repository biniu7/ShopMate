/**
 * API functions for authentication
 * Handles password reset and update operations
 */

/**
 * Request password reset email
 *
 * @param email - User email address
 * @returns Success response with message
 * @throws Error if request fails
 */
export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to send reset email" }));
    throw new Error(errorData.error || "Failed to send reset email");
  }

  return response.json();
}

/**
 * Update user password
 *
 * @param newPassword - New password
 * @param confirmPassword - Password confirmation
 * @returns Success response with message
 * @throws Error if request fails
 */
export async function updatePassword(
  newPassword: string,
  confirmPassword: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch("/api/auth/update-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ newPassword, confirmPassword }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to update password" }));
    throw new Error(errorData.error || "Failed to update password");
  }

  return response.json();
}
