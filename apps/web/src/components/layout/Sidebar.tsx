"use client";

import type { Role } from "@tenantforge/shared";
import { hasPermission } from "@tenantforge/shared/constants/roles";
import {
  LayoutDashboard,
  Users,
  Settings,
  CreditCard,
  FileText,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

import { Avatar, Badge } from "@/components/ui";
import { useLogout } from "@/hooks/useAuth";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/stores/authStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  permission?: string;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const params = useParams<{ slug?: string }>();
  const { currentWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();
  const logout = useLogout();

  const slug = currentWorkspace?.slug || params.slug;
  const role = currentWorkspace?.membership?.role as Role | undefined;

  const navItems: NavItem[] = [
    {
      href: slug ? `/w/${slug}` : "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" strokeWidth={1.5} />,
    },
    {
      href: slug ? `/w/${slug}/members` : "#",
      label: "Members",
      icon: <Users className="h-5 w-5" strokeWidth={1.5} />,
    },
    {
      href: slug ? `/w/${slug}/settings` : "#",
      label: "Settings",
      icon: <Settings className="h-5 w-5" strokeWidth={1.5} />,
      permission: "workspace:update",
    },
    {
      href: slug ? `/w/${slug}/billing` : "#",
      label: "Billing",
      icon: <CreditCard className="h-5 w-5" strokeWidth={1.5} />,
      permission: "billing:read",
    },
    {
      href: slug ? `/w/${slug}/audit` : "#",
      label: "Audit Log",
      icon: <FileText className="h-5 w-5" strokeWidth={1.5} />,
      permission: "audit:read",
    },
  ];

  const visibleItems = navItems.filter((item) => {
    if (!item.permission || !role) return true;
    return hasPermission(role, item.permission as Parameters<typeof hasPermission>[1]);
  });

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-gray-100 border-r border-gray-200 flex flex-col transition-all duration-200 z-40",
        collapsed ? "w-sidebar-collapsed" : "w-sidebar"
      )}
    >
      {/* Workspace header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-200">
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-small font-semibold text-black truncate">
              {currentWorkspace?.name || "TenantForge"}
            </p>
            {currentWorkspace?.plan && <Badge className="mt-1">{currentWorkspace.plan}</Badge>}
          </div>
        )}
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-gray-600 cursor-pointer transition-default flex-shrink-0"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== `/w/${slug}` &&
              item.href !== "#" &&
              item.href !== "/dashboard" &&
              pathname.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-small transition-default",
                isActive
                  ? "bg-white text-black font-medium"
                  : "text-gray-600 hover:text-black hover:bg-gray-50",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-200 px-3 py-4">
        <div className="flex items-center gap-3">
          <Avatar name={user?.name || user?.email || null} size="sm" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-small font-medium text-gray-900 truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          )}
          <button
            onClick={logout}
            className="text-gray-400 hover:text-red-500 cursor-pointer transition-default flex-shrink-0"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
