import { Role } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { requireRole, requireMinRole } from "@/middleware/rbac.middleware";
import { ForbiddenError } from "@/utils/errors";

describe("RBAC Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      membership: {
        id: "membership_123",
        role: Role.MEMBER,
        joinedAt: new Date(),
      },
    };
    mockRes = {};
    mockNext = vi.fn();
  });

  describe("requireRole", () => {
    it("should allow access if user has OWNER role", () => {
      mockReq.membership = {
        id: "membership_123",
        role: Role.OWNER,
        joinedAt: new Date(),
      };

      const middleware = requireRole(Role.OWNER);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should block access if OWNER required but user is ADMIN", () => {
      mockReq.membership = {
        id: "membership_123",
        role: Role.ADMIN,
        joinedAt: new Date(),
      };

      const middleware = requireRole(Role.OWNER);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: "Insufficient permissions",
        })
      );

      const error = (mockNext as any).mock.calls[0][0];
      expect(error).toBeInstanceOf(ForbiddenError);
    });

    it("should block access if OWNER required but user is MEMBER", () => {
      mockReq.membership = {
        id: "membership_123",
        role: Role.MEMBER,
        joinedAt: new Date(),
      };

      const middleware = requireRole(Role.OWNER);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
        })
      );
    });

    it("should block access if OWNER required but user is VIEWER", () => {
      mockReq.membership = {
        id: "membership_123",
        role: Role.VIEWER,
        joinedAt: new Date(),
      };

      const middleware = requireRole(Role.OWNER);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
        })
      );
    });

    it("should allow access if ADMIN required and user is OWNER", () => {
      mockReq.membership = {
        id: "membership_123",
        role: Role.OWNER,
        joinedAt: new Date(),
      };

      const middleware = requireRole(Role.OWNER, Role.ADMIN);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should allow access if ADMIN required and user is ADMIN", () => {
      mockReq.membership = {
        id: "membership_123",
        role: Role.ADMIN,
        joinedAt: new Date(),
      };

      const middleware = requireRole(Role.OWNER, Role.ADMIN);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should block access if ADMIN required but user is MEMBER", () => {
      mockReq.membership = {
        id: "membership_123",
        role: Role.MEMBER,
        joinedAt: new Date(),
      };

      const middleware = requireRole(Role.OWNER, Role.ADMIN);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
        })
      );
    });

    it("should block access if ADMIN required but user is VIEWER", () => {
      mockReq.membership = {
        id: "membership_123",
        role: Role.VIEWER,
        joinedAt: new Date(),
      };

      const middleware = requireRole(Role.OWNER, Role.ADMIN);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
        })
      );
    });

    it("should work with multiple allowed roles", () => {
      mockReq.membership = {
        id: "membership_123",
        role: Role.MEMBER,
        joinedAt: new Date(),
      };

      const middleware = requireRole(Role.OWNER, Role.ADMIN, Role.MEMBER);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should throw error if membership is missing", () => {
      mockReq.membership = undefined;

      const middleware = requireRole(Role.OWNER);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: "Access denied",
        })
      );
    });
  });

  describe("requireMinRole", () => {
    it("should allow MEMBER minimum for MEMBER", () => {
      mockReq.membership = {
        id: "membership_123",
        role: Role.MEMBER,
        joinedAt: new Date(),
      };

      const middleware = requireMinRole(Role.MEMBER);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should allow MEMBER minimum for ADMIN", () => {
      mockReq.membership = {
        id: "membership_123",
        role: Role.ADMIN,
        joinedAt: new Date(),
      };

      const middleware = requireMinRole(Role.MEMBER);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should allow MEMBER minimum for OWNER", () => {
      mockReq.membership = {
        id: "membership_123",
        role: Role.OWNER,
        joinedAt: new Date(),
      };

      const middleware = requireMinRole(Role.MEMBER);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should block MEMBER minimum for VIEWER", () => {
      mockReq.membership = {
        id: "membership_123",
        role: Role.VIEWER,
        joinedAt: new Date(),
      };

      const middleware = requireMinRole(Role.MEMBER);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: "Insufficient permissions",
        })
      );
    });

    it("should allow ADMIN minimum for ADMIN", () => {
      mockReq.membership = {
        id: "membership_123",
        role: Role.ADMIN,
        joinedAt: new Date(),
      };

      const middleware = requireMinRole(Role.ADMIN);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should allow ADMIN minimum for OWNER", () => {
      mockReq.membership = {
        id: "membership_123",
        role: Role.OWNER,
        joinedAt: new Date(),
      };

      const middleware = requireMinRole(Role.ADMIN);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should block ADMIN minimum for MEMBER", () => {
      mockReq.membership = {
        id: "membership_123",
        role: Role.MEMBER,
        joinedAt: new Date(),
      };

      const middleware = requireMinRole(Role.ADMIN);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
        })
      );
    });

    it("should block ADMIN minimum for VIEWER", () => {
      mockReq.membership = {
        id: "membership_123",
        role: Role.VIEWER,
        joinedAt: new Date(),
      };

      const middleware = requireMinRole(Role.ADMIN);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
        })
      );
    });

    it("should enforce hierarchy correctly (OWNER > ADMIN > MEMBER > VIEWER)", () => {
      // Test that OWNER has highest permissions
      mockReq.membership = {
        id: "membership_123",
        role: Role.OWNER,
        joinedAt: new Date(),
      };

      let middleware = requireMinRole(Role.VIEWER);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();

      vi.clearAllMocks();

      // Test that VIEWER has lowest permissions
      mockReq.membership = {
        id: "membership_123",
        role: Role.VIEWER,
        joinedAt: new Date(),
      };

      middleware = requireMinRole(Role.OWNER);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
        })
      );
    });

    it("should throw error if membership is missing", () => {
      mockReq.membership = undefined;

      const middleware = requireMinRole(Role.MEMBER);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: "Access denied",
        })
      );
    });
  });
});
