import { z } from "zod";

/**
 * Base email schema (used in all auth forms)
 */
const emailSchema = z.string().trim().toLowerCase().email("Nieprawidłowy format adresu email");

/**
 * Base password schema
 * Requirements: 8-100 chars, min 1 uppercase, min 1 digit
 */
const passwordSchema = z
  .string()
  .min(8, "Hasło musi mieć minimum 8 znaków")
  .max(100, "Hasło może mieć maksimum 100 znaków")
  .regex(/[A-Z]/, "Hasło musi zawierać minimum 1 wielką literę")
  .regex(/[0-9]/, "Hasło musi zawierać minimum 1 cyfrę");

/**
 * Register schema with password confirmation
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Login schema (simpler - no password complexity check)
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Hasło jest wymagane"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Reset password request schema
 */
export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
});

export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>;

/**
 * Update password schema (after reset link)
 */
export const updatePasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
