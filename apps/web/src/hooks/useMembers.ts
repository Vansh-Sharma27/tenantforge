import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Role } from "@tenantforge/shared";

import { useToast } from "@/components/ui/Toast";
import { api, getApiError } from "@/lib/api";

export function useMembers(slug: string, params?: { page?: number; search?: string; role?: Role }) {
  return useQuery({
    queryKey: ["members", slug, params],
    queryFn: async () => {
      const { data } = await api.get(`/workspaces/${slug}/members`, { params });
      return data;
    },
    enabled: !!slug,
  });
}

export function useUpdateMemberRole(slug: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: Role }) => {
      const { data } = await api.patch(`/workspaces/${slug}/members/${memberId}`, { role });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", slug] });
      toast("success", "Role updated.");
    },
    onError: (error) => {
      toast("error", getApiError(error));
    },
  });
}

export function useRemoveMember(slug: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const { data } = await api.delete(`/workspaces/${slug}/members/${memberId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", slug] });
      toast("success", "Member removed.");
    },
    onError: (error) => {
      toast("error", getApiError(error));
    },
  });
}

export function useLeaveWorkspace(slug: string) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/workspaces/${slug}/leave`);
      return data;
    },
    onError: (error) => {
      toast("error", getApiError(error));
    },
  });
}

export function useTransferOwnership(slug: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ targetUserId, password }: { targetUserId: string; password: string }) => {
      const { data } = await api.post(`/workspaces/${slug}/transfer`, {
        targetUserId,
        password,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", slug] });
      queryClient.invalidateQueries({ queryKey: ["workspace", slug] });
      toast("success", "Ownership transferred.");
    },
    onError: (error) => {
      toast("error", getApiError(error));
    },
  });
}
