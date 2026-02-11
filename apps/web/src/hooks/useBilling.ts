import { useQuery, useMutation } from "@tanstack/react-query";
import type { Plan } from "@tenantforge/shared";

import { useToast } from "@/components/ui/Toast";
import { api, getApiError } from "@/lib/api";

export function useBillingInfo(slug: string) {
  return useQuery({
    queryKey: ["billing", slug],
    queryFn: async () => {
      const { data } = await api.get(`/workspaces/${slug}/billing`);
      return data.data;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCheckout(slug: string) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (plan: Exclude<Plan, "FREE">) => {
      const { data } = await api.post(`/workspaces/${slug}/billing/checkout`, { plan });
      return data.data;
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error) => {
      toast("error", getApiError(error));
    },
  });
}

export function useCreatePortal(slug: string) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/workspaces/${slug}/billing/portal`);
      return data.data;
    },
    onSuccess: (data) => {
      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      }
    },
    onError: (error) => {
      toast("error", getApiError(error));
    },
  });
}
