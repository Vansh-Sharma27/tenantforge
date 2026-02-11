import type { Workspace, Membership } from "@tenantforge/shared";
import { create } from "zustand";

interface WorkspaceState {
  currentWorkspace: (Workspace & { membership: Membership }) | null;
  setCurrentWorkspace: (workspace: (Workspace & { membership: Membership }) | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  currentWorkspace: null,
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
}));
