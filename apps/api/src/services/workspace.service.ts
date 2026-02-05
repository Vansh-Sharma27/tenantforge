import { Plan, Role } from "@prisma/client";

import { membershipRepository } from "@/repositories/membership.repository";
import { userRepository } from "@/repositories/user.repository";
import { workspaceRepository } from "@/repositories/workspace.repository";
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

    // Create workspace with FREE plan and default settings
    const workspace = await workspaceRepository.create({
      name,
      slug: finalSlug,
      plan: Plan.FREE,
      settings: {},
    });

    // Create membership with OWNER role
    const membership = await membershipRepository.create({
      userId,
      workspaceId: workspace.id,
      role: Role.OWNER,
      invitedById: userId,
    });

    logger.info(
      {
        userId,
        workspaceId: workspace.id,
        workspaceSlug: workspace.slug,
      },
      "Workspace created"
    );

    return {
      workspace,
      membership,
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

    // Get workspaces with user's role and join date
    const workspaces = await membershipRepository.findWorkspacesByUser(userId, {
      skip,
      take: limit,
    });

    // Calculate total count for pagination meta
    // Note: This is a simplification - in production, you'd want a separate count query
    const hasMore = workspaces.length === limit;

    logger.info(
      {
        userId,
        count: workspaces.length,
        page,
        limit,
      },
      "Listed user workspaces"
    );

    return {
      workspaces,
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
    data: {
      name?: string;
      settings?: Record<string, any>;
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
      ...(settings && { settings }),
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
