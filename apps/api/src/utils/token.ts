import { randomBytes } from "crypto";

/**
 * Generates a cryptographically secure random token.
 *
 * @param bytes - Number of random bytes (default: 32)
 * @returns URL-safe base64-encoded token string
 */
export function generateRandomToken(bytes: number = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/**
 * Calculates the expiration time for a token.
 *
 * @param hours - Number of hours until expiration
 * @returns Date object representing expiration time
 */
export function getTokenExpiration(hours: number): Date {
  const now = new Date();
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}
