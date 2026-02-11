"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";

import { useWorkspace } from "@/hooks/useWorkspaces";
import { useWorkspaceStore } from "@/stores/workspaceStore";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const { data } = useWorkspace(slug);
  const { setCurrentWorkspace } = useWorkspaceStore();

  useEffect(() => {
    if (data) {
      setCurrentWorkspace(data);
    }
    return () => {
      setCurrentWorkspace(null);
    };
  }, [data, setCurrentWorkspace]);

  return <>{children}</>;
}
