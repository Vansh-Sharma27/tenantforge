import { Role } from "@prisma/client";
import { z } from "zod";

/**
 * Password validation for ownership transfer
 */
const passwordSchema = z.string().min(1, "Password is required for ownership transfer");

/**
 * Role validation for member updates
 * Note: Cannot assign OWNER role through this endpoint
 */
const memberRoleSchema = z.enum([Role.ADMIN, Role.MEMBER, Role.VIEWER], {
  errorMap: () => ({ message: "Role must be ADMIN, MEMBER, or VIEWER" }),
});

/**
 * Update member role request schema
 */
export const updateMemberRoleSchema = z.object({
  role: memberRoleSchema,
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

/**
 * Remove member request schema (uses route parameter, no body needed)
 */
export const removeMemberSchema = z.object({
  memberId: z.string().cuid("Invalid member ID"),
});

export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;

/**
 * Transfer ownership request schema
 * Requires password confirmation for security
 */
export const transferOwnershipSchema = z.object({
  targetUserId: z.string().cuid("Invalid user ID"),
  password: passwordSchema,
});

export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>;

/**
 * List members query parameters schema
 */
export const listMembersQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1, "Page must be at least 1")),
  limit: z
    .string()
    .optional()
    .default("50")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100")),
  search: z.string().max(100).optional(),
  role: z.enum([Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER]).optional(),
});

export type ListMembersQuery = z.infer<typeof listMembersQuerySchema>;
