import { Role, InvitationStatus } from "@prisma/client";

/**
 * Invitation response with full details
 */
export interface InvitationResponse {
  id: string;
  email: string;
  role: Role;
  status: InvitationStatus;
  invitedBy: {
    id: string;
    name: string | null;
    email: string;
  };
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Compact invitation for lists
 */
export interface InvitationListItem {
  id: string;
  email: string;
  role: Role;
  status: InvitationStatus;
  invitedByName: string | null;
  expiresAt: Date;
  createdAt: Date;
}
