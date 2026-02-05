import { PrismaClient, Role, InvitationStatus } from "@prisma/client";
import request from "supertest";
import { describe, it, expect, beforeEach, afterAll } from "vitest";

import { createApp } from "@/app";
import { generateAccessToken } from "@/utils/jwt";
import { hashPassword } from "@/utils/password";

const app = createApp();
const prisma = new PrismaClient();

describe("Invitation Routes Integration Tests", () => {
  let ownerToken: string;
  let ownerId: string;
  let adminToken: string;
  let adminId: string;
  let memberToken: string;
  let memberId: string;
  let nonMemberToken: string;
  let nonMemberId: string;
  let workspaceSlug: string;
  let workspaceId: string;

  // Clean up database before each test
  beforeEach(async () => {
    await prisma.invitation.deleteMany();
    await prisma.membership.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    const password = await hashPassword("SecurePass123!");

    // Create owner user
    const owner = await prisma.user.create({
      data: {
        email: "owner@example.com",
        password,
        name: "Owner User",
        emailVerified: true,
      },
    });
    ownerId = owner.id;

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: "admin@example.com",
        password,
        name: "Admin User",
        emailVerified: true,
      },
    });
    adminId = admin.id;

    // Create member user
    const member = await prisma.user.create({
      data: {
        email: "member@example.com",
        password,
        name: "Member User",
        emailVerified: true,
      },
    });
    memberId = member.id;

    // Create non-member user
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
        userId: memberId,
        workspaceId,
        role: Role.MEMBER,
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

    memberToken = generateAccessToken({
      userId: memberId,
      workspaceId,
      role: Role.MEMBER,
    });

    nonMemberToken = generateAccessToken({
      userId: nonMemberId,
      workspaceId: "none",
      role: Role.OWNER,
    });
  });

  afterAll(async () => {
    // Final cleanup
    await prisma.invitation.deleteMany();
    await prisma.membership.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe("POST /api/v1/workspaces/:slug/invitations", () => {
    it("should allow ADMIN to send valid invitation", async () => {
      const response = await request(app)
        .post(`/api/v1/workspaces/${workspaceSlug}/invitations`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          email: "newuser@example.com",
          role: Role.MEMBER,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe("newuser@example.com");
      expect(response.body.data.role).toBe(Role.MEMBER);
      expect(response.body.data.status).toBe(InvitationStatus.PENDING);
      expect(response.body.data.token).toBeDefined();

      // Verify invitation was created in database
      const invitation = await prisma.invitation.findFirst({
        where: { email: "newuser@example.com", workspaceId },
      });
      expect(invitation).not.toBeNull();
      expect(invitation?.invitedById).toBe(adminId);
      expect(invitation?.id).toBe(response.body.data.id);
    });

    it("should allow OWNER to send valid invitation", async () => {
      const response = await request(app)
        .post(`/api/v1/workspaces/${workspaceSlug}/invitations`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          email: "newuser@example.com",
          role: Role.ADMIN,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe(Role.ADMIN);
    });

    it("should reject duplicate invitation (409)", async () => {
      // Create first invitation
      await request(app)
        .post(`/api/v1/workspaces/${workspaceSlug}/invitations`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          email: "duplicate@example.com",
          role: Role.MEMBER,
        })
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post(`/api/v1/workspaces/${workspaceSlug}/invitations`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          email: "duplicate@example.com",
          role: Role.VIEWER,
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("already exists");
    });

    it("should reject invitation for existing member (409)", async () => {
      const response = await request(app)
        .post(`/api/v1/workspaces/${workspaceSlug}/invitations`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          email: "member@example.com",
          role: Role.ADMIN,
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("User is already a member");
    });

    it("should reject invalid role", async () => {
      const response = await request(app)
        .post(`/api/v1/workspaces/${workspaceSlug}/invitations`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          email: "test@example.com",
          role: "INVALID_ROLE",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject when MEMBER tries to invite (403)", async () => {
      const response = await request(app)
        .post(`/api/v1/workspaces/${workspaceSlug}/invitations`)
        .set("Authorization", `Bearer ${memberToken}`)
        .send({
          email: "test@example.com",
          role: Role.MEMBER,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("Insufficient permissions");
    });

    it("should reject when non-member tries to invite (404)", async () => {
      const response = await request(app)
        .post(`/api/v1/workspaces/${workspaceSlug}/invitations`)
        .set("Authorization", `Bearer ${nonMemberToken}`)
        .send({
          email: "test@example.com",
          role: Role.MEMBER,
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("Workspace not found");
    });

    it("should reject invalid email format", async () => {
      const response = await request(app)
        .post(`/api/v1/workspaces/${workspaceSlug}/invitations`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          email: "invalid-email",
          role: Role.MEMBER,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .post(`/api/v1/workspaces/${workspaceSlug}/invitations`)
        .send({
          email: "test@example.com",
          role: Role.MEMBER,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/workspaces/:slug/invitations", () => {
    it("should allow ADMIN to list pending invitations", async () => {
      // Create test invitations
      await prisma.invitation.createMany({
        data: [
          {
            email: "user1@example.com",
            role: Role.MEMBER,
            workspaceId,
            invitedById: adminId,
            token: "token1",
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
          {
            email: "user2@example.com",
            role: Role.VIEWER,
            workspaceId,
            invitedById: ownerId,
            token: "token2",
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        ],
      });

      const response = await request(app)
        .get(`/api/v1/workspaces/${workspaceSlug}/invitations`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0].email).toBeDefined();
      expect(response.body.data[0].role).toBeDefined();
      expect(response.body.data[0].status).toBe(InvitationStatus.PENDING);
    });

    it("should allow OWNER to list pending invitations", async () => {
      await prisma.invitation.create({
        data: {
          email: "test@example.com",
          role: Role.ADMIN,
          workspaceId,
          invitedById: adminId,
          token: "test-token",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      const response = await request(app)
        .get(`/api/v1/workspaces/${workspaceSlug}/invitations`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
    });

    it("should filter out expired invitations", async () => {
      // Create expired invitation
      await prisma.invitation.create({
        data: {
          email: "expired@example.com",
          role: Role.MEMBER,
          workspaceId,
          invitedById: adminId,
          token: "expired-token",
          expiresAt: new Date(Date.now() - 1000), // Expired
        },
      });

      // Create valid invitation
      await prisma.invitation.create({
        data: {
          email: "valid@example.com",
          role: Role.MEMBER,
          workspaceId,
          invitedById: adminId,
          token: "valid-token",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      const response = await request(app)
        .get(`/api/v1/workspaces/${workspaceSlug}/invitations`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].email).toBe("valid@example.com");
    });

    it("should reject when MEMBER tries to list (403)", async () => {
      const response = await request(app)
        .get(`/api/v1/workspaces/${workspaceSlug}/invitations`)
        .set("Authorization", `Bearer ${memberToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("Insufficient permissions");
    });

    it("should return empty array when no pending invitations", async () => {
      const response = await request(app)
        .get(`/api/v1/workspaces/${workspaceSlug}/invitations`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(0);
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .get(`/api/v1/workspaces/${workspaceSlug}/invitations`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/v1/workspaces/:slug/invitations/:id", () => {
    let invitationId: string;

    beforeEach(async () => {
      const invitation = await prisma.invitation.create({
        data: {
          email: "revoke@example.com",
          role: Role.MEMBER,
          workspaceId,
          invitedById: adminId,
          token: "revoke-token",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      invitationId = invitation.id;
    });

    it("should allow ADMIN to revoke invitation", async () => {
      const response = await request(app)
        .delete(`/api/v1/workspaces/${workspaceSlug}/invitations/${invitationId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain("revoked");

      // Verify invitation was revoked
      const invitation = await prisma.invitation.findUnique({
        where: { id: invitationId },
      });
      expect(invitation?.status).toBe(InvitationStatus.REVOKED);
    });

    it("should allow OWNER to revoke invitation", async () => {
      const response = await request(app)
        .delete(`/api/v1/workspaces/${workspaceSlug}/invitations/${invitationId}`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it("should reject when MEMBER tries to revoke (403)", async () => {
      const response = await request(app)
        .delete(`/api/v1/workspaces/${workspaceSlug}/invitations/${invitationId}`)
        .set("Authorization", `Bearer ${memberToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("Insufficient permissions");
    });

    it("should return 404 for invalid invitation ID", async () => {
      const response = await request(app)
        .delete(`/api/v1/workspaces/${workspaceSlug}/invitations/clnexist123456789`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("Invitation not found");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .delete(`/api/v1/workspaces/${workspaceSlug}/invitations/${invitationId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/invitations/:token/accept", () => {
    let invitationToken: string;
    let newUserToken: string;
    let newUserId: string;

    beforeEach(async () => {
      // Create invitation
      const invitation = await prisma.invitation.create({
        data: {
          email: "newuser@example.com",
          role: Role.MEMBER,
          workspaceId,
          invitedById: adminId,
          token: "accept-token-123456",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      invitationToken = invitation.token;

      // Create new user for acceptance test
      const password = await hashPassword("SecurePass123!");
      const newUser = await prisma.user.create({
        data: {
          email: "newuser@example.com",
          password,
          name: "New User",
          emailVerified: true,
        },
      });
      newUserId = newUser.id;

      newUserToken = generateAccessToken({
        userId: newUserId,
        workspaceId: "none",
        role: Role.OWNER,
      });
    });

    it("should allow existing user to accept invitation (authenticated)", async () => {
      const response = await request(app)
        .post(`/api/v1/invitations/${invitationToken}/accept`)
        .set("Authorization", `Bearer ${newUserToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.membership).toBeDefined();
      expect(response.body.data.membership.role).toBe(Role.MEMBER);

      // Verify membership was created
      const membership = await prisma.membership.findFirst({
        where: { userId: newUserId, workspaceId },
      });
      expect(membership).not.toBeNull();

      // Verify invitation was accepted
      const invitation = await prisma.invitation.findUnique({
        where: { token: invitationToken },
      });
      expect(invitation?.status).toBe(InvitationStatus.ACCEPTED);
    });

    it("should allow new user to accept invitation (unauthenticated)", async () => {
      // Create invitation for non-existent user
      const newInvitation = await prisma.invitation.create({
        data: {
          email: "brandnew@example.com",
          role: Role.VIEWER,
          workspaceId,
          invitedById: adminId,
          token: "new-user-token",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      const response = await request(app)
        .post(`/api/v1/invitations/${newInvitation.token}/accept`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.invitation).toBeDefined();
      expect(response.body.data.invitation.email).toBe("brandnew@example.com");
      expect(response.body.data.invitation.workspaceName).toBeDefined();
      expect(response.body.data.invitation.role).toBe(Role.VIEWER);
    });

    it("should reject expired token (400)", async () => {
      // Create expired invitation
      const expiredInvitation = await prisma.invitation.create({
        data: {
          email: "expired@example.com",
          role: Role.MEMBER,
          workspaceId,
          invitedById: adminId,
          token: "expired-token",
          expiresAt: new Date(Date.now() - 1000), // Expired
        },
      });

      const response = await request(app)
        .post(`/api/v1/invitations/${expiredInvitation.token}/accept`)
        .set("Authorization", `Bearer ${newUserToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("expired");
    });

    it("should reject revoked token (400)", async () => {
      // Create revoked invitation
      const revokedInvitation = await prisma.invitation.create({
        data: {
          email: "revoked@example.com",
          role: Role.MEMBER,
          workspaceId,
          invitedById: adminId,
          token: "revoked-token",
          status: InvitationStatus.REVOKED,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      const response = await request(app)
        .post(`/api/v1/invitations/${revokedInvitation.token}/accept`)
        .set("Authorization", `Bearer ${newUserToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("revoked");
    });

    it("should reject already accepted token (400)", async () => {
      // Accept invitation first time
      await request(app)
        .post(`/api/v1/invitations/${invitationToken}/accept`)
        .set("Authorization", `Bearer ${newUserToken}`)
        .expect(200);

      // Try to accept again
      const response = await request(app)
        .post(`/api/v1/invitations/${invitationToken}/accept`)
        .set("Authorization", `Bearer ${newUserToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("already");
    });

    it("should reject when user is already a member (409)", async () => {
      // User is already a member, trying to accept new invitation
      const memberInvitation = await prisma.invitation.create({
        data: {
          email: "member@example.com",
          role: Role.ADMIN,
          workspaceId,
          invitedById: ownerId,
          token: "member-invite-token",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      const response = await request(app)
        .post(`/api/v1/invitations/${memberInvitation.token}/accept`)
        .set("Authorization", `Bearer ${memberToken}`)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("already a member");
    });
  });

  describe("GET /api/v1/invitations/:token", () => {
    let invitationToken: string;

    beforeEach(async () => {
      const invitation = await prisma.invitation.create({
        data: {
          email: "details@example.com",
          role: Role.MEMBER,
          workspaceId,
          invitedById: adminId,
          token: "details-token-123",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      invitationToken = invitation.token;
    });

    it("should return invitation details for valid token", async () => {
      const response = await request(app).get(`/api/v1/invitations/${invitationToken}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe("details@example.com");
      expect(response.body.data.role).toBe(Role.MEMBER);
      expect(response.body.data.workspaceName).toBe("Test Workspace");
      expect(response.body.data.workspaceSlug).toBe("test-workspace");
    });

    it("should return 404 for invalid token", async () => {
      const response = await request(app).get("/api/v1/invitations/invalid-token-xyz").expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("Invitation not found");
    });

    it("should return 400 for expired token", async () => {
      const expiredInvitation = await prisma.invitation.create({
        data: {
          email: "expired@example.com",
          role: Role.MEMBER,
          workspaceId,
          invitedById: adminId,
          token: "expired-details-token",
          expiresAt: new Date(Date.now() - 1000),
        },
      });

      const response = await request(app)
        .get(`/api/v1/invitations/${expiredInvitation.token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("expired");
    });
  });
});
