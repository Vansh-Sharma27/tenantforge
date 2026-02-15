import { Invitation, InvitationStatus, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Invitation repository for database operations
 */
export class InvitationRepository {
  /**
   * Creates a new invitation
   */
  async create(data: {
    email: string;
    workspaceId: string;
    role: Role;
    invitedById: string;
    token: string;
    expiresAt: Date;
  }): Promise<Invitation> {
    return await prisma.invitation.create({
      data: {
        email: data.email,
        workspaceId: data.workspaceId,
        role: data.role,
        invitedById: data.invitedById,
        token: data.token,
        expiresAt: data.expiresAt,
        status: InvitationStatus.PENDING,
      },
    });
  }

  /**
   * Finds an invitation by token
   */
  async findByToken(token: string): Promise<Invitation | null> {
    return await prisma.invitation.findUnique({
      where: {
        token,
      },
    });
  }

  /**
   * Finds an invitation by email and workspace
   * Used to check for duplicate pending invitations
   */
  async findByEmailAndWorkspace(email: string, workspaceId: string): Promise<Invitation | null> {
    return await prisma.invitation.findFirst({
      where: {
        email,
        workspaceId,
        status: InvitationStatus.PENDING,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  /**
   * Finds all pending invitations for a workspace
   * Includes inviter information
   */
  async findPendingByWorkspace(workspaceId: string): Promise<
    Array<
      Invitation & {
        invitedBy: {
          id: string;
          name: string | null;
          email: string;
        };
      }
    >
  > {
    return await prisma.invitation.findMany({
      where: {
        workspaceId,
        status: InvitationStatus.PENDING,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Finds an invitation by ID
   */
  async findById(id: string): Promise<Invitation | null> {
    return await prisma.invitation.findUnique({
      where: {
        id,
      },
    });
  }

  /**
   * Updates an invitation's status
   */
  async updateStatus(id: string, status: InvitationStatus): Promise<Invitation> {
    return await prisma.invitation.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Deletes an invitation
   */
  async delete(id: string): Promise<void> {
    await prisma.invitation.delete({
      where: { id },
    });
  }

  /**
   * Counts pending invitations for a workspace
   */
  async countPendingByWorkspace(workspaceId: string): Promise<number> {
    return await prisma.invitation.count({
      where: {
        workspaceId,
        status: InvitationStatus.PENDING,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  /**
   * Finds all invitations for an email across all workspaces
   * Useful for showing pending invitations on login
   */
  async findByEmail(email: string): Promise<Invitation[]> {
    return await prisma.invitation.findMany({
      where: {
        email,
        status: InvitationStatus.PENDING,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}

export const invitationRepository = new InvitationRepository();
