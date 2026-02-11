"use client";

import { useState } from "react";

import { AuthGuard } from "@/components/guards/AuthGuard";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/cn";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        </div>

        {/* Mobile sidebar */}
        <MobileSidebar />

        {/* Main content */}
        <main
          className={cn(
            "transition-all duration-200 min-h-screen",
            "pt-16 lg:pt-0",
            collapsed ? "lg:ml-sidebar-collapsed" : "lg:ml-sidebar"
          )}
        >
          <div className="max-w-content mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}
