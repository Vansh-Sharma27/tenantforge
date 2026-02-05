import type { Role } from "@prisma/client";

import { config } from "@/config";
import { emailQueue } from "@/lib/queue";
import { logger } from "@/utils/logger";

/**
 * Email service for queueing email jobs
 */
export class EmailService {
  /**
   * Send invitation email to a new member
   */
  async sendInvitationEmail(
    to: string,
    workspaceName: string,
    inviterName: string,
    role: Role,
    token: string
  ) {
    const invitationUrl = `${config.frontend.url}/invitations/${token}`;

    await emailQueue.add("invitation", {
      type: "INVITATION",
      to,
      data: {
        workspaceName,
        inviterName,
        role,
        invitationUrl,
      },
    });

    logger.info(
      {
        to,
        workspaceName,
        role,
      },
      "Invitation email queued"
    );
  }

  /**
   * Send welcome email when member accepts invitation
   */
  async sendWelcomeEmail(to: string, workspaceName: string, workspaceSlug: string) {
    const workspaceUrl = `${config.frontend.url}/workspaces/${workspaceSlug}`;

    await emailQueue.add("welcome", {
      type: "WELCOME",
      to,
      data: {
        workspaceName,
        workspaceUrl,
      },
    });

    logger.info(
      {
        to,
        workspaceName,
      },
      "Welcome email queued"
    );
  }

  /**
   * Send notification email when member role is changed
   */
  async sendRoleChangedEmail(
    to: string,
    workspaceName: string,
    workspaceSlug: string,
    oldRole: Role,
    newRole: Role
  ) {
    const workspaceUrl = `${config.frontend.url}/workspaces/${workspaceSlug}`;

    await emailQueue.add("role-changed", {
      type: "ROLE_CHANGED",
      to,
      data: {
        workspaceName,
        oldRole,
        newRole,
        workspaceUrl,
      },
    });

    logger.info(
      {
        to,
        workspaceName,
        oldRole,
        newRole,
      },
      "Role changed email queued"
    );
  }

  /**
   * Send notification email when member is removed from workspace
   */
  async sendMemberRemovedEmail(to: string, workspaceName: string) {
    await emailQueue.add("member-removed", {
      type: "MEMBER_REMOVED",
      to,
      data: {
        workspaceName,
      },
    });

    logger.info(
      {
        to,
        workspaceName,
      },
      "Member removed email queued"
    );
  }

  /**
   * Send email verification email (for future auth implementation)
   */
  async sendVerificationEmail(to: string, token: string) {
    const verificationUrl = `${config.frontend.url}/verify-email?token=${token}`;

    await emailQueue.add("verification", {
      type: "VERIFICATION",
      to,
      data: {
        verificationUrl,
      },
    });

    logger.info(
      {
        to,
      },
      "Verification email queued"
    );
  }

  /**
   * Send password reset email (for future auth implementation)
   */
  async sendPasswordResetEmail(to: string, token: string) {
    const resetUrl = `${config.frontend.url}/reset-password?token=${token}`;

    await emailQueue.add("password-reset", {
      type: "PASSWORD_RESET",
      to,
      data: {
        resetUrl,
      },
    });

    logger.info(
      {
        to,
      },
      "Password reset email queued"
    );
  }
}

export const emailService = new EmailService();
