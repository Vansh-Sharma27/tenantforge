import { Plan, Role } from "@prisma/client";

/**
 * Full workspace response with all details
 */
export interface WorkspaceResponse {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  settings: Record<string, unknown>;
  memberCount?: number;
  userRole?: Role;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Compact workspace item for lists
 */
export interface WorkspaceListItem {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  userRole: Role;
}

/**
 * Workspace member with user details
 */
export interface WorkspaceMember {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatarUrl?: string;
  role: Role;
  joinedAt: Date;
}

/**
 * Role hierarchy for RBAC permission checks
 * Higher number = more permissions
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};
