"use client";

import { FileText, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card, Badge, Button, Skeleton } from "@/components/ui";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { cn } from "@/lib/cn";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  "user.registered": { label: "User Registered", color: "text-emerald-700 bg-emerald-50" },
  "user.login": { label: "Login", color: "text-blue-700 bg-blue-50" },
  "user.logout": { label: "Logout", color: "text-gray-700 bg-gray-100" },
  "user.login_failed": { label: "Login Failed", color: "text-red-700 bg-red-50" },
  "workspace.created": { label: "Workspace Created", color: "text-emerald-700 bg-emerald-50" },
  "workspace.updated": { label: "Workspace Updated", color: "text-blue-700 bg-blue-50" },
  "workspace.deleted": { label: "Workspace Deleted", color: "text-red-700 bg-red-50" },
  "member.invited": { label: "Member Invited", color: "text-purple-700 bg-purple-50" },
  "member.joined": { label: "Member Joined", color: "text-emerald-700 bg-emerald-50" },
  "member.role_changed": { label: "Role Changed", color: "text-amber-700 bg-amber-50" },
  "member.removed": { label: "Member Removed", color: "text-red-700 bg-red-50" },
  "ownership.transferred": {
    label: "Ownership Transferred",
    color: "text-purple-700 bg-purple-50",
  },
  "subscription.created": {
    label: "Subscription Created",
    color: "text-emerald-700 bg-emerald-50",
  },
  "subscription.updated": { label: "Subscription Updated", color: "text-blue-700 bg-blue-50" },
  "subscription.cancelled": { label: "Subscription Cancelled", color: "text-red-700 bg-red-50" },
  "payment.failed": { label: "Payment Failed", color: "text-red-700 bg-red-50" },
  "rate_limit.exceeded": { label: "Rate Limited", color: "text-amber-700 bg-amber-50" },
};

const FILTER_OPTIONS = [
  { value: "", label: "All Events" },
  { value: "user.", label: "Auth" },
  { value: "workspace.", label: "Workspace" },
  { value: "member.", label: "Members" },
  { value: "subscription.", label: "Billing" },
  { value: "payment.", label: "Payments" },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AuditLogPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");

  const { data, isLoading } = useAuditLogs(slug, {
    page,
    limit: 30,
    action: actionFilter || undefined,
  });

  const logs = data?.data || [];
  const pagination = data?.meta?.pagination;

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Audit Log" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Audit Log" description="Track workspace activity and changes" />

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              setActionFilter(opt.value);
              setPage(1);
            }}
            className={cn(
              "px-3 py-1 text-xs border transition-colors cursor-pointer",
              actionFilter === opt.value
                ? "border-black bg-black text-white"
                : "border-gray-200 text-gray-600 hover:border-gray-400"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Log entries */}
      {logs.length === 0 ? (
        <Card className="text-center py-16">
          <FileText className="h-8 w-8 text-gray-300 mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-body text-gray-500">No audit events found.</p>
          {actionFilter && (
            <p className="mt-1 text-small text-gray-400">
              Try removing the filter to see all events.
            </p>
          )}
        </Card>
      ) : (
        <div className="border border-gray-200 divide-y divide-gray-100">
          {logs.map((log) => {
            const actionInfo = ACTION_LABELS[log.action] || {
              label: log.action,
              color: "text-gray-700 bg-gray-100",
            };

            return (
              <div
                key={log.id}
                className="flex items-center gap-4 px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-block px-2 py-0.5 text-[11px] font-medium",
                        actionInfo.color
                      )}
                    >
                      {actionInfo.label}
                    </span>
                    <Badge variant="default" className="text-[10px]">
                      {log.actorType}
                    </Badge>
                  </div>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <p className="mt-0.5 text-xs text-gray-400 truncate">
                      {Object.entries(log.metadata)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" · ")}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-500">{formatDate(log.createdAt)}</p>
                  {log.ipAddress && <p className="text-[10px] text-gray-400">{log.ipAddress}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-500">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} events)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
