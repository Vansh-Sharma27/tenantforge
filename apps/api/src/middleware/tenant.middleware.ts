import { Request, Response, NextFunction } from "express";

import { workspaceRepository } from "@/repositories/workspace.repository";
import { NotFoundError } from "@/utils/errors";

/**
 * Middleware that requires valid workspace context.
 * Extracts workspace slug from route params and verifies user membership.
 *
 * Security: Returns 404 (not 403) when user isn't a member to prevent
 * workspace enumeration attacks.
 *
 * Usage:
 * - Place after requireAuth middleware
 * - Route param must be named 'slug' or 'workspace'
 * - Attaches req.workspace and req.membership
 */
export async function requireWorkspace(req: Request, _res: Response, next: NextFunction) {
  try {
    // Ensure user is authenticated first
    if (!req.user) {
      throw new NotFoundError("Workspace");
    }

    // Extract workspace slug from params
    const slug = req.params.slug || req.params.workspace;

    if (!slug) {
      throw new NotFoundError("Workspace");
    }

    // Find workspace and verify user membership in single query
    const result = await workspaceRepository.findBySlugWithMembership(slug, req.user.userId);

    // Return 404 if workspace doesn't exist OR user is not a member
    // This prevents workspace enumeration attacks
    if (!result) {
      throw new NotFoundError("Workspace");
    }

    // Attach workspace and membership to request
    req.workspace = {
      id: result.workspace.id,
      slug: result.workspace.slug,
      name: result.workspace.name,
      plan: result.workspace.plan,
    };

    req.membership = {
      id: result.membership.id,
      role: result.membership.role,
      joinedAt: result.membership.joinedAt,
      userId: result.membership.userId,
      workspaceId: result.membership.workspaceId,
    };

    next();
  } catch (error) {
    next(error);
  }
}
