import { randomBytes } from "crypto";

import { InvitationStatus, Role } from "@prisma/client";

import { invitationRepository } from "@/repositories/invitation.repository";
import { membershipRepository } from "@/repositories/membership.repository";
import { userRepository } from "@/repositories/user.repository";
import { workspaceRepository } from "@/repositories/workspace.repository";
import { auditService } from "@/services/audit.service";
import { emailService } from "@/services/email.service";
import { AuditActions } from "@/types/audit.types";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "@/utils/errors";
import { logger } from "@/utils/logger";

/**
 * Invitation service handling all invitation-related business logic
 */
export class InvitationService {
  /**
   * Sends an invitation to join a workspace
   */
  async sendInvitation(workspaceId: string, inviterId: string, email: string, role: Role) {
    // Verify inviter has ADMIN+ role
    const inviterMembership = await membershipRepository.findByUserAndWorkspace(
      inviterId,
      workspaceId
    );

    if (!inviterMembership) {
      throw new ForbiddenError("You are not a member of this workspace");
    }

    if (inviterMembership.role !== Role.OWNER && inviterMembership.role !== Role.ADMIN) {
      throw new ForbiddenError("Only workspace owners and admins can send invitations");
    }

    // Check if email is already a member
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      const existingMembership = await membershipRepository.findByUserAndWorkspace(
        existingUser.id,
        workspaceId
      );
      if (existingMembership) {
        throw new ConflictError("User is already a member of this workspace");
      }
    }

    // Check for pending invitation
    const pendingInvitation = await invitationRepository.findByEmailAndWorkspace(
      email,
      workspaceId
    );
    if (pendingInvitation) {
      throw new ConflictError("A pending invitation already exists for this email");
    }

    // Generate secure token
    const token = randomBytes(32).toString("hex");

    // Set expiry: 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation record
    const invitation = await invitationRepository.create({
      email,
      workspaceId,
      role,
      invitedById: inviterId,
      token,
      expiresAt,
    });

    // Get workspace and inviter details for email
    const workspace = await workspaceRepository.findById(workspaceId);
    const inviter = await userRepository.findById(inviterId);

    if (!workspace || !inviter) {
      throw new NotFoundError("Workspace or inviter");
    }

    // Queue invitation email
    await emailService.sendInvitationEmail(
      email,
      workspace.name,
      inviter.name || inviter.email,
      role,
      token
    );

    // Audit log
    auditService.log({
      workspaceId,
      actorId: inviterId,
      actorType: "user",
      action: AuditActions.MEMBER_INVITED,
      resourceType: "invitation",
      resourceId: invitation.id,
      metadata: {
        email,
        role,
      },
    });

    logger.info(
      {
        invitationId: invitation.id,
        email,
        workspaceId,
        role,
        inviterId,
      },
      "Invitation sent"
    );

