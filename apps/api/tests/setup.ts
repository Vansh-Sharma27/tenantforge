import { beforeAll, afterAll, beforeEach } from "vitest";

// Set test environment variables before importing anything else
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/tenantforge_test";
process.env.JWT_SECRET = "test-jwt-secret-at-least-32-characters-long";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-at-least-32-characters-long";

beforeAll(async () => {
  // Global setup before all tests
  console.log("Starting test suite...");
});

afterAll(async () => {
  // Global cleanup after all tests
  console.log("Test suite completed.");
});

beforeEach(() => {
  // Reset mocks before each test
});
