import { Role } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { requireWorkspace } from "@/middleware/tenant.middleware";
import { workspaceRepository } from "@/repositories/workspace.repository";
import { NotFoundError } from "@/utils/errors";

// Mock the workspace repository
vi.mock("@/repositories/workspace.repository", () => ({
  workspaceRepository: {
    findBySlugWithMembership: vi.fn(),
  },
}));

describe("Tenant Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      params: {},
      user: {
        userId: "user_123",
        workspaceId: "workspace_123",
        role: Role.OWNER,
      },
    };
    mockRes = {};
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe("requireWorkspace", () => {
    it("should attach workspace and membership with valid slug", async () => {
      const mockResult = {
        workspace: {
          id: "workspace_123",
          slug: "my-workspace",
          name: "My Workspace",
          plan: "FREE",
          deletedAt: null,
        },
        membership: {
          id: "membership_123",
          role: Role.OWNER,
          joinedAt: new Date(),
        },
      };

      vi.mocked(workspaceRepository.findBySlugWithMembership).mockResolvedValue(mockResult as any);

      mockReq.params = { slug: "my-workspace" };

      await requireWorkspace(mockReq as Request, mockRes as Response, mockNext);

      expect(workspaceRepository.findBySlugWithMembership).toHaveBeenCalledWith(
        "my-workspace",
        "user_123"
      );

      expect(mockReq.workspace).toEqual({
        id: "workspace_123",
        slug: "my-workspace",
        name: "My Workspace",
        plan: "FREE",
      });

      expect(mockReq.membership).toEqual({
        id: "membership_123",
        role: Role.OWNER,
        joinedAt: mockResult.membership.joinedAt,
      });

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should return 404 for non-existent workspace", async () => {
      vi.mocked(workspaceRepository.findBySlugWithMembership).mockResolvedValue(null);

      mockReq.params = { slug: "non-existent" };

      await requireWorkspace(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: "Workspace not found",
        })
      );
    });

    it("should return 404 for workspace user isn't member of (not 403)", async () => {
      // This is critical for security: prevents workspace enumeration
      vi.mocked(workspaceRepository.findBySlugWithMembership).mockResolvedValue(null);

      mockReq.params = { slug: "other-workspace" };

      await requireWorkspace(mockReq as Request, mockRes as Response, mockNext);

      // Should return 404, not 403 (prevents enumeration)
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: "Workspace not found",
        })
      );

      // Verify it's NotFoundError, not ForbiddenError
      const error = (mockNext as any).mock.calls[0][0];
      expect(error).toBeInstanceOf(NotFoundError);
    });

    it("should return 404 for soft-deleted workspace", async () => {
      // Soft-deleted workspaces should not be accessible
      vi.mocked(workspaceRepository.findBySlugWithMembership).mockResolvedValue(null);

      mockReq.params = { slug: "deleted-workspace" };

      await requireWorkspace(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
        })
      );
    });

    it("should work for VIEWER role", async () => {
      const mockResult = {
        workspace: {
          id: "workspace_123",
          slug: "my-workspace",
          name: "My Workspace",
          plan: "FREE",
          deletedAt: null,
        },
        membership: {
          id: "membership_123",
          role: Role.VIEWER,
          joinedAt: new Date(),
        },
      };

      vi.mocked(workspaceRepository.findBySlugWithMembership).mockResolvedValue(mockResult as any);

      mockReq.params = { slug: "my-workspace" };

      await requireWorkspace(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.membership?.role).toBe(Role.VIEWER);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should work for MEMBER role", async () => {
      const mockResult = {
        workspace: {
          id: "workspace_123",
          slug: "my-workspace",
          name: "My Workspace",
          plan: "FREE",
          deletedAt: null,
        },
        membership: {
          id: "membership_123",
          role: Role.MEMBER,
          joinedAt: new Date(),
        },
      };

      vi.mocked(workspaceRepository.findBySlugWithMembership).mockResolvedValue(mockResult as any);

      mockReq.params = { slug: "my-workspace" };

      await requireWorkspace(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.membership?.role).toBe(Role.MEMBER);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should work for ADMIN role", async () => {
      const mockResult = {
        workspace: {
          id: "workspace_123",
          slug: "my-workspace",
          name: "My Workspace",
          plan: "FREE",
          deletedAt: null,
        },
        membership: {
          id: "membership_123",
          role: Role.ADMIN,
          joinedAt: new Date(),
        },
      };

      vi.mocked(workspaceRepository.findBySlugWithMembership).mockResolvedValue(mockResult as any);

      mockReq.params = { slug: "my-workspace" };

      await requireWorkspace(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.membership?.role).toBe(Role.ADMIN);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should work for OWNER role", async () => {
      const mockResult = {
        workspace: {
          id: "workspace_123",
          slug: "my-workspace",
          name: "My Workspace",
          plan: "FREE",
          deletedAt: null,
        },
        membership: {
          id: "membership_123",
          role: Role.OWNER,
          joinedAt: new Date(),
        },
      };

      vi.mocked(workspaceRepository.findBySlugWithMembership).mockResolvedValue(mockResult as any);

      mockReq.params = { slug: "my-workspace" };

      await requireWorkspace(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.membership?.role).toBe(Role.OWNER);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should return 404 if user is not authenticated", async () => {
      mockReq.user = undefined;
      mockReq.params = { slug: "my-workspace" };

      await requireWorkspace(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
        })
      );
    });

    it("should return 404 if slug is missing", async () => {
      mockReq.params = {};

      await requireWorkspace(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
        })
      );
    });
  });
});
