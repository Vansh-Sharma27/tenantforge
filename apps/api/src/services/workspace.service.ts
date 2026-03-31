import { Plan, Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { membershipRepository } from "@/repositories/membership.repository";
import { userRepository } from "@/repositories/user.repository";
import { workspaceRepository } from "@/repositories/workspace.repository";
import { auditService } from "@/services/audit.service";
import { stripeService } from "@/services/stripe.service";
import { AuditActions } from "@/types/audit.types";
import { ConflictError, NotFoundError, UnauthorizedError, ForbiddenError } from "@/utils/errors";
import { logger } from "@/utils/logger";
import { verifyPassword } from "@/utils/password";
import { slugify, generateRandomSuffix } from "@/utils/slug";

/**
 * Workspace service handling all workspace-related business logic
 */
export class WorkspaceService {
  /**
   * Creates a new workspace for a user
   */
  async createWorkspace(
    userId: string,
    data: {
      name: string;
      slug?: string;
    }
  ) {
    const { name, slug: providedSlug } = data;

    let finalSlug: string;

    if (providedSlug) {
      // User provided a slug - check if it's available
      const isAvailable = await workspaceRepository.isSlugAvailable(providedSlug);
      if (!isAvailable) {
        throw new ConflictError("Workspace slug already taken");
      }
      finalSlug = providedSlug;
    } else {
      // Generate slug from name
      const baseSlug = slugify(name);
      let slugToTry = baseSlug;
      let isAvailable = await workspaceRepository.isSlugAvailable(slugToTry);

      // If slug is taken, append random suffix until we find an available one
      while (!isAvailable) {
        const suffix = generateRandomSuffix();
        slugToTry = `${baseSlug}-${suffix}`;
        isAvailable = await workspaceRepository.isSlugAvailable(slugToTry);
      }

      finalSlug = slugToTry;
    }

    // Get user details for Stripe customer
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User");
    }

    // Create Stripe customer (optional - only if Stripe is configured)
    let stripeCustomerId: string | undefined;
    try {
      const customer = await stripeService.createCustomer({
        workspaceId: "", // Will be updated after workspace creation
        workspaceSlug: finalSlug,
        workspaceName: name,
        userId: user.id,
        userEmail: user.email,
        userName: user.name || user.email,
      });
      stripeCustomerId = customer.id;
    } catch (error) {
      // If Stripe is not configured, continue without customer creation
      logger.warn({ error }, "Failed to create Stripe customer - continuing without billing");
    }

    // Create workspace and owner membership atomically
    let workspace: Awaited<ReturnType<typeof workspaceRepository.findById>>;
    let membership: Awaited<ReturnType<typeof membershipRepository.create>>;

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create workspace with FREE plan and default settings
        let ws;
        try {
          ws = await tx.workspace.create({
            data: {
              name,
              slug: finalSlug,
              plan: Plan.FREE,
              settings: {},
              stripeCustomerId,
            },
          });
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            throw new ConflictError(
              "A workspace with this slug already exists. Please try a different name."
            );
          }
          throw error;
        }

        // Create membership with OWNER role
        const ms = await tx.membership.create({
          data: {
            userId,
            workspaceId: ws.id,
            role: Role.OWNER,
            invitedById: userId,
          },
        });

        return { workspace: ws, membership: ms };
      });

      workspace = result.workspace;
      membership = result.membership;
    } catch (error) {
      // BUG-H02: clean up orphaned Stripe customer if DB transaction failed
      if (stripeCustomerId) {
        await stripeService.deleteCustomer(stripeCustomerId);
      }
      throw error;
    }

    // BUG-H01: update Stripe customer metadata with the real workspace ID
    if (stripeCustomerId) {
      try {
        await stripeService.updateCustomerMetadata(stripeCustomerId, {
          workspaceId: workspace!.id,
        });
      } catch (error) {
        logger.warn(
          { error, workspaceId: workspace!.id },
          "Failed to update Stripe customer metadata"
        );
      }
    }

    // Audit log
    auditService.log({
      workspaceId: workspace!.id,
      actorId: userId,
      actorType: "user",
      action: AuditActions.WORKSPACE_CREATED,
      resourceType: "workspace",
      resourceId: workspace!.id,
      metadata: {
        name: workspace!.name,
        slug: workspace!.slug,
        plan: workspace!.plan,
      },
    });

    logger.info(
      {
        userId,
        workspaceId: workspace!.id,
        workspaceSlug: workspace!.slug,
        hasStripeCustomer: !!stripeCustomerId,
      },
      "Workspace created"
    );

    return {
      workspace: workspace!,
      membership: membership!,
    };
  }

  /**
   * Lists all workspaces for a user with pagination
   */
  async listUserWorkspaces(
    userId: string,
    pagination: {
      page: number;
      limit: number;
    }
  ) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Get workspaces with user's role and join date — fetch limit+1 to detect hasMore
    const workspaces = await membershipRepository.findWorkspacesByUser(userId, {
      skip,
      take: limit + 1,
    });

    const hasMore = workspaces.length > limit;
    const pageWorkspaces = hasMore ? workspaces.slice(0, limit) : workspaces;

    logger.info(
      {
        userId,
        count: pageWorkspaces.length,
        page,
        limit,
      },
      "Listed user workspaces"
    );

    return {
      workspaces: pageWorkspaces,
      pagination: {
        page,
        limit,
        hasMore,
      },
    };
  }

  /**
   * Gets detailed information about a workspace
   */
  async getWorkspaceDetails(workspaceId: string) {
    // Find workspace
    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError("Workspace");
    }

    // Get member count
    const memberCount = await workspaceRepository.countMembers(workspaceId);

    logger.info(
      {
        workspaceId,
        workspaceSlug: workspace.slug,
        memberCount,
      },
      "Retrieved workspace details"
    );

    return {
      ...workspace,
      memberCount,
    };
  }

  /**
   * Updates a workspace
   */
  async updateWorkspace(
    workspaceId: string,
    userId: string,
    data: {
      name?: string;
      settings?: Record<string, unknown>;
    }
  ) {
    const { name, settings } = data;

    // Verify workspace exists
    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError("Workspace");
    }

    // Note: We explicitly do NOT allow slug changes for security reasons
    // Slug changes would break all existing links and could cause confusion

    // Update workspace
    const updatedWorkspace = await workspaceRepository.update(workspaceId, {
      ...(name && { name }),
      ...(settings && { settings: settings as unknown as Prisma.JsonValue }),
    });

    // Audit log
    auditService.log({
      workspaceId,
      actorId: userId,
      actorType: "user",
      action: AuditActions.WORKSPACE_UPDATED,
      resourceType: "workspace",
      resourceId: workspaceId,
      metadata: {
        updatedFields: Object.keys(data),
        ...(name && { newName: name }),
      },
    });

    logger.info(
      {
        workspaceId,
        workspaceSlug: workspace.slug,
        updatedFields: Object.keys(data),
      },
      "Workspace updated"
    );

    return updatedWorkspace;
  }

  /**
   * Deletes a workspace (soft delete)
   * Requires password confirmation and OWNER role
   */
  async deleteWorkspace(workspaceId: string, userId: string, password: string) {
    // Verify workspace exists
    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError("Workspace");
    }

    // Fetch user to verify password
    const user = await userRepository.findById(userId);
    if (!user || !user.password) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Check if user is OWNER
    const membership = await membershipRepository.findByUserAndWorkspace(userId, workspaceId);
    if (!membership || membership.role !== Role.OWNER) {
      throw new ForbiddenError("Only workspace owners can delete workspaces");
    }

    // Soft delete workspace
    await workspaceRepository.softDelete(workspaceId);

    // Audit log
    auditService.log({
      workspaceId,
      actorId: userId,
      actorType: "user",
      action: AuditActions.WORKSPACE_DELETED,
      resourceType: "workspace",
      resourceId: workspaceId,
      metadata: {
        name: workspace.name,
        slug: workspace.slug,
      },
    });

    logger.info(
      {
        userId,
        workspaceId,
        workspaceSlug: workspace.slug,
      },
      "Workspace deleted"
    );

    return {
      message: "Workspace deleted successfully",
    };
  }
}

export const workspaceService = new WorkspaceService();
