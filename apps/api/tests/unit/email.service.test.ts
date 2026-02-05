import { Role } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { emailQueue } from "../../src/lib/queue";
import { emailService } from "../../src/services/email.service";

// Mock the email queue
vi.mock("../../src/lib/queue", () => ({
  emailQueue: {
    add: vi.fn(),
  },
}));

describe("EmailService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendInvitationEmail", () => {
    it("should queue invitation email with correct data", async () => {
      const to = "newmember@example.com";
      const workspaceName = "Acme Corp";
      const inviterName = "John Doe";
      const role = Role.MEMBER;
      const token = "invitation-token-123";

      await emailService.sendInvitationEmail(to, workspaceName, inviterName, role, token);

      expect(emailQueue.add).toHaveBeenCalledWith("invitation", {
        type: "INVITATION",
        to,
        data: {
          workspaceName,
          inviterName,
          role,
          invitationUrl: expect.stringContaining(`/invitations/${token}`),
        },
      });
      expect(emailQueue.add).toHaveBeenCalledTimes(1);
    });
  });

  describe("sendWelcomeEmail", () => {
    it("should queue welcome email with correct data", async () => {
      const to = "newmember@example.com";
      const workspaceName = "Acme Corp";
      const workspaceSlug = "acme-corp";

      await emailService.sendWelcomeEmail(to, workspaceName, workspaceSlug);

      expect(emailQueue.add).toHaveBeenCalledWith("welcome", {
        type: "WELCOME",
        to,
        data: {
          workspaceName,
          workspaceUrl: expect.stringContaining(`/workspaces/${workspaceSlug}`),
        },
      });
      expect(emailQueue.add).toHaveBeenCalledTimes(1);
    });
  });

  describe("sendRoleChangedEmail", () => {
    it("should queue role changed email with correct data", async () => {
      const to = "member@example.com";
      const workspaceName = "Acme Corp";
      const workspaceSlug = "acme-corp";
      const oldRole = Role.MEMBER;
      const newRole = Role.ADMIN;

      await emailService.sendRoleChangedEmail(to, workspaceName, workspaceSlug, oldRole, newRole);

      expect(emailQueue.add).toHaveBeenCalledWith("role-changed", {
        type: "ROLE_CHANGED",
        to,
        data: {
          workspaceName,
          oldRole,
          newRole,
          workspaceUrl: expect.stringContaining(`/workspaces/${workspaceSlug}`),
        },
      });
      expect(emailQueue.add).toHaveBeenCalledTimes(1);
    });
  });

  describe("sendMemberRemovedEmail", () => {
    it("should queue member removed email with correct data", async () => {
      const to = "removed@example.com";
      const workspaceName = "Acme Corp";

      await emailService.sendMemberRemovedEmail(to, workspaceName);

      expect(emailQueue.add).toHaveBeenCalledWith("member-removed", {
        type: "MEMBER_REMOVED",
        to,
        data: {
          workspaceName,
        },
      });
      expect(emailQueue.add).toHaveBeenCalledTimes(1);
    });
  });

  describe("sendVerificationEmail", () => {
    it("should queue verification email with correct data", async () => {
      const to = "user@example.com";
      const token = "verify-token-123";

      await emailService.sendVerificationEmail(to, token);

      expect(emailQueue.add).toHaveBeenCalledWith("verification", {
        type: "VERIFICATION",
        to,
        data: {
          verificationUrl: expect.stringContaining(`/verify-email?token=${token}`),
        },
      });
      expect(emailQueue.add).toHaveBeenCalledTimes(1);
    });
  });

  describe("sendPasswordResetEmail", () => {
    it("should queue password reset email with correct data", async () => {
      const to = "user@example.com";
      const token = "reset-token-123";

      await emailService.sendPasswordResetEmail(to, token);

      expect(emailQueue.add).toHaveBeenCalledWith("password-reset", {
        type: "PASSWORD_RESET",
        to,
        data: {
          resetUrl: expect.stringContaining(`/reset-password?token=${token}`),
        },
      });
      expect(emailQueue.add).toHaveBeenCalledTimes(1);
    });
  });
});
