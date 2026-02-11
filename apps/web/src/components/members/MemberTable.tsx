"use client";

import type { Role } from "@tenantforge/shared";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { useState } from "react";

import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
  Badge,
  Button,
  Modal,
} from "@/components/ui";
import { useUpdateMemberRole, useRemoveMember } from "@/hooks/useMembers";

import { RoleSelect } from "./RoleSelect";

interface Member {
  id: string;
  role: Role;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

interface MemberTableProps {
  members: Member[];
  slug: string;
  actorRole: Role;
  actorUserId: string;
}

export function MemberTable({ members, slug, actorRole, actorUserId }: MemberTableProps) {
  const updateRole = useUpdateMemberRole(slug);
  const removeMember = useRemoveMember(slug);
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);

  const canManageMembers = actorRole === "OWNER" || actorRole === "ADMIN";

  return (
    <>
      <Table>
        <TableHeader>
          <TableHead>Member</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Joined</TableHead>
          {canManageMembers && <TableHead className="text-right">Actions</TableHead>}
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar name={member.user.name} src={member.user.avatarUrl} size="sm" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {member.user.name || "Unnamed"}
                      {member.user.id === actorUserId && (
                        <span className="ml-2 text-xs text-gray-400">you</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">{member.user.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {member.role === "OWNER" ? (
                  <Badge variant="accent">OWNER</Badge>
                ) : (
                  <RoleSelect
                    value={member.role}
                    actorRole={actorRole}
                    targetRole={member.role}
                    onChange={(role) => updateRole.mutate({ memberId: member.id, role })}
                    disabled={updateRole.isPending}
                  />
                )}
              </TableCell>
              <TableCell>
                <span className="text-gray-500">
                  {format(new Date(member.joinedAt), "MMM d, yyyy")}
                </span>
              </TableCell>
              {canManageMembers && (
                <TableCell className="text-right">
                  {member.role !== "OWNER" && member.user.id !== actorUserId && (
                    <button
                      onClick={() => setRemoveTarget(member)}
                      className="text-gray-400 hover:text-red-500 cursor-pointer transition-default p-1"
                      aria-label={`Remove ${member.user.name || member.user.email}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Remove confirmation modal */}
      <Modal
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title={`Remove ${removeTarget?.user.name || removeTarget?.user.email}?`}
        description="This person will lose access to the workspace immediately."
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={() => setRemoveTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={removeMember.isPending}
            onClick={async () => {
              if (removeTarget) {
                await removeMember.mutateAsync(removeTarget.id);
                setRemoveTarget(null);
              }
            }}
          >
            Remove
          </Button>
        </div>
      </Modal>
    </>
  );
}
