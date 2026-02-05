import { PrismaClient, Role } from "@prisma/client";
import request from "supertest";
import { describe, it, expect, beforeEach, afterAll } from "vitest";

import { createApp } from "@/app";
import { generateAccessToken } from "@/utils/jwt";
import { hashPassword } from "@/utils/password";

const app = createApp();
const prisma = new PrismaClient();

describe("Workspace Routes Integration Tests", () => {
  let userToken: string;
  let userId: string;
  let user2Token: string;
  let user2Id: string;

  // Clean up database before each test
  beforeEach(async () => {
    await prisma.membership.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    // Create first test user
    const password = await hashPassword("SecurePass123!");
    const user = await prisma.user.create({
      data: {
        email: "user1@example.com",
        password,
        name: "User One",
        emailVerified: true,
      },
    });
    userId = user.id;

    // Generate token for user
    // Note: workspaceId is not used for POST /workspaces, but required by JWT payload
    userToken = generateAccessToken({
      userId: userId,
      workspaceId: "none",
      role: Role.OWNER,
    });

    // Create second test user for isolation tests
    const user2 = await prisma.user.create({
      data: {
        email: "user2@example.com",
        password,
        name: "User Two",
        emailVerified: true,
      },
    });
    user2Id = user2.id;

    user2Token = generateAccessToken({
      userId: user2Id,
      workspaceId: "none",
      role: Role.OWNER,
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/v1/workspaces", () => {
    it("should create workspace with auto-generated slug", async () => {
      const response = await request(app)
        .post("/api/v1/workspaces")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          name: "My Test Workspace",
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.workspace).toBeDefined();
      expect(response.body.data.workspace.name).toBe("My Test Workspace");
      expect(response.body.data.workspace.slug).toMatch(/^my-test-workspace/);
      expect(response.body.data.workspace.plan).toBe("FREE");
      expect(response.body.data.membership).toBeDefined();
      expect(response.body.data.membership.role).toBe(Role.OWNER);

      // Verify workspace was created in database
      const workspace = await prisma.workspace.findUnique({
        where: { slug: response.body.data.workspace.slug },
      });
      expect(workspace).not.toBeNull();
      expect(workspace?.name).toBe("My Test Workspace");
    });

    it("should create workspace with custom slug", async () => {
      const response = await request(app)
        .post("/api/v1/workspaces")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          name: "Custom Workspace",
          slug: "my-custom-slug",
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.workspace.slug).toBe("my-custom-slug");

      // Verify in database
      const workspace = await prisma.workspace.findUnique({
        where: { slug: "my-custom-slug" },
      });
      expect(workspace).not.toBeNull();
    });

    it("should reject duplicate slug", async () => {
      // Create first workspace
      await request(app)
        .post("/api/v1/workspaces")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          name: "First Workspace",
          slug: "duplicate-slug",
        })
        .expect(201);

      // Try to create second workspace with same slug
      const response = await request(app)
        .post("/api/v1/workspaces")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          name: "Second Workspace",
          slug: "duplicate-slug",
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("Workspace slug already taken");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/v1/workspaces")
        .send({
          name: "Test Workspace",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it("should reject invalid name (too short)", async () => {
      const response = await request(app)
        .post("/api/v1/workspaces")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          name: "A",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject invalid slug format", async () => {
      const response = await request(app)
        .post("/api/v1/workspaces")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          name: "Test Workspace",
          slug: "Invalid Slug!",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/workspaces", () => {
    it("should list user's workspaces with correct roles", async () => {
      // Create multiple workspaces
      await request(app)
        .post("/api/v1/workspaces")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "Workspace One" });

      await request(app)
        .post("/api/v1/workspaces")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "Workspace Two" });

      const response = await request(app)
        .get("/api/v1/workspaces")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
      // Response format: { workspace: {...}, role: Role, joinedAt: Date }
      expect(response.body.data[0].workspace).toBeDefined();
      expect(response.body.data[0].role).toBe(Role.OWNER);
      expect(response.body.meta.pagination).toBeDefined();
    });

    it("should support pagination", async () => {
      // Create multiple workspaces
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post("/api/v1/workspaces")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ name: `Workspace ${i}` });
      }

      // Get first page
      const page1 = await request(app)
        .get("/api/v1/workspaces?page=1&limit=2")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(page1.body.data.length).toBe(2);
      expect(page1.body.meta.pagination.page).toBe(1);
      expect(page1.body.meta.pagination.limit).toBe(2);
      expect(page1.body.meta.pagination.hasMore).toBe(true);

      // Get second page
      const page2 = await request(app)
        .get("/api/v1/workspaces?page=2&limit=2")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(page2.body.data.length).toBe(2);
      expect(page2.body.meta.pagination.page).toBe(2);
    });

    it("should return empty array for user with no workspaces", async () => {
      const response = await request(app)
        .get("/api/v1/workspaces")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(0);
    });

    it("should require authentication", async () => {
      const response = await request(app).get("/api/v1/workspaces").expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/workspaces/:slug", () => {
    let workspaceSlug: string;

    beforeEach(async () => {
      // Create a workspace
      const response = await request(app)
        .post("/api/v1/workspaces")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "Test Workspace" });

      workspaceSlug = response.body.data.workspace.slug;
    });

    it("should allow member to access workspace", async () => {
      const response = await request(app)
        .get(`/api/v1/workspaces/${workspaceSlug}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe(workspaceSlug);
      expect(response.body.data.name).toBe("Test Workspace");
      expect(response.body.data.memberCount).toBeDefined();
      expect(response.body.data.memberCount).toBe(1);
    });

    it("should return 404 for non-member", async () => {
      // User2 tries to access User1's workspace
      const response = await request(app)
        .get(`/api/v1/workspaces/${workspaceSlug}`)
        .set("Authorization", `Bearer ${user2Token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("Workspace not found");
    });

    it("should return 404 for non-existent workspace", async () => {
      const response = await request(app)
        .get("/api/v1/workspaces/non-existent-slug")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it("should require authentication", async () => {
      const response = await request(app).get(`/api/v1/workspaces/${workspaceSlug}`).expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("PATCH /api/v1/workspaces/:slug", () => {
    let workspaceSlug: string;
    let workspaceId: string;

    beforeEach(async () => {
      // Create a workspace
      const response = await request(app)
        .post("/api/v1/workspaces")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "Test Workspace" });

      workspaceSlug = response.body.data.workspace.slug;
      workspaceId = response.body.data.workspace.id;
    });

    it("should allow ADMIN to update workspace", async () => {
      const response = await request(app)
        .patch(`/api/v1/workspaces/${workspaceSlug}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          name: "Updated Workspace Name",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Updated Workspace Name");

      // Verify in database
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });
      expect(workspace?.name).toBe("Updated Workspace Name");
    });

    it("should allow updating settings", async () => {
      const response = await request(app)
        .patch(`/api/v1/workspaces/${workspaceSlug}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          settings: {
            theme: "dark",
            notifications: true,
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.settings).toEqual({
        theme: "dark",
        notifications: true,
      });
    });

    it("should not allow MEMBER to update", async () => {
      // Add user2 as MEMBER
      await prisma.membership.create({
        data: {
          userId: user2Id,
          workspaceId,
          role: Role.MEMBER,
          invitedById: userId,
        },
      });

      const response = await request(app)
        .patch(`/api/v1/workspaces/${workspaceSlug}`)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({
          name: "Should Not Update",
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("Insufficient permissions");
    });

    it("should not allow VIEWER to update", async () => {
      // Add user2 as VIEWER
      await prisma.membership.create({
        data: {
          userId: user2Id,
          workspaceId,
          role: Role.VIEWER,
          invitedById: userId,
        },
      });

      const response = await request(app)
        .patch(`/api/v1/workspaces/${workspaceSlug}`)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({
          name: "Should Not Update",
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it("should return 404 for non-member", async () => {
      const response = await request(app)
        .patch(`/api/v1/workspaces/${workspaceSlug}`)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({
          name: "Should Not Update",
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .patch(`/api/v1/workspaces/${workspaceSlug}`)
        .send({
          name: "Should Not Update",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/v1/workspaces/:slug", () => {
    let workspaceSlug: string;
    let workspaceId: string;

    beforeEach(async () => {
      // Create a workspace
      const response = await request(app)
        .post("/api/v1/workspaces")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "Test Workspace" });

      workspaceSlug = response.body.data.workspace.slug;
      workspaceId = response.body.data.workspace.id;
    });

    it("should allow OWNER to delete with password", async () => {
      const response = await request(app)
        .delete(`/api/v1/workspaces/${workspaceSlug}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          password: "SecurePass123!",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain("deleted successfully");

      // Verify soft delete in database
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });
      expect(workspace?.deletedAt).not.toBeNull();
    });

    it("should reject deletion without password", async () => {
      const response = await request(app)
        .delete(`/api/v1/workspaces/${workspaceSlug}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject deletion with wrong password", async () => {
      const response = await request(app)
        .delete(`/api/v1/workspaces/${workspaceSlug}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          password: "WrongPassword123!",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("Invalid credentials");
    });

    it("should not allow ADMIN to delete", async () => {
      // Add user2 as ADMIN
      await prisma.membership.create({
        data: {
          userId: user2Id,
          workspaceId,
          role: Role.ADMIN,
          invitedById: userId,
        },
      });

      // Create user2 with known password
      await prisma.user.update({
        where: { id: user2Id },
        data: {
          password: await hashPassword("SecurePass123!"),
        },
      });

      const response = await request(app)
        .delete(`/api/v1/workspaces/${workspaceSlug}`)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({
          password: "SecurePass123!",
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it("should return 404 for non-member", async () => {
      const response = await request(app)
        .delete(`/api/v1/workspaces/${workspaceSlug}`)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({
          password: "SecurePass123!",
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .delete(`/api/v1/workspaces/${workspaceSlug}`)
        .send({
          password: "SecurePass123!",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
