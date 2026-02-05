import { Request, Response, NextFunction } from "express";
import { z } from "zod";

import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  deleteWorkspaceSchema,
} from "@/schemas/workspace.schema";
import { workspaceService } from "@/services/workspace.service";

/**
 * Pagination query schema for listing workspaces
 */
const listWorkspacesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Workspace controller handling HTTP requests/responses
 */
export class WorkspaceController {
  /**
   * POST /api/v1/workspaces
   * Creates a new workspace for the authenticated user
   */
  async createWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const input = createWorkspaceSchema.parse(req.body);

      // Ensure user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      // Create workspace
      const result = await workspaceService.createWorkspace(req.user.userId, {
        name: input.name,
        slug: input.slug,
      });

      res.status(201).json({
        success: true,
        data: result,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/workspaces
   * Lists all workspaces the authenticated user is a member of
   */
  async listWorkspaces(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate query params
      const query = listWorkspacesQuerySchema.parse(req.query);

      // Ensure user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      // Get user's workspaces
      const result = await workspaceService.listUserWorkspaces(req.user.userId, {
        page: query.page,
        limit: query.limit,
      });

      res.status(200).json({
        success: true,
        data: result.workspaces,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
          pagination: result.pagination,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/workspaces/:slug
   * Gets detailed information about a specific workspace
   */
  async getWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      // Workspace is already attached by requireWorkspace middleware
      if (!req.workspace) {
        return res.status(404).json({
          success: false,
          error: "Workspace not found",
        });
      }

      // Get detailed workspace information
      const result = await workspaceService.getWorkspaceDetails(req.workspace.id);

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/workspaces/:slug
   * Updates a workspace (requires OWNER or ADMIN role)
   */
  async updateWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const input = updateWorkspaceSchema.parse(req.body);

      // Workspace is already attached by requireWorkspace middleware
      if (!req.workspace) {
        return res.status(404).json({
          success: false,
          error: "Workspace not found",
        });
      }

      // Update workspace
      const result = await workspaceService.updateWorkspace(req.workspace.id, {
        name: input.name,
        settings: input.settings,
      });

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/workspaces/:slug
   * Soft deletes a workspace (requires OWNER role and password confirmation)
   */
  async deleteWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const input = deleteWorkspaceSchema.parse(req.body);

      // Ensure user and workspace are attached
      if (!req.user || !req.workspace) {
        return res.status(404).json({
          success: false,
          error: "Workspace not found",
        });
      }

      // Delete workspace
      const result = await workspaceService.deleteWorkspace(
        req.workspace.id,
        req.user.userId,
        input.password
      );

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const workspaceController = new WorkspaceController();
