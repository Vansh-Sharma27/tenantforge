"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Skeleton } from "@/components/ui";
import { useWorkspace } from "@/hooks/useWorkspaces";
import { useWorkspaceStore } from "@/stores/workspaceStore";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { data, isLoading, isError } = useWorkspace(slug);
  const { setCurrentWorkspace } = useWorkspaceStore();

  useEffect(() => {
    if (data) {
      setCurrentWorkspace(data);
    }
    return () => {
      setCurrentWorkspace(null);
    };
  }, [data, setCurrentWorkspace]);

  // Workspace not found (soft-deleted or invalid slug) — redirect to dashboard
  useEffect(() => {
    if (!isLoading && !data && isError) {
      router.replace("/dashboard");
    }
  }, [isLoading, data, isError, router]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!data) return null; // will be caught by redirect effect

  return <>{children}</>;
}
