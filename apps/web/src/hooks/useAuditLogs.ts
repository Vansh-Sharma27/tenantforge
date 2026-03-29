import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

interface AuditLog {
  id: string;
  workspaceId: string;
  actorId: string | null;
  actorType: "user" | "system" | "webhook";
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface AuditLogResponse {
  data: AuditLog[];
  meta: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export function useAuditLogs(
  slug: string,
  options: { page?: number; limit?: number; action?: string } = {}
) {
  const { page = 1, limit = 50, action } = options;

  return useQuery<AuditLogResponse>({
    queryKey: ["audit-logs", slug, page, limit, action],
    queryFn: async () => {
      const { data } = await api.get(`/workspaces/${slug}/audit`, {
        params: { page, limit, ...(action && { action }) },
      });
      return data;
    },
    enabled: !!slug,
  });
}
