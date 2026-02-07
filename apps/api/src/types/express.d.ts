import { Plan, Role } from "@prisma/client";

import { TokenPayload } from "@/utils/jwt";

// Workspace context for multi-tenancy
export interface WorkspaceContext {
  id: string;
  slug: string;
  name: string;
  plan: Plan;
  stripeCustomerId: string | null;
  stripeSubId: string | null;
}

// Membership context for RBAC
export interface MembershipContext {
  id: string;
  role: Role;
  joinedAt: Date;
  userId: string;
  workspaceId: string;
}

// Audit context for request tracking
export interface AuditContext {
  ipAddress: string;
  userAgent: string;
}

// Extend Express Request type to include id, user, workspace, membership, and auditContext
declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: TokenPayload;
      workspace?: WorkspaceContext;
      membership?: MembershipContext;
      auditContext?: AuditContext;
    }
  }
}

export {};
