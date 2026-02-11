"use client";

import type { Role } from "@tenantforge/shared";
import { hasPermission } from "@tenantforge/shared/constants/roles";
import { Users, Settings, CreditCard, ArrowRight } from "lucide-react";
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

  const quickLinks = [
    {
      href: `/w/${slug}/members`,
      label: "Members",
      description: "Manage your team",
      icon: <Users className="h-5 w-5" strokeWidth={1.5} />,
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Members</p>
          <p className="mt-1 text-display text-black">{data._count?.memberships ?? "—"}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Plan</p>
          <p className="mt-1 text-display text-black">{data.plan}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Your Role</p>
          <p className="mt-1 text-display text-black">{role}</p>
        </Card>
      </div>

      {/* Quick links */}
      <h2 className="text-subtitle text-black mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card hover className="flex items-center gap-4">
              <div className="text-gray-500">{link.icon}</div>
              <div className="flex-1">
                <p className="text-small font-medium text-black">{link.label}</p>
                <p className="text-xs text-gray-500">{link.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
