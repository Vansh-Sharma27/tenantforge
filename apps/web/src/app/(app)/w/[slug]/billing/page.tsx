"use client";

import type { Plan, Role } from "@tenantforge/shared";
import { PLAN_LIMITS, PLAN_PRICES } from "@tenantforge/shared/constants/plans";
import { hasPermission } from "@tenantforge/shared/constants/roles";
import { Check, Info, ArrowRight, Code2 } from "lucide-react";
import { useParams } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card, Badge, Button, Skeleton } from "@/components/ui";
import { useBillingInfo, useCreateCheckout, useCreatePortal } from "@/hooks/useBilling";
import { cn } from "@/lib/cn";
import { useWorkspaceStore } from "@/stores/workspaceStore";

const PLAN_ORDER: Plan[] = ["FREE", "PRO", "ENTERPRISE"];

const PLAN_DESCRIPTIONS: Record<Plan, string> = {
  FREE: "For getting started",
  PRO: "For growing teams",
  ENTERPRISE: "For large organizations",
};

const LIMIT_LABELS: {
  key: keyof typeof PLAN_LIMITS.FREE;
  label: string;
  format: (v: number) => string;
}[] = [
  { key: "maxMembers", label: "Members", format: (v) => (v === -1 ? "Unlimited" : `Up to ${v}`) },
  {
    key: "maxApiRequestsPerDay",
    label: "API requests/day",
    format: (v) => (v === -1 ? "Unlimited" : v.toLocaleString()),
  },
  {
    key: "maxStorageMB",
    label: "Storage",
    format: (v) => (v >= 1024 ? `${v / 1024} GB` : `${v} MB`),
  },
];

const FEATURE_LABELS: Record<string, string> = {
  basic_workspace: "Workspace",
  email_support: "Email Support",
  priority_support: "Priority Support",
  api_access: "API Access",
  audit_logs: "Audit Logs",
  custom_branding: "Custom Branding",
  sso: "SSO",
  dedicated_support: "Dedicated Support",
  sla: "SLA",
};

export default function BillingPage() {
  const { slug } = useParams<{ slug: string }>();
  const { currentWorkspace } = useWorkspaceStore();
  const role = currentWorkspace?.membership?.role as Role;
  const canManageBilling = role ? hasPermission(role, "billing:manage") : false;

  const { data: billing, isLoading } = useBillingInfo(slug);
  const checkout = useCreateCheckout(slug);
  const portal = useCreatePortal(slug);

  const currentPlan = currentWorkspace?.plan || "FREE";

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Billing" />
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Subscription and plan management"
        action={
          canManageBilling && currentPlan !== "FREE" ? (
            <Button variant="secondary" onClick={() => portal.mutate()} loading={portal.isPending}>
              Manage Subscription
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : undefined
        }
      />

      {/* Demo Banner */}
      <div className="mb-6 flex items-start gap-3 border border-emerald-200 bg-emerald-50 px-4 py-3">
        <Code2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
        <div>
          <p className="text-small font-medium text-emerald-900">Boilerplate Demo</p>
          <p className="text-xs text-emerald-700 mt-0.5">
            These are example plans showcasing Stripe integration. Replace the plan names, pricing,
            and features in{" "}
            <code className="bg-emerald-100 px-1 py-0.5 text-[11px]">
              packages/shared/src/constants/plans.ts
            </code>{" "}
            with your own.
          </p>
        </div>
      </div>

      {/* Current Plan Summary */}
      <Card className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Current Plan</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-title text-black">{currentPlan}</p>
              <Badge variant={currentPlan === "FREE" ? "default" : "accent"}>
                {billing?.subscription?.status || "Active"}
              </Badge>
            </div>
            <p className="mt-1 text-small text-gray-500">
              ${PLAN_PRICES[currentPlan as Plan].monthly}/month
            </p>
          </div>
          {billing?.subscription?.cancelAtPeriodEnd && (
            <div className="flex items-center gap-2 text-xs text-amber-600">
              <Info className="h-3.5 w-3.5" strokeWidth={1.5} />
              Cancels at period end
            </div>
          )}
        </div>
      </Card>

      {/* Plan Comparison */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-subtitle text-black">Example Plans</h2>
        <Badge>Customizable</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLAN_ORDER.map((plan) => {
          const limits = PLAN_LIMITS[plan];
          const price = PLAN_PRICES[plan];
          const isCurrent = plan === currentPlan;

          return (
            <Card key={plan} className={cn("flex flex-col", isCurrent && "border-accent")}>
              {/* Plan Header */}
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-subtitle text-black">{plan}</h3>
                  {isCurrent && <Badge variant="accent">Current</Badge>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{PLAN_DESCRIPTIONS[plan]}</p>
                <p className="mt-3">
                  <span className="text-display text-black">${price.monthly}</span>
                  <span className="text-small text-gray-500">/mo</span>
                </p>
              </div>

              {/* Limits */}
              <div className="flex-1 space-y-3 mb-6">
                {LIMIT_LABELS.map(({ key, label, format }) => (
                  <div key={key} className="flex items-center justify-between text-small">
                    <span className="text-gray-500">{label}</span>
                    <span className="text-black font-medium">{format(limits[key] as number)}</span>
                  </div>
                ))}

                <div className="border-t border-gray-100 pt-3 space-y-1.5">
                  {limits.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-accent flex-shrink-0" strokeWidth={1.5} />
                      <span className="text-xs text-gray-600">
                        {FEATURE_LABELS[feature] || feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action */}
              {canManageBilling && !isCurrent && plan !== "FREE" && (
                <Button
                  className="w-full"
                  variant={plan === "ENTERPRISE" ? "secondary" : "primary"}
                  onClick={() => checkout.mutate(plan)}
                  loading={checkout.isPending}
                >
                  {PLAN_ORDER.indexOf(plan) > PLAN_ORDER.indexOf(currentPlan as Plan)
                    ? "Upgrade"
                    : "Change Plan"}
                </Button>
              )}
              {isCurrent && (
                <Button variant="secondary" disabled className="w-full">
                  Current Plan
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
