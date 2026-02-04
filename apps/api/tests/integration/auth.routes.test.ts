import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { describe, it, expect, beforeEach, afterAll } from "vitest";

import { createApp } from "@/app";
import { hashPassword } from "@/utils/password";
import { generateRandomToken, getTokenExpiration } from "@/utils/token";

const app = createApp();
const prisma = new PrismaClient();

describe("Auth Routes Integration Tests", () => {
  // Clean up database before each test
  beforeEach(async () => {
    await prisma.passwordReset.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/v1/auth/register", () => {
    const validInput = {
      email: "test@example.com",
      password: "SecurePass123!",
      name: "Test User",
    };

    it("should register a new user successfully", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(validInput)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain("verification");

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: validInput.email },
      });
      expect(user).not.toBeNull();
      expect(user?.name).toBe(validInput.name);
      expect(user?.emailVerified).toBe(false);
      expect(user?.emailVerificationToken).not.toBeNull();
    });

    it("should reject duplicate email", async () => {
      // Create user first
      await request(app).post("/api/v1/auth/register").send(validInput);

      // Try to register again
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(validInput)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("Email already registered");
    });

    it("should reject invalid email format", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          ...validInput,
          email: "invalid-email",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject weak password", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          ...validInput,
          password: "weak",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject short name", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          ...validInput,
          name: "A",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/auth/verify-email", () => {
    it("should verify email with valid token", async () => {
      // Register user
      await request(app).post("/api/v1/auth/register").send({
        email: "verify@example.com",
        password: "SecurePass123!",
        name: "Verify User",
      });

      // Get verification token from database
      const user = await prisma.user.findUnique({
        where: { email: "verify@example.com" },
      });

      if (!user?.emailVerificationToken) {
        throw new Error("Verification token not found");
      }

      const token = user.emailVerificationToken;

      // Verify email
      const response = await request(app)
        .post("/api/v1/auth/verify-email")
        .send({ token })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain("verified");

      // Check user is verified
      const verifiedUser = await prisma.user.findUnique({
        where: { email: "verify@example.com" },
      });
      expect(verifiedUser?.emailVerified).toBe(true);
      expect(verifiedUser?.emailVerificationToken).toBeNull();
    });

    it("should reject invalid token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/verify-email")
        .send({ token: "invalid-token" })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    const userCredentials = {
      email: "login@example.com",
      password: "SecurePass123!",
      name: "Login User",
    };

    beforeEach(async () => {
      // Create and verify user
      await request(app).post("/api/v1/auth/register").send(userCredentials);

      const user = await prisma.user.findUnique({
        where: { email: userCredentials.email },
      });

      await prisma.user.update({
        where: { id: user?.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
        },
      });
    });

    it("should login with valid credentials", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: userCredentials.email,
          password: userCredentials.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.expiresIn).toBe(900);
    });

    it("should reject wrong password", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: userCredentials.email,
          password: "WrongPassword123!",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("Invalid credentials");
    });

    it("should reject non-existent user", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "SecurePass123!",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it("should reject unverified email", async () => {
      // Create unverified user
      await request(app).post("/api/v1/auth/register").send({
        email: "unverified@example.com",
        password: "SecurePass123!",
        name: "Unverified",
      });

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "unverified@example.com",
          password: "SecurePass123!",
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("Email not verified");
    });
  });

  describe("POST /api/v1/auth/refresh", () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Register and verify user
      await request(app).post("/api/v1/auth/register").send({
        email: "refresh@example.com",
        password: "SecurePass123!",
        name: "Refresh User",
      });

      const user = await prisma.user.findUnique({
        where: { email: "refresh@example.com" },
      });

      await prisma.user.update({
        where: { id: user?.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
        },
      });

      // Login to get refresh token
      const loginResponse = await request(app).post("/api/v1/auth/login").send({
        email: "refresh@example.com",
        password: "SecurePass123!",
      });

      refreshToken = loginResponse.body.data.refreshToken;
    });

    it("should refresh tokens with valid refresh token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.refreshToken).not.toBe(refreshToken); // New token
    });

    it("should reject invalid refresh token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: "invalid-token" })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it("should detect and revoke on token reuse", async () => {
      // Use refresh token once
      await request(app).post("/api/v1/auth/refresh").send({ refreshToken }).expect(200);

      // Try to use old token again (should be revoked)
      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("Token reuse");
    });
  });

  describe("POST /api/v1/auth/forgot-password", () => {
    it("should always return success (prevent enumeration)", async () => {
      const response = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "nonexistent@example.com" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain("If an account exists");
    });

    it("should create reset token for existing user", async () => {
      // Create user
      const password = await hashPassword("SecurePass123!");
      await prisma.user.create({
        data: {
          email: "reset@example.com",
          password,
          name: "Reset User",
          emailVerified: true,
        },
      });

      await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "reset@example.com" })
        .expect(200);

      // Check reset token was created
      const user = await prisma.user.findUnique({
        where: { email: "reset@example.com" },
        include: { passwordResets: true },
      });

      expect(user?.passwordResets.length).toBeGreaterThan(0);
    });
  });

  describe("POST /api/v1/auth/reset-password", () => {
    let resetToken: string;
    let userId: string;

    beforeEach(async () => {
      // Create user
      const password = await hashPassword("OldPass123!");
      const user = await prisma.user.create({
        data: {
          email: "resetpw@example.com",
          password,
          name: "Reset PW User",
          emailVerified: true,
        },
      });
      userId = user.id;

      // Create reset token
      resetToken = generateRandomToken(32);
      await prisma.passwordReset.create({
        data: {
          userId,
          token: resetToken,
          expiresAt: getTokenExpiration(1),
        },
      });

      // Create a session to test revocation
      await prisma.session.create({
        data: {
          userId,
          refreshToken: "test-refresh-token",
          expiresAt: getTokenExpiration(24 * 7),
        },
      });
    });

    it("should reset password with valid token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({
          token: resetToken,
          password: "NewSecure456!",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain("reset successfully");

      // Verify password was updated (try login with new password)
      const verifiedUser = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(verifiedUser?.password).not.toBeNull();

      // Verify all sessions were revoked
      const sessions = await prisma.session.findMany({
        where: { userId, revokedAt: null },
      });
      expect(sessions.length).toBe(0);
    });

    it("should reject invalid token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({
          token: "invalid-token",
          password: "NewSecure456!",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject weak new password", async () => {
      const response = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({
          token: resetToken,
          password: "weak",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
