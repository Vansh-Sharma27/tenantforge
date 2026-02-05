import { Plan, Role } from "@prisma/client";

import { TokenPayload } from "@/utils/jwt";

// Workspace context for multi-tenancy
export interface WorkspaceContext {
  id: string;
  slug: string;
  name: string;
  plan: Plan;
}

// Membership context for RBAC
export interface MembershipContext {
  id: string;
  role: Role;
  joinedAt: Date;
}

// Extend Express Request type to include id, user, workspace, and membership
declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: TokenPayload;
      workspace?: WorkspaceContext;
      membership?: MembershipContext;
    }
  }
}

export {};
