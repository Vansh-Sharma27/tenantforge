import { PrismaClient, Role } from "@prisma/client";

import { membershipRepository } from "@/repositories/membership.repository";
import { userRepository } from "@/repositories/user.repository";
import { auditService } from "@/services/audit.service";
import { emailService } from "@/services/email.service";
import { AuditActions } from "@/types/audit.types";
import { ROLE_HIERARCHY } from "@/types/workspace.types";
import { ForbiddenError, NotFoundError, UnauthorizedError, BadRequestError } from "@/utils/errors";
import { logger } from "@/utils/logger";
import { verifyPassword } from "@/utils/password";

const prisma = new PrismaClient();

/**
 * Options for listing members
 */
interface ListMembersOptions {
  page: number;
  limit: number;
  search?: string;
  role?: Role;
}

/**
 * Member service handling all member management business logic
 */
export class MemberService {
  /**
   * Lists members in a workspace with filtering and pagination
   */
  async listMembers(workspaceId: string, options: ListMembersOptions) {
    const { page, limit, search, role } = options;
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const whereClause: any = {
      workspaceId,
    };

    // Add role filter if provided
    if (role) {
      whereClause.role = role;
    }

    // Add search filter for user name or email
    if (search) {
      whereClause.user = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    // Fetch members with pagination
    const members = await prisma.membership.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            status: true,
          },
        },
      },
      orderBy: {
        joinedAt: "asc",
      },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.membership.count({
      where: whereClause,
    });

    const hasMore = skip + members.length < totalCount;

    logger.info(
      {
        workspaceId,
        count: members.length,
        totalCount,
        page,
        limit,
        search,
        role,
      },
      "Listed workspace members"
    );

    return {
      members,
      pagination: {
        page,
        limit,
        totalCount,
        hasMore,
      },
    };
  }

  /**
   * Updates a member's role
   * Validates RBAC rules and sends notification email
   */
  async updateMemberRole(
    membershipId: string,
    newRole: Role,
    actorMembership: { id: string; role: Role; workspaceId: string; userId: string }
  ) {
    // Find target membership
    const targetMembership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: {
        user: true,
        workspace: true,
      },
    });

    if (!targetMembership) {
      throw new NotFoundError("Member");
    }

    // Validate membership belongs to actor's workspace
    if (targetMembership.workspaceId !== actorMembership.workspaceId) {
      throw new ForbiddenError("Access denied");
    }

    // Validate cannot modify OWNER role
    if (targetMembership.role === Role.OWNER) {
      throw new ForbiddenError("Cannot modify workspace owner role");
    }

    // Validate cannot promote to OWNER
    if (newRole === Role.OWNER) {
      throw new ForbiddenError("Cannot promote to OWNER role. Use transfer ownership instead");
    }

    // Validate ADMIN cannot modify other ADMINs
    if (actorMembership.role === Role.ADMIN && targetMembership.role === Role.ADMIN) {
      throw new ForbiddenError("Admins cannot modify other admins");
    }

    // Validate role hierarchy for promotion/demotion
    if (actorMembership.role === Role.ADMIN) {
      const newRoleLevel = ROLE_HIERARCHY[newRole];
      const actorRoleLevel = ROLE_HIERARCHY[actorMembership.role];

      // ADMIN cannot promote to a role equal or higher than their own
      if (newRoleLevel >= actorRoleLevel) {
        throw new ForbiddenError("Cannot promote to this role");
      }
    }

    // Store old role for email notification
    const oldRole = targetMembership.role;

    // Update role
    const updatedMembership = await membershipRepository.updateRole(membershipId, newRole);

    // Queue role-changed email
    await emailService.sendRoleChangedEmail(
      targetMembership.user.email,
      targetMembership.workspace.name,
      targetMembership.workspace.slug,
      oldRole,
      newRole
    );

    // Audit log
    auditService.log({
      workspaceId: targetMembership.workspaceId,
      actorId: actorMembership.userId,
      actorType: "user",
      action: AuditActions.MEMBER_ROLE_CHANGED,
      resourceType: "membership",
      resourceId: membershipId,
      metadata: {
        targetUserId: targetMembership.userId,
        targetEmail: targetMembership.user.email,
        oldRole,
        newRole,
      },
    });

    logger.info(
      {
        membershipId,
        workspaceId: targetMembership.workspaceId,
        userId: targetMembership.userId,
        oldRole,
        newRole,
        actorUserId: actorMembership.userId,
      },
      "Member role updated"
    );

    return {
      ...updatedMembership,
      user: targetMembership.user,
    };
  }

  /**
   * Removes a member from a workspace
   * Validates RBAC rules and sends notification email
   */
  async removeMember(
    membershipId: string,
    workspaceId: string,
    actorMembership: { id: string; role: Role; userId: string }
  ) {
    // Find target membership
    const targetMembership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: {
        user: true,
        workspace: true,
      },
    });

    if (!targetMembership) {
      throw new NotFoundError("Member");
    }

    // Validate membership belongs to the workspace
    if (targetMembership.workspaceId !== workspaceId) {
      throw new ForbiddenError("Access denied");
    }

    // Validate cannot remove OWNER
    if (targetMembership.role === Role.OWNER) {
      throw new ForbiddenError("Cannot remove workspace owner. Transfer ownership first");
    }

    // Validate ADMIN cannot remove other ADMINs
    if (actorMembership.role === Role.ADMIN && targetMembership.role === Role.ADMIN) {
      throw new ForbiddenError("Admins cannot remove other admins");
    }

    // Delete membership
    await membershipRepository.delete(membershipId);

    // Queue member-removed email
    await emailService.sendMemberRemovedEmail(
      targetMembership.user.email,
      targetMembership.workspace.name
    );

    // Audit log
    auditService.log({
      workspaceId,
      actorId: actorMembership.userId,
      actorType: "user",
      action: AuditActions.MEMBER_REMOVED,
      resourceType: "membership",
      resourceId: membershipId,
      metadata: {
        targetUserId: targetMembership.userId,
        targetEmail: targetMembership.user.email,
        role: targetMembership.role,
      },
    });

    logger.info(
      {
        membershipId,
        workspaceId,
        userId: targetMembership.userId,
        actorUserId: actorMembership.userId,
      },
      "Member removed from workspace"
    );

    return {
      message: "Member removed successfully",
    };
  }

  /**
   * Allows a member to leave a workspace
   * Validates user is not the OWNER
   */
  async leaveWorkspace(userId: string, workspaceId: string) {
    // Find user's membership
    const membership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
      include: {
        workspace: true,
      },
    });

    if (!membership) {
      throw new NotFoundError("Membership");
    }

    // Validate user is not OWNER
    if (membership.role === Role.OWNER) {
      throw new ForbiddenError(
        "Workspace owners cannot leave. Transfer ownership first or delete the workspace"
      );
    }

    // Delete membership
    await membershipRepository.delete(membership.id);

    logger.info(
      {
        userId,
        workspaceId,
        role: membership.role,
      },
      "User left workspace"
    );

    return {
      message: "Successfully left workspace",
    };
  }

  /**
   * Transfers workspace ownership to another member
   * Requires password confirmation for security
   */
  async transferOwnership(
    workspaceId: string,
    currentOwnerId: string,
    targetUserId: string,
    password: string
  ) {
    // Verify current owner's password
    const currentOwner = await userRepository.findById(currentOwnerId);
    if (!currentOwner || !currentOwner.password) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const isPasswordValid = await verifyPassword(password, currentOwner.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Find current owner membership
    const currentOwnerMembership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: currentOwnerId,
          workspaceId,
        },
      },
    });

    if (!currentOwnerMembership || currentOwnerMembership.role !== Role.OWNER) {
      throw new ForbiddenError("Only workspace owner can transfer ownership");
    }

    // Find target membership
    const targetMembership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: targetUserId,
          workspaceId,
        },
      },
      include: {
        user: true,
        workspace: true,
      },
    });

    if (!targetMembership) {
      throw new NotFoundError("Target user is not a member of this workspace");
    }

    // Validate target is not already OWNER
    if (targetMembership.role === Role.OWNER) {
      throw new BadRequestError("Target user is already the owner");
    }

    // Use transaction to atomically update both memberships
    await prisma.$transaction([
      // Update target to OWNER
      prisma.membership.update({
        where: { id: targetMembership.id },
        data: { role: Role.OWNER },
      }),
      // Update current owner to ADMIN
      prisma.membership.update({
        where: { id: currentOwnerMembership.id },
        data: { role: Role.ADMIN },
      }),
    ]);

    // Queue notifications to both parties
    await emailService.sendRoleChangedEmail(
      targetMembership.user.email,
      targetMembership.workspace.name,
      targetMembership.workspace.slug,
      targetMembership.role,
      Role.OWNER
    );

    await emailService.sendRoleChangedEmail(
      currentOwner.email,
      targetMembership.workspace.name,
      targetMembership.workspace.slug,
      Role.OWNER,
      Role.ADMIN
    );

    logger.info(
      {
        workspaceId,
        previousOwnerId: currentOwnerId,
        newOwnerId: targetUserId,
      },
      "Ownership transferred"
    );

    return {
      message: "Ownership transferred successfully",
      newOwnerId: targetUserId,
    };
  }
}

export const memberService = new MemberService();
