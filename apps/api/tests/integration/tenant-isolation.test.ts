import { PrismaClient, Role } from "@prisma/client";
import request from "supertest";
import { describe, it, expect, beforeEach, afterAll } from "vitest";

import { createApp } from "@/app";
import { generateAccessToken } from "@/utils/jwt";
import { hashPassword } from "@/utils/password";

const app = createApp();
const prisma = new PrismaClient();

/**
 * Critical Security Tests: Tenant Isolation
 *
 * These tests verify that multi-tenancy boundaries are enforced correctly.
 * A failure in any of these tests represents a CRITICAL SECURITY VULNERABILITY.
 *
 * Test Scenarios:
 * 1. Cross-tenant access prevention
 * 2. List isolation (users only see their workspaces)
 * 3. Membership boundaries
 * 4. Role enforcement
 * 5. Soft delete isolation
 * 6. Information leakage prevention
 */
describe("Tenant Isolation Tests (CRITICAL SECURITY)", () => {
  let userAToken: string;
  let userAId: string;
  let userBToken: string;
  let userBId: string;
  let workspaceASlug: string;
  let workspaceAId: string;
  let workspaceBSlug: string;
  let workspaceBId: string;

  beforeEach(async () => {
    // Clean database
    await prisma.membership.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    // Create User A
    const password = await hashPassword("SecurePass123!");
    const userA = await prisma.user.create({
      data: {
        email: "userA@example.com",
        password,
        name: "User A",
        emailVerified: true,
      },
    });
    userAId = userA.id;
    userAToken = generateAccessToken({
      userId: userAId,
      workspaceId: "none",
      role: Role.OWNER,
    });

    // Create User B
    const userB = await prisma.user.create({
      data: {
        email: "userB@example.com",
        password,
        name: "User B",
        emailVerified: true,
      },
    });
    userBId = userB.id;
    userBToken = generateAccessToken({
      userId: userBId,
      workspaceId: "none",
      role: Role.OWNER,
    });

    // User A creates Workspace A
    const workspaceAResponse = await request(app)
      .post("/api/v1/workspaces")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ name: "Workspace A", slug: "workspace-a" });
    workspaceASlug = workspaceAResponse.body.data.workspace.slug;
    workspaceAId = workspaceAResponse.body.data.workspace.id;

    // User B creates Workspace B
    const workspaceBResponse = await request(app)
      .post("/api/v1/workspaces")
      .set("Authorization", `Bearer ${userBToken}`)
      .send({ name: "Workspace B", slug: "workspace-b" });
    workspaceBSlug = workspaceBResponse.body.data.workspace.slug;
    workspaceBId = workspaceBResponse.body.data.workspace.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Cross-Tenant Access Prevention", () => {
    it("should prevent User A from accessing Workspace B", async () => {
      const response = await request(app)
        .get(`/api/v1/workspaces/${workspaceBSlug}`)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("Workspace not found");

      // CRITICAL: Must be 404, not 403 (prevents enumeration)
      expect(response.status).toBe(404);
    });

    it("should prevent User B from accessing Workspace A", async () => {
      const response = await request(app)
        .get(`/api/v1/workspaces/${workspaceASlug}`)
        .set("Authorization", `Bearer ${userBToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("Workspace not found");
      expect(response.status).toBe(404);
    });

    it("should prevent User A from updating Workspace B", async () => {
      const response = await request(app)
        .patch(`/api/v1/workspaces/${workspaceBSlug}`)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ name: "Hacked Name" })
        .expect(404);

      expect(response.body.success).toBe(false);

      // Verify workspace was NOT updated
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceBId },
      });
      expect(workspace?.name).toBe("Workspace B");
    });

    it("should prevent User B from updating Workspace A", async () => {
      const response = await request(app)
        .patch(`/api/v1/workspaces/${workspaceASlug}`)
        .set("Authorization", `Bearer ${userBToken}`)
        .send({ name: "Hacked Name" })
        .expect(404);

      expect(response.body.success).toBe(false);

      // Verify workspace was NOT updated
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceAId },
      });
      expect(workspace?.name).toBe("Workspace A");
    });

    it("should prevent User A from deleting Workspace B", async () => {
      const response = await request(app)
        .delete(`/api/v1/workspaces/${workspaceBSlug}`)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ password: "SecurePass123!" })
        .expect(404);

      expect(response.body.success).toBe(false);

      // Verify workspace was NOT deleted
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceBId },
      });
      expect(workspace).not.toBeNull();
      expect(workspace?.deletedAt).toBeNull();
    });

    it("should prevent User B from deleting Workspace A", async () => {
      const response = await request(app)
        .delete(`/api/v1/workspaces/${workspaceASlug}`)
        .set("Authorization", `Bearer ${userBToken}`)
        .send({ password: "SecurePass123!" })
        .expect(404);

      expect(response.body.success).toBe(false);

      // Verify workspace was NOT deleted
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceAId },
      });
      expect(workspace).not.toBeNull();
      expect(workspace?.deletedAt).toBeNull();
    });
  });

  describe("List Isolation", () => {
    it("should only show User A their own workspaces", async () => {
      const response = await request(app)
        .get("/api/v1/workspaces")
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].workspace.slug).toBe(workspaceASlug);

      // CRITICAL: Should NOT see Workspace B
      const hasWorkspaceB = response.body.data.some(
        (w: any) => w.workspace.slug === workspaceBSlug
      );
      expect(hasWorkspaceB).toBe(false);
    });

    it("should only show User B their own workspaces", async () => {
      const response = await request(app)
        .get("/api/v1/workspaces")
        .set("Authorization", `Bearer ${userBToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].workspace.slug).toBe(workspaceBSlug);

      // CRITICAL: Should NOT see Workspace A
      const hasWorkspaceA = response.body.data.some(
        (w: any) => w.workspace.slug === workspaceASlug
      );
      expect(hasWorkspaceA).toBe(false);
    });
  });

  describe("Membership Boundary", () => {
    it("should allow access after User A invites User B to Workspace A", async () => {
      // Simulate invitation: Add User B as MEMBER to Workspace A
      await prisma.membership.create({
        data: {
          userId: userBId,
          workspaceId: workspaceAId,
          role: Role.MEMBER,
          invitedById: userAId,
        },
      });

      // Now User B should be able to access Workspace A
      const response = await request(app)
        .get(`/api/v1/workspaces/${workspaceASlug}`)
        .set("Authorization", `Bearer ${userBToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe(workspaceASlug);
    });

    it("should show workspace in list after membership is added", async () => {
      // Add User B as VIEWER to Workspace A
      await prisma.membership.create({
        data: {
          userId: userBId,
          workspaceId: workspaceAId,
          role: Role.VIEWER,
          invitedById: userAId,
        },
      });

      // User B should now see both workspaces
      const response = await request(app)
        .get("/api/v1/workspaces")
        .set("Authorization", `Bearer ${userBToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);

      const slugs = response.body.data.map((w: any) => w.workspace.slug);
      expect(slugs).toContain(workspaceASlug);
      expect(slugs).toContain(workspaceBSlug);
    });

    it("should still block access to non-member workspaces", async () => {
      // Add User B as MEMBER to Workspace A
      await prisma.membership.create({
        data: {
          userId: userBId,
          workspaceId: workspaceAId,
          role: Role.MEMBER,
          invitedById: userAId,
        },
      });

      // User A still should NOT access Workspace B
      const response = await request(app)
        .get(`/api/v1/workspaces/${workspaceBSlug}`)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("Role Enforcement", () => {
    beforeEach(async () => {
      // Add User B as MEMBER to Workspace A
      await prisma.membership.create({
        data: {
          userId: userBId,
          workspaceId: workspaceAId,
          role: Role.MEMBER,
          invitedById: userAId,
        },
      });
    });

    it("should prevent MEMBER from updating workspace", async () => {
      const response = await request(app)
        .patch(`/api/v1/workspaces/${workspaceASlug}`)
        .set("Authorization", `Bearer ${userBToken}`)
        .send({ name: "Should Fail" })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("Insufficient permissions");

      // Verify no update occurred
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceAId },
      });
      expect(workspace?.name).toBe("Workspace A");
    });

    it("should prevent MEMBER from deleting workspace", async () => {
      const response = await request(app)
        .delete(`/api/v1/workspaces/${workspaceASlug}`)
        .set("Authorization", `Bearer ${userBToken}`)
        .send({ password: "SecurePass123!" })
        .expect(403);

      expect(response.body.success).toBe(false);

      // Verify no deletion occurred
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceAId },
      });
      expect(workspace).not.toBeNull();
      expect(workspace?.deletedAt).toBeNull();
    });

    it("should allow ADMIN to update but not delete", async () => {
      // Change User B to ADMIN
      await prisma.membership.update({
        where: {
          userId_workspaceId: {
            userId: userBId,
            workspaceId: workspaceAId,
          },
        },
        data: {
          role: Role.ADMIN,
        },
      });

      // Should be able to update
      const updateResponse = await request(app)
        .patch(`/api/v1/workspaces/${workspaceASlug}`)
        .set("Authorization", `Bearer ${userBToken}`)
        .send({ name: "Updated by Admin" })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);

      // But NOT delete
      const deleteResponse = await request(app)
        .delete(`/api/v1/workspaces/${workspaceASlug}`)
        .set("Authorization", `Bearer ${userBToken}`)
        .send({ password: "SecurePass123!" })
        .expect(403);

      expect(deleteResponse.body.success).toBe(false);
    });

    it("should only allow OWNER to delete workspace", async () => {
      // User A (OWNER) should be able to delete
      const response = await request(app)
        .delete(`/api/v1/workspaces/${workspaceASlug}`)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ password: "SecurePass123!" })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deletion
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceAId },
      });
      expect(workspace?.deletedAt).not.toBeNull();
    });
  });

  describe("Soft Delete Isolation", () => {
    it("should return 404 for soft-deleted workspace", async () => {
      // Delete Workspace A
      await request(app)
        .delete(`/api/v1/workspaces/${workspaceASlug}`)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ password: "SecurePass123!" })
        .expect(200);

      // Try to access deleted workspace
      const response = await request(app)
        .get(`/api/v1/workspaces/${workspaceASlug}`)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.title).toContain("Workspace not found");
    });

    it("should not show soft-deleted workspace in list", async () => {
      // Delete Workspace A
      await request(app)
        .delete(`/api/v1/workspaces/${workspaceASlug}`)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ password: "SecurePass123!" })
        .expect(200);

      // List workspaces
      const response = await request(app)
        .get("/api/v1/workspaces")
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(0);

      // CRITICAL: Deleted workspace should NOT appear
      const hasDeletedWorkspace = response.body.data.some((w: any) => w.slug === workspaceASlug);
      expect(hasDeletedWorkspace).toBe(false);
    });

    it("should prevent updates to soft-deleted workspace", async () => {
      // Delete Workspace A
      await request(app)
        .delete(`/api/v1/workspaces/${workspaceASlug}`)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ password: "SecurePass123!" })
        .expect(200);

      // Try to update deleted workspace
      const response = await request(app)
        .patch(`/api/v1/workspaces/${workspaceASlug}`)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ name: "Should Fail" })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("Information Leakage Prevention", () => {
    it("should return same error for non-existent and non-member workspaces", async () => {
      // Access non-existent workspace
      const nonExistentResponse = await request(app)
        .get("/api/v1/workspaces/totally-fake-workspace")
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(404);

      // Access workspace user is not member of
      const nonMemberResponse = await request(app)
        .get(`/api/v1/workspaces/${workspaceBSlug}`)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(404);

      // CRITICAL: Both should return same error to prevent enumeration
      expect(nonExistentResponse.status).toBe(404);
      expect(nonMemberResponse.status).toBe(404);
      expect(nonExistentResponse.body.title).toBe(nonMemberResponse.body.title);
    });

    it("should not leak workspace existence through timing attacks (basic check)", async () => {
      // This is a basic check - production apps need more sophisticated timing analysis
      const start1 = Date.now();
      await request(app)
        .get("/api/v1/workspaces/non-existent")
        .set("Authorization", `Bearer ${userAToken}`);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await request(app)
        .get(`/api/v1/workspaces/${workspaceBSlug}`)
        .set("Authorization", `Bearer ${userAToken}`);
      const time2 = Date.now() - start2;

      // Times should be relatively similar (within 100ms)
      // Note: This is not a comprehensive timing attack test
      const timeDiff = Math.abs(time1 - time2);
      expect(timeDiff).toBeLessThan(100);
    });

    it("should return 404 for update attempts, not 403", async () => {
      // CRITICAL: Prevents workspace enumeration
      const response = await request(app)
        .patch(`/api/v1/workspaces/${workspaceBSlug}`)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ name: "Test" })
        .expect(404);

      // Should be 404 (not found), not 403 (forbidden)
      expect(response.status).toBe(404);
      expect(response.body.title).toContain("Workspace not found");
    });

    it("should return 404 for delete attempts, not 403", async () => {
      // CRITICAL: Prevents workspace enumeration
      const response = await request(app)
        .delete(`/api/v1/workspaces/${workspaceBSlug}`)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ password: "SecurePass123!" })
        .expect(404);

      // Should be 404 (not found), not 403 (forbidden)
      expect(response.status).toBe(404);
      expect(response.body.title).toContain("Workspace not found");
    });
  });
});
