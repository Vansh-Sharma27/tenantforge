import { randomBytes } from "crypto";

import jwt from "jsonwebtoken";

import { privateKey, publicKey } from "@/config/keys";

/**
 * Payload for access tokens
 */
export interface TokenPayload {
  userId: string;
  workspaceId?: string;
  role?: string;
}

/**
 * Payload for refresh tokens
 */
export interface RefreshPayload {
  userId: string;
  sessionId: string;
}

/**
 * JWT algorithm and expiration times
 */
const ALGORITHM = "RS256";
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

/**
 * Generates an access token with user and workspace context.
 *
 * @param payload - User ID, workspace ID, and role
 * @returns Signed JWT access token
 */
export function generateAccessToken(payload: TokenPayload): string {
  const jti = randomBytes(16).toString("hex"); // Unique token ID
  return jwt.sign(payload, privateKey, {
    algorithm: ALGORITHM,
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: "tenantforge",
    audience: "tenantforge-api",
    jwtid: jti,
  });
}

/**
 * Generates a refresh token for session management.
 *
 * @param payload - User ID and session ID
 * @returns Signed JWT refresh token
 */
export function generateRefreshToken(payload: RefreshPayload): string {
  const jti = randomBytes(16).toString("hex"); // Unique token ID
  return jwt.sign(payload, privateKey, {
    algorithm: ALGORITHM,
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: "tenantforge",
    audience: "tenantforge-api",
    jwtid: jti,
  });
}

/**
 * Verifies and decodes an access token.
 *
 * @param token - The JWT access token to verify
 * @returns Decoded token payload or null if invalid/expired
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, publicKey, {
      algorithms: [ALGORITHM],
      issuer: "tenantforge",
      audience: "tenantforge-api",
    }) as TokenPayload;

    return decoded;
  } catch (error) {
    // Token is invalid, expired, or has wrong signature
    return null;
  }
}

/**
 * Verifies and decodes a refresh token.
 *
 * @param token - The JWT refresh token to verify
 * @returns Decoded token payload or null if invalid/expired
 */
export function verifyRefreshToken(token: string): RefreshPayload | null {
  try {
    const decoded = jwt.verify(token, publicKey, {
      algorithms: [ALGORITHM],
      issuer: "tenantforge",
      audience: "tenantforge-api",
    }) as RefreshPayload;

    return decoded;
  } catch (error) {
    // Token is invalid, expired, or has wrong signature
    return null;
  }
}

/**
 * Access token expiry time in seconds (for API responses)
 */
export const ACCESS_TOKEN_EXPIRY_SECONDS = 900; // 15 minutes
