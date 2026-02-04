import { z } from "zod";

/**
 * Password validation requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character (!@#$%^&*()_+-)
 */
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[!@#$%^&*()_+-]/, "Password must contain at least one special character (!@#$%^&*()_+-)");

/**
 * Email validation
 */
const emailSchema = z
  .string()
  .email("Invalid email format")
  .max(255, "Email must be less than 255 characters")
  .toLowerCase()
  .trim();

/**
 * Name validation
 */
const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be less than 100 characters")
  .trim();

/**
 * Registration request schema
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Login request schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Email verification schema
 */
export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

/**
 * Token refresh schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

/**
 * Forgot password schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset password schema
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
