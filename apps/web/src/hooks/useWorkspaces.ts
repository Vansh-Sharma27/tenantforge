import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/components/ui/Toast";
import { api, getApiError } from "@/lib/api";
import type { CreateWorkspaceInput } from "@/lib/validators";

export function useWorkspaces() {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const { data } = await api.get("/workspaces");
      // API returns [{ workspace: {...}, role, joinedAt }] — flatten for frontend
      return data.data.map(
        (item: { workspace: Record<string, unknown>; role: string; joinedAt: string }) => ({
          ...item.workspace,
          membership: { role: item.role, joinedAt: item.joinedAt },
        })
      );
    },
  });
}

export function useWorkspace(slug: string) {
  return useQuery({
    queryKey: ["workspace", slug],
    queryFn: async () => {
      const { data } = await api.get(`/workspaces/${slug}`);
      return data.data;
    },
    enabled: !!slug,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateWorkspaceInput) => {
      const body: Record<string, string> = { name: input.name };
      if (input.slug) body.slug = input.slug;
      const { data } = await api.post("/workspaces", body);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      toast("success", "Workspace created.");
    },
    onError: (error) => {
      toast("error", getApiError(error));
    },
  });
}

export function useUpdateWorkspace(slug: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: { name?: string; settings?: Record<string, unknown> }) => {
      const { data } = await api.patch(`/workspaces/${slug}`, input);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", slug] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      toast("success", "Workspace updated.");
    },
    onError: (error) => {
      toast("error", getApiError(error));
    },
  });
}

export function useDeleteWorkspace(slug: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (password: string) => {
      const { data } = await api.delete(`/workspaces/${slug}`, {
        data: { password },
      });
      return data;
    },
    onSuccess: () => {
      // Remove stale cache so dashboard fetches fresh data (shows loading, not stale)
      queryClient.removeQueries({ queryKey: ["workspace", slug] });
      queryClient.removeQueries({ queryKey: ["workspaces"] });
    },
    onError: (error) => {
      toast("error", getApiError(error));
    },
  });
}
