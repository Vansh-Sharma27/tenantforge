import { z } from "zod";

/**
 * Workspace name validation
 */
const workspaceNameSchema = z
  .string()
  .min(2, "Workspace name must be at least 2 characters")
  .max(100, "Workspace name must be less than 100 characters")
  .trim();

/**
 * Workspace slug validation
 * Rules:
 * - Lowercase letters and numbers only
 * - Can include hyphens (but not at start/end)
 * - Minimum 2 characters, maximum 50
 * - Pattern: /^[a-z0-9]+(-[a-z0-9]+)*$/
 */
const workspaceSlugSchema = z
  .string()
  .min(2, "Workspace slug must be at least 2 characters")
  .max(50, "Workspace slug must be less than 50 characters")
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Workspace slug must contain only lowercase letters, numbers, and hyphens (no consecutive hyphens)"
  )
  .trim();

/**
 * Workspace settings validation
 * Limits keys to 20 and values to strings/numbers/booleans for safety
 */
const workspaceSettingsSchema = z
  .record(z.union([z.string().max(1000), z.number(), z.boolean(), z.null()]))
  .refine((obj) => Object.keys(obj).length <= 20, {
    message: "Settings cannot have more than 20 keys",
  })
  .optional();

/**
 * Create workspace request schema
 */
export const createWorkspaceSchema = z.object({
  name: workspaceNameSchema,
  slug: workspaceSlugSchema.optional(),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

/**
 * Update workspace request schema
 */
export const updateWorkspaceSchema = z.object({
  name: workspaceNameSchema.optional(),
  settings: workspaceSettingsSchema,
});

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;

/**
 * Delete workspace request schema
 * Requires password confirmation for safety
 */
export const deleteWorkspaceSchema = z.object({
  password: z.string().min(1, "Password is required to delete workspace"),
});

export type DeleteWorkspaceInput = z.infer<typeof deleteWorkspaceSchema>;
