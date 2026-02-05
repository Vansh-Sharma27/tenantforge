import { Role } from "@prisma/client";
import { z } from "zod";

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
 * Role validation for invitations
 * Note: Cannot invite as OWNER - only ADMIN, MEMBER, or VIEWER
 */
const invitationRoleSchema = z.enum([Role.ADMIN, Role.MEMBER, Role.VIEWER], {
  errorMap: () => ({ message: "Role must be ADMIN, MEMBER, or VIEWER" }),
});

/**
 * Send invitation request schema
 */
export const sendInvitationSchema = z.object({
  email: emailSchema,
  role: invitationRoleSchema,
});

export type SendInvitationInput = z.infer<typeof sendInvitationSchema>;

/**
 * Accept invitation request schema
 */
export const acceptInvitationSchema = z.object({
  token: z.string().min(1, "Invitation token is required"),
});

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;

/**
 * Resend invitation request schema
 */
export const resendInvitationSchema = z.object({
  invitationId: z.string().cuid("Invalid invitation ID"),
});

export type ResendInvitationInput = z.infer<typeof resendInvitationSchema>;

/**
 * Revoke invitation request schema
 */
export const revokeInvitationSchema = z.object({
  invitationId: z.string().cuid("Invalid invitation ID"),
});

export type RevokeInvitationInput = z.infer<typeof revokeInvitationSchema>;
