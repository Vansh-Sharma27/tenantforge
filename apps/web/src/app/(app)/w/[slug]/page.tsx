"use client";

import type { Role } from "@tenantforge/shared";
import { hasPermission } from "@tenantforge/shared/constants/roles";
import { Users, Settings, CreditCard, ArrowRight, Shield } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card, Badge, Skeleton } from "@/components/ui";
import { useWorkspace } from "@/hooks/useWorkspaces";

export default function WorkspaceDashboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = useWorkspace(slug);

  if (isLoading) {
    return (
      <div>
        <div className="space-y-2 mb-8">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 bg-white p-6 space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const role = data.membership?.role as Role;

  const navItems = [
    {
      href: `/w/${slug}/members`,
      label: "Members",
      description: "Manage your team",
      icon: <Users className="h-5 w-5" strokeWidth={1.5} />,
      stat: data._count?.memberships ?? 0,
      statLabel: "people",
      show: true,
    },
    {
      href: `/w/${slug}/settings`,
      label: "Settings",
      description: "Workspace configuration",
      icon: <Settings className="h-5 w-5" strokeWidth={1.5} />,
      show: hasPermission(role, "workspace:update"),
    },
    {
      href: `/w/${slug}/billing`,
      label: "Billing",
      description: "Plans and subscription",
      icon: <CreditCard className="h-5 w-5" strokeWidth={1.5} />,
      show: hasPermission(role, "billing:read"),
    },
  ].filter((link) => link.show);

  return (
    <div>
      <PageHeader
        title={data.name}
        description={`/${data.slug}`}
        action={<Badge>{data.plan}</Badge>}
      />

      {/* Overview strip */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-8 text-small text-gray-500">
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
          {data._count?.memberships ?? 0} members
        </span>
        <span className="flex items-center gap-1.5">
          <CreditCard className="h-3.5 w-3.5" strokeWidth={1.5} />
          {data.plan} plan
        </span>
        <span className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5" strokeWidth={1.5} />
          {role}
        </span>
      </div>

      {/* Navigation cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card hover>
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-gray-100 text-gray-600 group-hover:bg-accent/10 group-hover:text-accent transition-colors duration-150">
                  {item.icon}
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300" />
              </div>
              <p className="text-small font-medium text-black">{item.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
              {"stat" in item && item.stat !== undefined && (
                <p className="mt-3 text-xs text-gray-400">
                  {item.stat} {item.statLabel}
                </p>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
