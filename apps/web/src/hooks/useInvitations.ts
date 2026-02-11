import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/components/ui/Toast";
import { api, getApiError } from "@/lib/api";
import type { InviteMemberInput } from "@/lib/validators";

export function usePendingInvitations(slug: string) {
  return useQuery({
    queryKey: ["invitations", slug],
    queryFn: async () => {
      const { data } = await api.get(`/workspaces/${slug}/invitations`);
      return data.data;
    },
    enabled: !!slug,
  });
}

export function useSendInvitation(slug: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: InviteMemberInput) => {
      const { data } = await api.post(`/workspaces/${slug}/invitations`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations", slug] });
      toast("success", "Invitation sent.");
    },
    onError: (error) => {
      toast("error", getApiError(error));
    },
  });
}

export function useRevokeInvitation(slug: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { data } = await api.delete(`/workspaces/${slug}/invitations/${invitationId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations", slug] });
      toast("success", "Invitation revoked.");
    },
    onError: (error) => {
      toast("error", getApiError(error));
    },
  });
}

export function useInvitationDetails(token: string) {
  return useQuery({
    queryKey: ["invitation", token],
    queryFn: async () => {
      const { data } = await api.get(`/invitations/${token}`);
      return data.data;
    },
    enabled: !!token,
  });
}

export function useAcceptInvitation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await api.post(`/invitations/${token}/accept`);
      return data;
    },
    onSuccess: () => {
      toast("success", "Invitation accepted.");
    },
    onError: (error) => {
      toast("error", getApiError(error));
    },
  });
}
