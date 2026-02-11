"use client";

import { Plus, Users, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card, Button, Badge, Skeleton } from "@/components/ui";
import { CreateWorkspaceModal } from "@/components/workspace/CreateWorkspaceModal";
import { useWorkspaces } from "@/hooks/useWorkspaces";

export default function DashboardPage() {
  const router = useRouter();
  const { data: workspaces, isLoading } = useWorkspaces();
  const [showCreate, setShowCreate] = useState(false);

  // Smart routing: if exactly 1 workspace, redirect
  useEffect(() => {
    if (!isLoading && workspaces?.length === 1) {
      router.replace(`/w/${workspaces[0].slug}`);
    }
  }, [isLoading, workspaces, router]);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Workspaces" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 bg-white p-6 space-y-3">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // If redirecting to single workspace, show loading
  if (workspaces?.length === 1) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title="Workspaces"
        description="Select a workspace or create a new one"
        action={
          <Button onClick={() => setShowCreate(true)} icon={<Plus className="h-4 w-4" />}>
            New Workspace
          </Button>
        }
      />

      {workspaces?.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-body text-gray-500">No workspaces yet.</p>
          <p className="mt-1 text-small text-gray-400">
            Create your first workspace to get started.
          </p>
          <Button
            onClick={() => setShowCreate(true)}
            className="mt-6"
            icon={<Plus className="h-4 w-4" />}
          >
            Create Workspace
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces?.map((ws: Record<string, unknown>) => (
            <Card key={ws.id as string} hover onClick={() => router.push(`/w/${ws.slug}`)}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-subtitle text-black">{ws.name as string}</h3>
                  <p className="mt-1 text-small text-gray-500">/{ws.slug as string}</p>
                </div>
                <Badge>{ws.plan as string}</Badge>
              </div>
              <div className="mt-4 flex items-center justify-between text-small text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {(ws._count as Record<string, number>)?.memberships ?? "—"} members
                </span>
                <ArrowRight className="h-4 w-4 text-gray-300" />
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateWorkspaceModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
