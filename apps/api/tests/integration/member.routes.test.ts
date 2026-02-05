import { PrismaClient, Role } from "@prisma/client";
import request from "supertest";
import { describe, it, expect, beforeEach, afterAll } from "vitest";

import { createApp } from "@/app";
import { generateAccessToken } from "@/utils/jwt";
import { hashPassword } from "@/utils/password";

const app = createApp();
const prisma = new PrismaClient();

describe("Member Routes Integration Tests", () => {
  let ownerToken: string;
  let ownerId: string;
  let ownerPassword: string;
  let adminToken: string;
  let adminId: string;
  let _admin2Token: string;
  let admin2Id: string;
  let memberToken: string;
  let memberId: string;
  let viewerToken: string;
  let viewerId: string;
  let nonMemberToken: string;
  let nonMemberId: string;
  let workspaceSlug: string;
  let workspaceId: string;

  // Clean up database before each test
  beforeEach(async () => {
    await prisma.membership.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    ownerPassword = "SecurePass123!";
    const password = await hashPassword(ownerPassword);

    // Create users
    const owner = await prisma.user.create({
      data: {
        email: "owner@example.com",
        password,
        name: "Owner User",
        emailVerified: true,
      },
    });
    ownerId = owner.id;

    const admin = await prisma.user.create({
      data: {
        email: "admin@example.com",
        password,
        name: "Admin User",
        emailVerified: true,
      },
    });
    adminId = admin.id;

    const admin2 = await prisma.user.create({
      data: {
        email: "admin2@example.com",
        password,
        name: "Admin Two",
        emailVerified: true,
      },
    });
    admin2Id = admin2.id;

    const member = await prisma.user.create({
      data: {
        email: "member@example.com",
        password,
        name: "Member User",
        emailVerified: true,
      },
    });
    memberId = member.id;

    const viewer = await prisma.user.create({
      data: {
        email: "viewer@example.com",
        password,
        name: "Viewer User",
        emailVerified: true,
      },
    });
    viewerId = viewer.id;

    const nonMember = await prisma.user.create({
      data: {
        email: "nonmember@example.com",
        password,
        name: "Non Member",
        emailVerified: true,
      },
    });
    nonMemberId = nonMember.id;

    // Create workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: "Test Workspace",
        slug: "test-workspace",
      },
    });
    workspaceId = workspace.id;
    workspaceSlug = workspace.slug;

    // Create memberships
    await prisma.membership.create({
      data: {
        userId: ownerId,
        workspaceId,
        role: Role.OWNER,
      },
    });

    await prisma.membership.create({
      data: {
        userId: adminId,
        workspaceId,
        role: Role.ADMIN,
        invitedById: ownerId,
      },
    });

    await prisma.membership.create({
      data: {
        userId: admin2Id,
        workspaceId,
        role: Role.ADMIN,
        invitedById: ownerId,
      },
    });

    await prisma.membership.create({
      data: {
        userId: memberId,
        workspaceId,
        role: Role.MEMBER,
        invitedById: ownerId,
      },
    });

    await prisma.membership.create({
      data: {
        userId: viewerId,
        workspaceId,
        role: Role.VIEWER,
        invitedById: ownerId,
      },
    });

    // Generate tokens
    ownerToken = generateAccessToken({
      userId: ownerId,
      workspaceId,
      role: Role.OWNER,
    });

    adminToken = generateAccessToken({
      userId: adminId,
      workspaceId,
      role: Role.ADMIN,
    });

    _admin2Token = generateAccessToken({
      userId: admin2Id,
      workspaceId,
      role: Role.ADMIN,
    });

    memberToken = generateAccessToken({
      userId: memberId,
      workspaceId,
      role: Role.MEMBER,
    });

    viewerToken = generateAccessToken({
      userId: viewerId,
      workspaceId,
      role: Role.VIEWER,
    });

    nonMemberToken = generateAccessToken({
      userId: nonMemberId,
      workspaceId: "none",
      role: Role.OWNER,
    });
  });

  afterAll(async () => {
    // Final cleanup
    await prisma.membership.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe("GET /api/v1/workspaces/:slug/members", () => {
    it("should allow any member to list members", async () => {
      const response = await request(app)
        .get(`/api/v1/workspaces/${workspaceSlug}/members`)
        .set("Authorization", `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(5); // owner, 2 admins, member, viewer
      expect(response.body.data[0].user).toBeDefined();
      expect(response.body.data[0].role).toBeDefined();
      expect(response.body.data[0].joinedAt).toBeDefined();
    });

    it("should support pagination", async () => {
      const response = await request(app)
        .get(`/api/v1/workspaces/${workspaceSlug}/members?page=1&limit=2`)
        .set("Authorization", `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.meta.pagination).toBeDefined();
      expect(response.body.meta.pagination.page).toBe(1);
      expect(response.body.meta.pagination.limit).toBe(2);
      expect(response.body.meta.pagination.hasMore).toBe(true);
    });

    it("should support search filter by name", async () => {
      const response = await request(app)
        .get(`/api/v1/workspaces/${workspaceSlug}/members?search=Owner`)
        .set("Authorization", `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].user.name).toContain("Owner");
    });

    it("should support search filter by email", async () => {
      const response = await request(app)
        .get(`/api/v1/workspaces/${workspaceSlug}/members?search=admin@`)
        .set("Authorization", `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].user.email).toContain("admin@");
    });

    it("should support role filter", async () => {
      const response = await request(app)
        .get(`/api/v1/workspaces/${workspaceSlug}/members?role=ADMIN`)
        .set("Authorization", `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0].role).toBe(Role.ADMIN);
      expect(response.body.data[1].role).toBe(Role.ADMIN);
    });

    it("should reject when non-member tries to list (404)", async () => {
      const response = await request(app)
        .get(`/api/v1/workspaces/${workspaceSlug}/members`)
        .set("Authorization", `Bearer ${nonMemberToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("Workspace not found");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .get(`/api/v1/workspaces/${workspaceSlug}/members`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("PATCH /api/v1/workspaces/:slug/members/:id", () => {
    it("should allow ADMIN to update MEMBER role", async () => {
      const membership = await prisma.membership.findFirst({
        where: { userId: memberId, workspaceId },
      });

      const response = await request(app)
        .patch(`/api/v1/workspaces/${workspaceSlug}/members/${membership!.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          role: Role.VIEWER,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe(Role.VIEWER);

      // Verify in database
      const updatedMembership = await prisma.membership.findUnique({
        where: { id: membership!.id },
      });
      expect(updatedMembership?.role).toBe(Role.VIEWER);
    });

    it("should allow OWNER to update roles", async () => {
      const membership = await prisma.membership.findFirst({
        where: { userId: memberId, workspaceId },
      });

      const response = await request(app)
        .patch(`/api/v1/workspaces/${workspaceSlug}/members/${membership!.id}`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          role: Role.ADMIN,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe(Role.ADMIN);
    });

    it("should reject when ADMIN tries to modify OWNER (403)", async () => {
      const ownerMembership = await prisma.membership.findFirst({
        where: { userId: ownerId, workspaceId },
      });

      const response = await request(app)
        .patch(`/api/v1/workspaces/${workspaceSlug}/members/${ownerMembership!.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          role: Role.MEMBER,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("workspace owner");
    });

    it("should reject when ADMIN tries to promote to OWNER (403)", async () => {
      const membership = await prisma.membership.findFirst({
        where: { userId: memberId, workspaceId },
      });

      const response = await request(app)
        .patch(`/api/v1/workspaces/${workspaceSlug}/members/${membership!.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          role: Role.OWNER,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject when ADMIN tries to modify another ADMIN (403)", async () => {
      const admin2Membership = await prisma.membership.findFirst({
        where: { userId: admin2Id, workspaceId },
      });

      const response = await request(app)
        .patch(`/api/v1/workspaces/${workspaceSlug}/members/${admin2Membership!.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          role: Role.MEMBER,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("cannot modify other admins");
    });

    it("should reject when MEMBER tries to update role (403)", async () => {
      const viewerMembership = await prisma.membership.findFirst({
        where: { userId: viewerId, workspaceId },
      });

      const response = await request(app)
        .patch(`/api/v1/workspaces/${workspaceSlug}/members/${viewerMembership!.id}`)
        .set("Authorization", `Bearer ${memberToken}`)
        .send({
          role: Role.MEMBER,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("Insufficient permissions");
    });

    it("should require authentication", async () => {
      const membership = await prisma.membership.findFirst({
        where: { userId: memberId, workspaceId },
      });

      const response = await request(app)
        .patch(`/api/v1/workspaces/${workspaceSlug}/members/${membership!.id}`)
        .send({
          role: Role.ADMIN,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/v1/workspaces/:slug/members/:id", () => {
    it("should allow ADMIN to remove MEMBER", async () => {
      const membership = await prisma.membership.findFirst({
        where: { userId: memberId, workspaceId },
      });

      const response = await request(app)
        .delete(`/api/v1/workspaces/${workspaceSlug}/members/${membership!.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain("removed");

      // Verify membership was deleted
      const deletedMembership = await prisma.membership.findUnique({
        where: { id: membership!.id },
      });
      expect(deletedMembership).toBeNull();
    });

    it("should allow OWNER to remove members", async () => {
      const membership = await prisma.membership.findFirst({
        where: { userId: adminId, workspaceId },
      });

      const response = await request(app)
        .delete(`/api/v1/workspaces/${workspaceSlug}/members/${membership!.id}`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it("should reject when ADMIN tries to remove OWNER (403)", async () => {
      const ownerMembership = await prisma.membership.findFirst({
        where: { userId: ownerId, workspaceId },
      });

      const response = await request(app)
        .delete(`/api/v1/workspaces/${workspaceSlug}/members/${ownerMembership!.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("workspace owner");
    });

    it("should reject when ADMIN tries to remove another ADMIN (403)", async () => {
      const admin2Membership = await prisma.membership.findFirst({
        where: { userId: admin2Id, workspaceId },
      });

      const response = await request(app)
        .delete(`/api/v1/workspaces/${workspaceSlug}/members/${admin2Membership!.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("cannot remove other admins");
    });

    it("should reject when MEMBER tries to remove (403)", async () => {
      const viewerMembership = await prisma.membership.findFirst({
        where: { userId: viewerId, workspaceId },
      });

      const response = await request(app)
        .delete(`/api/v1/workspaces/${workspaceSlug}/members/${viewerMembership!.id}`)
        .set("Authorization", `Bearer ${memberToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("Insufficient permissions");
    });

    it("should require authentication", async () => {
      const membership = await prisma.membership.findFirst({
        where: { userId: memberId, workspaceId },
      });

      const response = await request(app)
        .delete(`/api/v1/workspaces/${workspaceSlug}/members/${membership!.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/workspaces/:slug/leave", () => {
    it("should allow MEMBER to leave workspace", async () => {
      const response = await request(app)
        .post(`/api/v1/workspaces/${workspaceSlug}/leave`)
        .set("Authorization", `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain("left");

      // Verify membership was deleted
      const membership = await prisma.membership.findFirst({
        where: { userId: memberId, workspaceId },
      });
      expect(membership).toBeNull();
    });

    it("should allow ADMIN to leave workspace", async () => {
      const response = await request(app)
        .post(`/api/v1/workspaces/${workspaceSlug}/leave`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it("should allow VIEWER to leave workspace", async () => {
      const response = await request(app)
        .post(`/api/v1/workspaces/${workspaceSlug}/leave`)
        .set("Authorization", `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it("should reject when OWNER tries to leave (403)", async () => {
      const response = await request(app)
        .post(`/api/v1/workspaces/${workspaceSlug}/leave`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("owners cannot leave");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .post(`/api/v1/workspaces/${workspaceSlug}/leave`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/workspaces/:slug/transfer", () => {
    it("should allow OWNER to transfer ownership to existing member", async () => {
      const response = await request(app)
        .post(`/api/v1/workspaces/${workspaceSlug}/transfer`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          targetUserId: adminId,
          password: ownerPassword,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain("transferred");

      // Verify old owner is now ADMIN
      const oldOwnerMembership = await prisma.membership.findFirst({
        where: { userId: ownerId, workspaceId },
      });
      expect(oldOwnerMembership?.role).toBe(Role.ADMIN);

      // Verify new owner is OWNER
      const newOwnerMembership = await prisma.membership.findFirst({
        where: { userId: adminId, workspaceId },
      });
      expect(newOwnerMembership?.role).toBe(Role.OWNER);
    });

    it("should reject with wrong password (401)", async () => {
      const response = await request(app)
        .post(`/api/v1/workspaces/${workspaceSlug}/transfer`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          targetUserId: adminId,
          password: "WrongPassword123!",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("Invalid credentials");
    });

    it("should reject when target is not a member (404)", async () => {
      const response = await request(app)
        .post(`/api/v1/workspaces/${workspaceSlug}/transfer`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          targetUserId: nonMemberId,
          password: ownerPassword,
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("Target user is not a member");
    });

    it("should reject when non-OWNER tries to transfer (403)", async () => {
      const response = await request(app)
        .post(`/api/v1/workspaces/${workspaceSlug}/transfer`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          targetUserId: memberId,
          password: ownerPassword,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("Insufficient permissions");
    });

    it("should reject when password is missing", async () => {
      const response = await request(app)
        .post(`/api/v1/workspaces/${workspaceSlug}/transfer`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          targetUserId: adminId,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .post(`/api/v1/workspaces/${workspaceSlug}/transfer`)
        .send({
          targetUserId: adminId,
          password: ownerPassword,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
