import { randomBytes } from "crypto";

/**
 * Converts text to a URL-friendly slug.
 *
 * Rules:
 * - Converts to lowercase
 * - Removes special characters (keeps alphanumeric and hyphens)
 * - Replaces spaces and underscores with hyphens
 * - Removes consecutive hyphens
 * - Trims hyphens from start and end
 *
 * @param text - The text to slugify
 * @returns URL-safe slug string
 *
 * @example
 * slugify("Acme Corp!")      // "acme-corp"
 * slugify("My  Company 123") // "my-company-123"
 * slugify("__test__")        // "test"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/-+/g, "-") // Remove consecutive hyphens
    .replace(/^-+|-+$/g, ""); // Trim hyphens from start and end
}

/**
 * Generates a random 4-character alphanumeric suffix.
 *
 * Used to ensure workspace slug uniqueness when the desired slug is taken.
 * Format: lowercase letters and numbers only (e.g., "x7k2", "a9b3")
 *
 * @returns 4-character random string
 *
 * @example
 * generateRandomSuffix() // "x7k2"
 * generateRandomSuffix() // "a9b3"
 */
export function generateRandomSuffix(): string {
  return randomBytes(2).toString("hex");
}
