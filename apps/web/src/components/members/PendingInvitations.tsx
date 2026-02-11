"use client";

import { format } from "date-fns";
import { X } from "lucide-react";

import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Badge,
} from "@/components/ui";
import { usePendingInvitations, useRevokeInvitation } from "@/hooks/useInvitations";

interface PendingInvitationsProps {
  slug: string;
}

export function PendingInvitations({ slug }: PendingInvitationsProps) {
  const { data: invitations, isLoading } = usePendingInvitations(slug);
  const revoke = useRevokeInvitation(slug);

  if (isLoading || !invitations?.length) return null;

  return (
    <div className="mt-8">
      <h3 className="text-subtitle text-black mb-4">Pending Invitations</h3>
      <Table>
        <TableHeader>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableHeader>
        <TableBody>
          {invitations.map((inv: Record<string, unknown>) => (
            <TableRow key={inv.id as string}>
              <TableCell>{inv.email as string}</TableCell>
              <TableCell>
                <Badge>{inv.role as string}</Badge>
              </TableCell>
              <TableCell>
                <span className="text-gray-500">
                  {format(new Date(inv.expiresAt as string), "MMM d, yyyy")}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <button
                  onClick={() => revoke.mutate(inv.id as string)}
                  className="text-gray-400 hover:text-red-500 cursor-pointer transition-default p-1"
                  aria-label={`Revoke invitation to ${inv.email}`}
                  disabled={revoke.isPending}
                >
                  <X className="h-4 w-4" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
