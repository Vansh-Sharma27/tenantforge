export interface AuditEvent {
  workspaceId?: string;
  actorId?: string;
  actorType: "user" | "system" | "webhook";
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export const AuditActions = {
  // Auth
  USER_REGISTERED: "user.registered",
  USER_LOGIN: "user.login",
  USER_LOGOUT: "user.logout",
  USER_LOGIN_FAILED: "user.login_failed",

  // Workspace
  WORKSPACE_CREATED: "workspace.created",
  WORKSPACE_UPDATED: "workspace.updated",
  WORKSPACE_DELETED: "workspace.deleted",

  // Team
  MEMBER_INVITED: "member.invited",
  MEMBER_JOINED: "member.joined",
  MEMBER_ROLE_CHANGED: "member.role_changed",
  MEMBER_REMOVED: "member.removed",
  OWNERSHIP_TRANSFERRED: "ownership.transferred",

  // Billing
  SUBSCRIPTION_CREATED: "subscription.created",
  SUBSCRIPTION_UPDATED: "subscription.updated",
  SUBSCRIPTION_CANCELLED: "subscription.cancelled",
  PAYMENT_FAILED: "payment.failed",

  // Security
  RATE_LIMIT_EXCEEDED: "rate_limit.exceeded",
} as const;
