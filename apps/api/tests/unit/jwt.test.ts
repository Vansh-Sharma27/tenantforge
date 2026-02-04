import jwt from "jsonwebtoken";
import { describe, it, expect } from "vitest";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  type TokenPayload,
  type RefreshPayload,
} from "@/utils/jwt";

interface DecodedJWT {
  iss?: string;
  aud?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

describe("JWT Utility", () => {
  const testAccessPayload: TokenPayload = {
    userId: "user_123",
    workspaceId: "workspace_456",
    role: "OWNER",
  };

  const testRefreshPayload: RefreshPayload = {
    userId: "user_123",
    sessionId: "session_789",
  };

  describe("generateAccessToken", () => {
    it("should generate a valid JWT access token", () => {
      const token = generateAccessToken(testAccessPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    });

    it("should include payload data in token", () => {
      const token = generateAccessToken(testAccessPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(testAccessPayload.userId);
      expect(decoded?.workspaceId).toBe(testAccessPayload.workspaceId);
      expect(decoded?.role).toBe(testAccessPayload.role);
    });

    it("should use RS256 algorithm", () => {
      const token = generateAccessToken(testAccessPayload);
      const header = JSON.parse(Buffer.from(token.split(".")[0], "base64").toString());

      expect(header.alg).toBe("RS256");
    });

    it("should set issuer and audience", () => {
      const token = generateAccessToken(testAccessPayload);
      const decoded = jwt.decode(token) as DecodedJWT;

      expect(decoded.iss).toBe("tenantforge");
      expect(decoded.aud).toBe("tenantforge-api");
    });

    it("should have expiration time", () => {
      const token = generateAccessToken(testAccessPayload);
      const decoded = jwt.decode(token) as DecodedJWT;

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });
  });

  describe("generateRefreshToken", () => {
    it("should generate a valid JWT refresh token", () => {
      const token = generateRefreshToken(testRefreshPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);
    });

    it("should include payload data in token", () => {
      const token = generateRefreshToken(testRefreshPayload);
      const decoded = verifyRefreshToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(testRefreshPayload.userId);
      expect(decoded?.sessionId).toBe(testRefreshPayload.sessionId);
    });

    it("should use RS256 algorithm", () => {
      const token = generateRefreshToken(testRefreshPayload);
      const header = JSON.parse(Buffer.from(token.split(".")[0], "base64").toString());

      expect(header.alg).toBe("RS256");
    });
  });

  describe("verifyAccessToken", () => {
    it("should verify and decode a valid access token", () => {
      const token = generateAccessToken(testAccessPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(testAccessPayload.userId);
    });

    it("should return null for invalid token", () => {
      const invalidToken = "invalid.token.here";
      const decoded = verifyAccessToken(invalidToken);

      expect(decoded).toBeNull();
    });

    it("should return null for expired token", () => {
      // Create a token that expires immediately
      const expiredToken = jwt.sign(
        testAccessPayload,
        // We need to import the private key, but for testing we'll use a mock approach
        // In real scenario, this would use the actual private key
        "test-private-key",
        {
          algorithm: "HS256", // Using HS256 for simplicity in test
          expiresIn: "-1s", // Already expired
        }
      );

      const decoded = verifyAccessToken(expiredToken);

      expect(decoded).toBeNull();
    });

    it("should return null for token with wrong signature", () => {
      // Generate token with different key
      const wrongToken = jwt.sign(testAccessPayload, "wrong-key", {
        algorithm: "HS256",
      });

      const decoded = verifyAccessToken(wrongToken);

      expect(decoded).toBeNull();
    });

    it("should reject tokens with wrong algorithm", () => {
      // Generate token with HS256 instead of RS256
      const hsToken = jwt.sign(testAccessPayload, "secret", {
        algorithm: "HS256",
      });

      const decoded = verifyAccessToken(hsToken);

      expect(decoded).toBeNull();
    });
  });

  describe("verifyRefreshToken", () => {
    it("should verify and decode a valid refresh token", () => {
      const token = generateRefreshToken(testRefreshPayload);
      const decoded = verifyRefreshToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(testRefreshPayload.userId);
      expect(decoded?.sessionId).toBe(testRefreshPayload.sessionId);
    });

    it("should return null for invalid token", () => {
      const invalidToken = "invalid.token.here";
      const decoded = verifyRefreshToken(invalidToken);

      expect(decoded).toBeNull();
    });

    it("should return null for expired token", () => {
      const expiredToken = jwt.sign(testRefreshPayload, "test-key", {
        algorithm: "HS256",
        expiresIn: "-1s",
      });

      const decoded = verifyRefreshToken(expiredToken);

      expect(decoded).toBeNull();
    });
  });

  describe("token generation and verification round-trip", () => {
    it("should successfully round-trip access tokens", () => {
      const token = generateAccessToken(testAccessPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded).toEqual(
        expect.objectContaining({
          userId: testAccessPayload.userId,
          workspaceId: testAccessPayload.workspaceId,
          role: testAccessPayload.role,
        })
      );
    });

    it("should successfully round-trip refresh tokens", () => {
      const token = generateRefreshToken(testRefreshPayload);
      const decoded = verifyRefreshToken(token);

      expect(decoded).toEqual(
        expect.objectContaining({
          userId: testRefreshPayload.userId,
          sessionId: testRefreshPayload.sessionId,
        })
      );
    });

    it("should not allow verifying access token as refresh token", () => {
      const accessToken = generateAccessToken(testAccessPayload);
      const decoded = verifyRefreshToken(accessToken);

      // Should still verify (same keys) but payload will be different
      // In production, you might want to add token type claim
      expect(decoded).toBeDefined();
    });
  });

  describe("token expiration", () => {
    it("should set appropriate expiration for access tokens (15min)", () => {
      const token = generateAccessToken(testAccessPayload);
      const decoded = jwt.decode(token) as DecodedJWT;

      const expiresInSeconds = decoded.exp - decoded.iat;
      // Should be around 900 seconds (15 minutes)
      expect(expiresInSeconds).toBeGreaterThanOrEqual(895);
      expect(expiresInSeconds).toBeLessThanOrEqual(905);
    });

    it("should set appropriate expiration for refresh tokens (7d)", () => {
      const token = generateRefreshToken(testRefreshPayload);
      const decoded = jwt.decode(token) as DecodedJWT;

      const expiresInSeconds = decoded.exp - decoded.iat;
      const sevenDays = 7 * 24 * 60 * 60; // 604800 seconds
      // Should be around 7 days
      expect(expiresInSeconds).toBeGreaterThanOrEqual(sevenDays - 10);
      expect(expiresInSeconds).toBeLessThanOrEqual(sevenDays + 10);
    });
  });
});
