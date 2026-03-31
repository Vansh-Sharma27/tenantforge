"use client";

import { format } from "date-fns";
import { X } from "lucide-react";
import { useState } from "react";

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

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
}

interface PendingInvitationsProps {
  slug: string;
}

export function PendingInvitations({ slug }: PendingInvitationsProps) {
  const { data: invitations, isLoading } = usePendingInvitations(slug);
  const revoke = useRevokeInvitation(slug);
  const [revokingId, setRevokingId] = useState<string | null>(null);

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
          {invitations.map((inv: PendingInvitation) => (
            <TableRow key={inv.id}>
              <TableCell>{inv.email}</TableCell>
              <TableCell>
                <Badge>{inv.role}</Badge>
              </TableCell>
              <TableCell>
                <span className="text-gray-500">
                  {format(new Date(inv.expiresAt), "MMM d, yyyy")}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <button
                  onClick={() => {
                    setRevokingId(inv.id);
                    revoke.mutate(inv.id, {
                      onSuccess: () => setRevokingId(null),
                      onError: () => setRevokingId(null),
                    });
                  }}
                  className="text-gray-400 hover:text-red-500 cursor-pointer transition-default p-1"
                  aria-label={`Revoke invitation to ${inv.email}`}
                  disabled={revokingId === inv.id}
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
