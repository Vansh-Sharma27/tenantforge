import type { Plan } from "../types";

export interface PlanLimits {
  maxMembers: number;
  maxApiRequestsPerDay: number;
  maxStorageMB: number;
  features: string[];
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    maxMembers: 3,
    maxApiRequestsPerDay: 1000,
    maxStorageMB: 100,
    features: ["basic_workspace", "email_support"],
  },
  PRO: {
    maxMembers: 10,
    maxApiRequestsPerDay: 50000,
    maxStorageMB: 5120, // 5 GB
    features: [
      "basic_workspace",
      "email_support",
      "priority_support",
      "api_access",
      "audit_logs",
      "custom_branding",
    ],
  },
  ENTERPRISE: {
    maxMembers: -1, // Unlimited
    maxApiRequestsPerDay: -1, // Unlimited (fair use)
    maxStorageMB: 51200, // 50 GB
    features: [
      "basic_workspace",
      "email_support",
      "priority_support",
      "api_access",
      "audit_logs",
      "custom_branding",
      "sso",
      "dedicated_support",
      "sla",
    ],
  },
};

export const PLAN_PRICES = {
  FREE: { monthly: 0, yearly: 0 },
  PRO: { monthly: 29, yearly: 290 },
  ENTERPRISE: { monthly: 99, yearly: 990 },
} as const;

/**
 * Check if a plan has a specific feature
 */
export function hasFeature(plan: Plan, feature: string): boolean {
  return PLAN_LIMITS[plan].features.includes(feature);
}

/**
 * Check if usage is within plan limits
 */
export function isWithinLimit(
  plan: Plan,
  limitType: keyof Omit<PlanLimits, "features">,
  currentUsage: number
): boolean {
  const limit = PLAN_LIMITS[plan][limitType];
  return limit === -1 || currentUsage < limit;
}
