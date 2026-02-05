import { Request, Response, NextFunction } from "express";

import { sendInvitationSchema } from "@/schemas/invitation.schema";
import { invitationService } from "@/services/invitation.service";

/**
 * Invitation controller handling HTTP requests/responses
 */
export class InvitationController {
  /**
   * POST /api/v1/workspaces/:slug/invitations
   * Sends an invitation to join a workspace
   */
  async sendInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const input = sendInvitationSchema.parse(req.body);

      // Ensure user and workspace are attached
      if (!req.user || !req.workspace) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      // Send invitation
      const result = await invitationService.sendInvitation(
        req.workspace.id,
        req.user.userId,
        input.email,
        input.role
      );

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
   * GET /api/v1/workspaces/:slug/invitations
   * Lists pending invitations for a workspace
   */
  async listPendingInvitations(req: Request, res: Response, next: NextFunction) {
    try {
      // Ensure workspace is attached
      if (!req.workspace) {
        return res.status(404).json({
          success: false,
          error: "Workspace not found",
        });
      }

      // Get pending invitations
      const result = await invitationService.listPendingInvitations(req.workspace.id);

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
   * DELETE /api/v1/workspaces/:slug/invitations/:id
   * Revokes a pending invitation
   */
  async revokeInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      // Extract invitation ID from URL params
      const invitationId = req.params.id;

      // Ensure user and workspace are attached
      if (!req.user || !req.workspace || !invitationId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      // Revoke invitation
      const result = await invitationService.revokeInvitation(
        invitationId,
        req.workspace.id,
        req.user.userId
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

  /**
   * POST /api/v1/invitations/:token/accept
   * Accepts an invitation
   */
  async acceptInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      // Extract token from URL params
      const token = req.params.token;
      if (!token) {
        return res.status(400).json({
          success: false,
          error: "Token required",
        });
      }

      // User might or might not be authenticated
      const userId = req.user?.userId;

      // Accept invitation
      const result = await invitationService.acceptInvitation(token, userId);

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
   * GET /api/v1/invitations/:token
   * Gets invitation details (for registration flow)
   */
  async getInvitationDetails(req: Request, res: Response, next: NextFunction) {
    try {
      // Extract token from URL params
      const token = req.params.token;
      if (!token) {
        return res.status(400).json({
          success: false,
          error: "Token required",
        });
      }

      // Get invitation details
      const result = await invitationService.getInvitationDetails(token);

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

export const invitationController = new InvitationController();
