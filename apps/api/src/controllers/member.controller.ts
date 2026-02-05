import { Request, Response, NextFunction } from "express";

import {
  listMembersQuerySchema,
  updateMemberRoleSchema,
  transferOwnershipSchema,
} from "@/schemas/member.schema";
import { memberService } from "@/services/member.service";

/**
 * Member controller handling HTTP requests/responses for member management
 */
export class MemberController {
  /**
   * GET /api/v1/workspaces/:slug/members
   * Lists all members in a workspace with filtering and pagination
   */
  async listMembers(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate query params
      const query = listMembersQuerySchema.parse(req.query);

      // Workspace is attached by requireWorkspace middleware
      if (!req.workspace) {
        return res.status(404).json({
          success: false,
          error: "Workspace not found",
        });
      }

      // Get members
      const result = await memberService.listMembers(req.workspace.id, {
        page: query.page,
        limit: query.limit,
        search: query.search,
        role: query.role,
      });

      res.status(200).json({
        success: true,
        data: result.members,
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
   * PATCH /api/v1/workspaces/:slug/members/:id
   * Updates a member's role (requires ADMIN or OWNER)
   */
  async updateMemberRole(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const input = updateMemberRoleSchema.parse(req.body);
      const { id: membershipId } = req.params;

      // Ensure user and membership are attached
      if (!req.membership || !membershipId) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }

      // Update member role
      const result = await memberService.updateMemberRole(membershipId, input.role, req.membership);

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
   * DELETE /api/v1/workspaces/:slug/members/:id
   * Removes a member from a workspace (requires ADMIN or OWNER)
   */
  async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: membershipId } = req.params;

      // Ensure workspace and membership are attached
      if (!req.workspace || !req.membership || !membershipId) {
        return res.status(404).json({
          success: false,
          error: "Workspace not found",
        });
      }

      // Remove member
      const result = await memberService.removeMember(
        membershipId,
        req.workspace.id,
        req.membership
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
   * POST /api/v1/workspaces/:slug/leave
   * Allows a member to leave a workspace
   */
  async leaveWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      // Ensure user and workspace are attached
      if (!req.user || !req.workspace) {
        return res.status(404).json({
          success: false,
          error: "Workspace not found",
        });
      }

      // Leave workspace
      const result = await memberService.leaveWorkspace(req.user.userId, req.workspace.id);

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
   * POST /api/v1/workspaces/:slug/transfer
   * Transfers workspace ownership to another member (requires OWNER and password)
   */
  async transferOwnership(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const input = transferOwnershipSchema.parse(req.body);

      // Ensure user and workspace are attached
      if (!req.user || !req.workspace) {
        return res.status(404).json({
          success: false,
          error: "Workspace not found",
        });
      }

      // Transfer ownership
      const result = await memberService.transferOwnership(
        req.workspace.id,
        req.user.userId,
        input.targetUserId,
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

export const memberController = new MemberController();
