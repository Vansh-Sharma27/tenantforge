import type { Role } from "../types";

// Role hierarchy (higher index = more permissions)
export const ROLE_HIERARCHY: Record<Role, number> = {
  VIEWER: 0,
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};

// Permission matrix
export const PERMISSIONS = {
  // Workspace permissions
  "workspace:read": ["VIEWER", "MEMBER", "ADMIN", "OWNER"] as Role[],
  "workspace:update": ["ADMIN", "OWNER"] as Role[],
  "workspace:delete": ["OWNER"] as Role[],

  // Member permissions
  "member:read": ["VIEWER", "MEMBER", "ADMIN", "OWNER"] as Role[],
  "member:invite": ["ADMIN", "OWNER"] as Role[],
  "member:update": ["ADMIN", "OWNER"] as Role[],
  "member:remove": ["ADMIN", "OWNER"] as Role[],

  // Billing permissions
  "billing:read": ["ADMIN", "OWNER"] as Role[],
  "billing:manage": ["OWNER"] as Role[],

  // Audit permissions
  "audit:read": ["ADMIN", "OWNER"] as Role[],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles.includes(role);
}

/**
 * Check if roleA is higher or equal to roleB in the hierarchy
 */
export function isRoleHigherOrEqual(roleA: Role, roleB: Role): boolean {
  return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB];
}

/**
 * Check if roleA is strictly higher than roleB
 */
export function isRoleHigher(roleA: Role, roleB: Role): boolean {
  return ROLE_HIERARCHY[roleA] > ROLE_HIERARCHY[roleB];
}
