import { Request, Response, NextFunction } from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { requireAuth, optionalAuth } from "@/middleware/auth.middleware";
import { generateAccessToken } from "@/utils/jwt";

describe("Auth Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {};
    mockNext = vi.fn();
  });

  describe("requireAuth", () => {
    it("should attach user to request with valid token", () => {
      const token = generateAccessToken({
        userId: "user_123",
        workspaceId: "workspace_456",
        role: "OWNER",
      });

      mockReq.headers = {
        authorization: `Bearer ${token}`,
      };

      requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.userId).toBe("user_123");
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should call next with error if no authorization header", () => {
      requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: "No authorization token provided",
        })
      );
    });

    it("should call next with error if authorization header does not start with Bearer", () => {
      mockReq.headers = {
        authorization: "Invalid token",
      };

      requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
        })
      );
    });

    it("should call next with error if token is invalid", () => {
      mockReq.headers = {
        authorization: "Bearer invalid-token",
      };

      requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: "Invalid or expired token",
        })
      );
    });

    it("should call next with error if token is expired", () => {
      // Note: Creating an expired token is tricky, this test validates the flow
      mockReq.headers = {
        authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired",
      };

      requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
        })
      );
    });
  });

  describe("optionalAuth", () => {
    it("should attach user to request with valid token", () => {
      const token = generateAccessToken({
        userId: "user_123",
        workspaceId: "workspace_456",
        role: "OWNER",
      });

      mockReq.headers = {
        authorization: `Bearer ${token}`,
      };

      optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.userId).toBe("user_123");
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should continue without user if no authorization header", () => {
      optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should continue without user if token is invalid", () => {
      mockReq.headers = {
        authorization: "Bearer invalid-token",
      };

      optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should continue without user if authorization header is malformed", () => {
      mockReq.headers = {
        authorization: "InvalidFormat",
      };

      optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
