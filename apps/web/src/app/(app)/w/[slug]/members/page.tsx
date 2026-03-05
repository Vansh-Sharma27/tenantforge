"use client";

import type { Role } from "@tenantforge/shared";
import { hasPermission } from "@tenantforge/shared/constants/roles";
import { UserPlus, Search, Users } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { InviteMemberModal } from "@/components/members/InviteMemberModal";
import { MemberTable } from "@/components/members/MemberTable";
import { PendingInvitations } from "@/components/members/PendingInvitations";
import { Button, Pagination, Skeleton } from "@/components/ui";
import { useMembers } from "@/hooks/useMembers";
import { useAuthStore } from "@/stores/authStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";

export default function MembersPage() {
  const { slug } = useParams<{ slug: string }>();
  const { currentWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);

  const role = currentWorkspace?.membership?.role as Role;
  const canInvite = role ? hasPermission(role, "member:invite") : false;

  const { data, isLoading } = useMembers(slug, { page, search: search || undefined });

  return (
    <div>
      <PageHeader
        title="Members"
        description="Manage your workspace team"
        action={
          canInvite ? (
            <Button onClick={() => setShowInvite(true)} icon={<UserPlus className="h-4 w-4" />}>
              Invite Member
            </Button>
          ) : undefined
        }
      />

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search members\u2026"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-small text-gray-900 placeholder:text-gray-400 focus:border-accent focus:ring-1 focus:ring-accent transition-default"
          aria-label="Search members"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <Skeleton className="h-7 w-7 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto w-14 h-14 bg-accent/10 flex items-center justify-center mb-5">
            <Users className="h-6 w-6 text-accent" />
          </div>
          <p className="text-body text-gray-900">No members found</p>
          {search ? (
            <p className="mt-1 text-small text-gray-500">
              No results for &ldquo;{search}&rdquo;. Try a different search term.
            </p>
          ) : (
            <p className="mt-1 text-small text-gray-500">
              Invite team members to start collaborating.
            </p>
          )}
        </div>
      ) : (
        <>
          <MemberTable
            members={data?.data || []}
            slug={slug}
            actorRole={role}
            actorUserId={user?.id || ""}
          />
          {data?.meta?.pagination && (
            <Pagination
              page={data.meta.pagination.page}
              totalPages={data.meta.pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {/* Pending invitations */}
      {canInvite && <PendingInvitations slug={slug} />}

      <InviteMemberModal open={showInvite} onClose={() => setShowInvite(false)} slug={slug} />
    </div>
  );
}
