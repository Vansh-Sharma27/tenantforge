import { PrismaClient, Membership, Role } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Membership repository for database operations
 */
export class MembershipRepository {
  /**
   * Creates a new membership
   */
  async create(data: {
    userId: string;
    workspaceId: string;
    role: Role;
    invitedById?: string;
  }): Promise<Membership> {
    return await prisma.membership.create({
      data: {
        userId: data.userId,
        workspaceId: data.workspaceId,
        role: data.role,
        invitedById: data.invitedById,
      },
    });
  }

  /**
   * Finds a membership by user ID and workspace ID
   */
  async findByUserAndWorkspace(userId: string, workspaceId: string): Promise<Membership | null> {
    return await prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });
  }

  /**
   * Finds all memberships for a workspace
   * Includes user information
   */
  async findByWorkspace(workspaceId: string): Promise<Membership[]> {
    return await prisma.membership.findMany({
      where: {
        workspaceId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            status: true,
          },
        },
      },
      orderBy: {
        joinedAt: "asc",
      },
    });
  }

  /**
   * Finds all workspaces for a user with pagination
   * Returns workspace info along with the user's role and join date
   */
  async findWorkspacesByUser(
    userId: string,
    pagination?: { skip?: number; take?: number }
  ): Promise<
    Array<{
      workspace: {
        id: string;
        name: string;
        slug: string;
        plan: string;
        createdAt: Date;
      };
      role: Role;
      joinedAt: Date;
    }>
  > {
    const memberships = await prisma.membership.findMany({
      where: {
        userId,
        workspace: {
          deletedAt: null,
        },
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
      skip: pagination?.skip,
      take: pagination?.take,
    });

    return memberships.map((m) => ({
      workspace: m.workspace,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }

  /**
   * Counts the number of memberships in a workspace
   */
  async countByWorkspace(workspaceId: string): Promise<number> {
    return await prisma.membership.count({
      where: {
        workspaceId,
      },
    });
  }

  /**
   * Counts the number of owners in a workspace
   */
  async countOwners(workspaceId: string): Promise<number> {
    return await prisma.membership.count({
      where: {
        workspaceId,
        role: Role.OWNER,
      },
    });
  }

  /**
   * Updates a membership role
   */
  async updateRole(id: string, role: Role): Promise<Membership> {
    return await prisma.membership.update({
      where: { id },
      data: { role },
    });
  }

  /**
   * Deletes a membership
   */
  async delete(id: string): Promise<void> {
    await prisma.membership.delete({
      where: { id },
    });
  }
}

export const membershipRepository = new MembershipRepository();
