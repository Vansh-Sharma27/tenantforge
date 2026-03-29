import { beforeAll, afterAll, beforeEach } from "vitest";

// Set test environment variables before importing anything else
process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5433/tenantforge_test";
process.env.JWT_SECRET = "test-jwt-secret-at-least-32-characters-long";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-at-least-32-characters-long";
// Use a test Stripe key (sk_test_ prefix required by Stripe SDK)
process.env.STRIPE_SECRET_KEY =
  process.env.STRIPE_SECRET_KEY || "sk_test_00000000000000000000000000000000000000000000000000";
process.env.STRIPE_WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET ||
  "whsec_test_00000000000000000000000000000000000000000000000000";
// Raise rate limits significantly for tests so requests don't get throttled
process.env.RATE_LIMIT_AUTH_POINTS = "10000";
process.env.RATE_LIMIT_GLOBAL_POINTS = "100000";
process.env.RATE_LIMIT_AUTH_DURATION = "1";

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
