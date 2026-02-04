import { describe, it, expect } from "vitest";

import { hashPassword, verifyPassword } from "@/utils/password";

describe("Password Utility", () => {
  const testPassword = "SecurePassword123!";

  describe("hashPassword", () => {
    it("should hash a password successfully", async () => {
      const hash = await hashPassword(testPassword);
      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
      expect(hash.length).toBeGreaterThan(0);
    });

    it("should produce different hashes for the same password (due to salt)", async () => {
      const hash1 = await hashPassword(testPassword);
      const hash2 = await hashPassword(testPassword);

      expect(hash1).not.toBe(hash2);
      expect(hash1).toBeDefined();
      expect(hash2).toBeDefined();
    });

    it("should produce Argon2id hashes", async () => {
      const hash = await hashPassword(testPassword);
      // Argon2id hashes start with $argon2id$
      expect(hash).toMatch(/^\$argon2id\$/);
    });
  });

  describe("verifyPassword", () => {
    it("should return true for correct password", async () => {
      const hash = await hashPassword(testPassword);
      const isValid = await verifyPassword(testPassword, hash);

      expect(isValid).toBe(true);
    });

    it("should return false for incorrect password", async () => {
      const hash = await hashPassword(testPassword);
      const isValid = await verifyPassword("WrongPassword123!", hash);

      expect(isValid).toBe(false);
    });

    it("should return false for invalid hash format", async () => {
      const isValid = await verifyPassword(testPassword, "invalid-hash");

      expect(isValid).toBe(false);
    });

    it("should use timing-safe comparison", async () => {
      const hash = await hashPassword(testPassword);

      // Measure time for correct password
      const start1 = Date.now();
      await verifyPassword(testPassword, hash);
      const time1 = Date.now() - start1;

      // Measure time for incorrect password
      const start2 = Date.now();
      await verifyPassword("WrongPassword123!", hash);
      const time2 = Date.now() - start2;

      // Times should be similar (within reasonable margin)
      // This is a basic check; true timing attack prevention is in Argon2 implementation
      expect(Math.abs(time1 - time2)).toBeLessThan(100);
    });

    it("should handle empty password gracefully", async () => {
      const hash = await hashPassword("");
      const isValid = await verifyPassword("", hash);

      expect(isValid).toBe(true);
    });
  });

  describe("hash/verify round-trip", () => {
    it("should correctly verify multiple passwords", async () => {
      const passwords = ["Password1!", "AnotherSecure@Pass2", "Complex$Password#123", "short"];

      for (const pwd of passwords) {
        const hash = await hashPassword(pwd);
        const isValid = await verifyPassword(pwd, hash);
        expect(isValid).toBe(true);
      }
    });
  });
});
