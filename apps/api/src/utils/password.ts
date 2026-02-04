import argon2 from "argon2";

/**
 * Configuration for Argon2id password hashing
 * - memoryCost: 64MB (65536 KiB)
 * - timeCost: 3 iterations
 * - parallelism: 4 threads
 */
const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,
  parallelism: 4,
};

/**
 * Hashes a plain text password using Argon2id.
 *
 * @param password - The plain text password to hash
 * @returns The hashed password as a string
 * @throws Error if hashing fails
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await argon2.hash(password, ARGON2_OPTIONS);
    return hash;
  } catch (error) {
    throw new Error("Failed to hash password");
  }
}

/**
 * Verifies a plain text password against a hash using Argon2id.
 * Uses timing-safe comparison to prevent timing attacks.
 *
 * @param password - The plain text password to verify
 * @param hash - The hash to verify against
 * @returns True if the password matches the hash, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    // If verification fails (e.g., invalid hash format), return false
    return false;
  }
}
