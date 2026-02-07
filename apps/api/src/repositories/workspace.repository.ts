import { PrismaClient, Workspace, Plan } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Workspace repository for database operations
 */
export class WorkspaceRepository {
  /**
   * Creates a new workspace
   */
  async create(data: {
    name: string;
    slug: string;
    plan?: Plan;
    settings?: Record<string, any>;
    stripeCustomerId?: string;
  }): Promise<Workspace> {
    return await prisma.workspace.create({
      data: {
        name: data.name,
        slug: data.slug,
        plan: data.plan || Plan.FREE,
        settings: data.settings || {},
        stripeCustomerId: data.stripeCustomerId,
      },
    });
  }

  /**
   * Finds a workspace by ID
   * Returns null if workspace is soft-deleted
   */
  async findById(id: string): Promise<Workspace | null> {
    return await prisma.workspace.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  /**
   * Finds a workspace by slug
   * Returns null if workspace is soft-deleted
   */
  async findBySlug(slug: string): Promise<Workspace | null> {
    return await prisma.workspace.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
    });
  }

  /**
   * Finds a workspace by slug and includes the user's membership
   * Returns null if workspace is soft-deleted or user is not a member
   */
  async findBySlugWithMembership(
    slug: string,
    userId: string
  ): Promise<{ workspace: Workspace; membership: any } | null> {
    const workspace = await prisma.workspace.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
      include: {
        memberships: {
          where: {
            userId,
          },
        },
      },
    });

    if (!workspace || workspace.memberships.length === 0) {
      return null;
    }

    return {
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        plan: workspace.plan,
        stripeCustomerId: workspace.stripeCustomerId,
        stripeSubId: workspace.stripeSubId,
        settings: workspace.settings,
        deletedAt: workspace.deletedAt,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
      },
      membership: workspace.memberships[0],
    };
  }

  /**
   * Updates a workspace
   */
  async update(
    id: string,
    data: Partial<
      Pick<Workspace, "name" | "slug" | "plan" | "settings" | "stripeCustomerId" | "stripeSubId">
    >
  ): Promise<Workspace> {
    return await prisma.workspace.update({
      where: { id },
      data: data as any, // Type assertion needed for JsonValue compatibility
    });
  }

  /**
   * Soft deletes a workspace
   */
  async softDelete(id: string): Promise<Workspace> {
    return await prisma.workspace.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Checks if a slug is available (not taken by any non-deleted workspace)
   */
  async isSlugAvailable(slug: string): Promise<boolean> {
    const existing = await prisma.workspace.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
    });
    return existing === null;
  }

  /**
   * Counts the number of active members in a workspace
   */
  async countMembers(workspaceId: string): Promise<number> {
    return await prisma.membership.count({
      where: {
        workspaceId,
      },
    });
  }

  /**
   * Finds a workspace by Stripe subscription ID
   */
  async findByStripeSubscriptionId(subscriptionId: string): Promise<Workspace | null> {
    return await prisma.workspace.findFirst({
      where: {
        stripeSubId: subscriptionId,
        deletedAt: null,
      },
    });
  }
}

export const workspaceRepository = new WorkspaceRepository();