    return invitation;
  }

  /**
   * Lists pending invitations for a workspace
   */
  async listPendingInvitations(workspaceId: string) {
    // Fetch pending invitations with inviter info
    const invitations = await invitationRepository.findPendingByWorkspace(workspaceId);

    logger.info(
      {
        workspaceId,
        count: invitations.length,
      },
      "Listed pending invitations"
    );

    return invitations;
  }

  /**
   * Revokes a pending invitation
   */
  async revokeInvitation(invitationId: string, workspaceId: string, actorId: string) {
    // Find invitation
    const invitation = await invitationRepository.findById(invitationId);
    if (!invitation) {
      throw new NotFoundError("Invitation");
    }

    // Verify invitation belongs to workspace
    if (invitation.workspaceId !== workspaceId) {
      throw new BadRequestError("Invitation does not belong to this workspace");
    }

    // Verify actor has ADMIN+ role
    const actorMembership = await membershipRepository.findByUserAndWorkspace(actorId, workspaceId);

    if (!actorMembership) {
      throw new ForbiddenError("You are not a member of this workspace");
    }

    if (actorMembership.role !== Role.OWNER && actorMembership.role !== Role.ADMIN) {
      throw new ForbiddenError("Only workspace owners and admins can revoke invitations");
    }

    // Update status to REVOKED
    await invitationRepository.updateStatus(invitationId, InvitationStatus.REVOKED);

    logger.info(
      {
        invitationId,
        workspaceId,
        actorId,
      },
      "Invitation revoked"
    );

    return {
      message: "Invitation revoked successfully",
    };
  }

  /**
   * Accepts an invitation
   * If userId is provided, creates membership immediately
   * If not, returns invitation details for new user registration flow
   */
  async acceptInvitation(token: string, userId?: string) {
    // Find invitation by token
    const invitation = await invitationRepository.findByToken(token);
    if (!invitation) {
      throw new NotFoundError("Invitation");
    }

    // Validate not expired
    if (invitation.expiresAt < new Date()) {
      throw new BadRequestError("Invitation has expired");
    }

    // Validate not already used or revoked
    if (invitation.status === InvitationStatus.ACCEPTED) {
      throw new BadRequestError("Invitation has already been accepted");
    }

    if (invitation.status === InvitationStatus.REVOKED) {
      throw new BadRequestError("Invitation has been revoked");
    }

    // If userId provided (existing user accepting)
    if (userId) {
      // Verify user not already member
      const existingMembership = await membershipRepository.findByUserAndWorkspace(
        userId,
        invitation.workspaceId
      );
      if (existingMembership) {
        throw new ConflictError("You are already a member of this workspace");
      }

      // Create membership
      const membership = await membershipRepository.create({
        userId,
        workspaceId: invitation.workspaceId,
        role: invitation.role,
        invitedById: invitation.invitedById,
      });

      // Update invitation status
      await invitationRepository.updateStatus(invitation.id, InvitationStatus.ACCEPTED);

      // Get workspace details
      const workspace = await workspaceRepository.findById(invitation.workspaceId);
      if (!workspace) {
        throw new NotFoundError("Workspace");
      }

      // Queue welcome email
      await emailService.sendWelcomeEmail(invitation.email, workspace.name, workspace.slug);

      // Audit log
      auditService.log({
        workspaceId: invitation.workspaceId,
        actorId: userId,
        actorType: "user",
        action: AuditActions.MEMBER_JOINED,
        resourceType: "membership",
        resourceId: membership.id,
        metadata: {
          email: invitation.email,
          role: invitation.role,
        },
      });

      logger.info(
        {
          invitationId: invitation.id,
          userId,
          workspaceId: invitation.workspaceId,
          role: invitation.role,
        },
        "Invitation accepted by existing user"
      );

      return {
        membership,
        workspace,
      };
    }

    // No userId - return invitation details for registration flow
    const workspace = await workspaceRepository.findById(invitation.workspaceId);
    if (!workspace) {
      throw new NotFoundError("Workspace");
    }

    logger.info(
      {
        invitationId: invitation.id,
        email: invitation.email,
      },
      "Invitation details retrieved for new user registration"
    );

    return {
      invitation: {
        email: invitation.email,
        workspaceName: workspace.name,
        role: invitation.role,
      },
    };
  }

  /**
   * Gets invitation details by token (for registration flow)
   */
  async getInvitationDetails(token: string) {
    // Find invitation by token
    const invitation = await invitationRepository.findByToken(token);
    if (!invitation) {
      throw new NotFoundError("Invitation");
    }

    // Validate not expired
    if (invitation.expiresAt < new Date()) {
      throw new BadRequestError("Invitation has expired");
    }

    // Validate not already used or revoked
    if (invitation.status === InvitationStatus.ACCEPTED) {
      throw new BadRequestError("Invitation has already been accepted");
    }

    if (invitation.status === InvitationStatus.REVOKED) {
      throw new BadRequestError("Invitation has been revoked");
    }

    // Get workspace details
    const workspace = await workspaceRepository.findById(invitation.workspaceId);
    if (!workspace) {
      throw new NotFoundError("Workspace");
    }

    return {
      email: invitation.email,
      workspaceName: workspace.name,
      workspaceSlug: workspace.slug,
      role: invitation.role,
    };
  }
}

export const invitationService = new InvitationService();
