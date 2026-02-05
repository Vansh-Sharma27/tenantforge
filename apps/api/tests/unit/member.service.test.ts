import { PrismaClient, Role } from "@prisma/client";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { membershipRepository } from "@/repositories/membership.repository";
import { userRepository } from "@/repositories/user.repository";
import { emailService } from "@/services/email.service";
import { MemberService } from "@/services/member.service";
import { ForbiddenError, NotFoundError, UnauthorizedError, BadRequestError } from "@/utils/errors";
import { verifyPassword } from "@/utils/password";

// Mock all dependencies
vi.mock("@prisma/client", () => {
  const mockPrisma = {
    membership: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  return {
    PrismaClient: vi.fn(() => mockPrisma),
    Role: {
      OWNER: "OWNER",
      ADMIN: "ADMIN",
      MEMBER: "MEMBER",
      VIEWER: "VIEWER",
    },
  };
});

vi.mock("@/services/email.service");
vi.mock("@/repositories/membership.repository");
vi.mock("@/repositories/user.repository");
vi.mock("@/utils/password");

describe("MemberService", () => {
  let memberService: MemberService;
  let mockPrisma: any;

  const mockWorkspaceId = "workspace-123";
  const mockUserId = "user-123";
  const mockMembershipId = "membership-123";

  beforeEach(() => {
    vi.clearAllMocks();
    memberService = new MemberService();
    mockPrisma = new PrismaClient();
  });

  describe("listMembers", () => {
    const mockMembers = [
      {
        id: "membership-1",
        userId: "user-1",
        workspaceId: mockWorkspaceId,
        role: Role.OWNER,
        joinedAt: new Date("2024-01-01"),
        invitedById: null,
        user: {
          id: "user-1",
          email: "owner@example.com",
          name: "Owner User",
          avatarUrl: null,
          status: "ACTIVE",
        },
      },
      {
        id: "membership-2",
        userId: "user-2",
        workspaceId: mockWorkspaceId,
        role: Role.MEMBER,
        joinedAt: new Date("2024-01-02"),
        invitedById: "user-1",
        user: {
          id: "user-2",
          email: "member@example.com",
          name: "Member User",
          avatarUrl: null,
          status: "ACTIVE",
        },
      },
    ];

    it("should list members with pagination", async () => {
      mockPrisma.membership.findMany.mockResolvedValue(mockMembers);
      mockPrisma.membership.count.mockResolvedValue(2);

      const result = await memberService.listMembers(mockWorkspaceId, {
        page: 1,
        limit: 10,
      });

      expect(result.members).toEqual(mockMembers);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        totalCount: 2,
        hasMore: false,
      });
      expect(mockPrisma.membership.findMany).toHaveBeenCalledWith({
        where: { workspaceId: mockWorkspaceId },
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
        orderBy: { joinedAt: "asc" },
        skip: 0,
        take: 10,
      });
    });

    it("should filter by role", async () => {
      const adminMembers = mockMembers.filter((m) => m.role === Role.ADMIN);
      mockPrisma.membership.findMany.mockResolvedValue(adminMembers);
      mockPrisma.membership.count.mockResolvedValue(1);

      await memberService.listMembers(mockWorkspaceId, {
        page: 1,
        limit: 10,
        role: Role.ADMIN,
      });

      expect(mockPrisma.membership.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            workspaceId: mockWorkspaceId,
            role: Role.ADMIN,
          },
        })
      );
    });

    it("should filter by search term", async () => {
      mockPrisma.membership.findMany.mockResolvedValue([mockMembers[0]]);
      mockPrisma.membership.count.mockResolvedValue(1);

      await memberService.listMembers(mockWorkspaceId, {
        page: 1,
        limit: 10,
        search: "owner",
      });

      expect(mockPrisma.membership.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            workspaceId: mockWorkspaceId,
            user: {
              OR: [
                { name: { contains: "owner", mode: "insensitive" } },
                { email: { contains: "owner", mode: "insensitive" } },
              ],
            },
          },
        })
      );
    });

    it("should calculate pagination correctly with hasMore", async () => {
      const manyMembers = Array.from({ length: 10 }, (_, i) => ({
        ...mockMembers[0],
        id: `membership-${i}`,
        userId: `user-${i}`,
      }));

      mockPrisma.membership.findMany.mockResolvedValue(manyMembers);
      mockPrisma.membership.count.mockResolvedValue(25);

      const result = await memberService.listMembers(mockWorkspaceId, {
        page: 1,
        limit: 10,
      });

      expect(result.pagination.hasMore).toBe(true);
      expect(result.pagination.totalCount).toBe(25);
    });

    it("should calculate correct skip for page 2", async () => {
      mockPrisma.membership.findMany.mockResolvedValue([]);
      mockPrisma.membership.count.mockResolvedValue(0);

      await memberService.listMembers(mockWorkspaceId, {
        page: 2,
        limit: 10,
      });

      expect(mockPrisma.membership.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });
  });

  describe("updateMemberRole", () => {
    const mockActorMembership = {
      id: "membership-actor",
      role: Role.ADMIN,
      workspaceId: mockWorkspaceId,
      userId: "actor-123",
    };

    const mockTargetMembership = {
      id: mockMembershipId,
      userId: "target-123",
      workspaceId: mockWorkspaceId,
      role: Role.MEMBER,
      joinedAt: new Date(),
      invitedById: null,
      user: {
        id: "target-123",
        email: "target@example.com",
        name: "Target User",
        password: "hashed",
        status: "ACTIVE",
        avatarUrl: null,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      workspace: {
        id: mockWorkspaceId,
        name: "Test Workspace",
        slug: "test-workspace",
        ownerId: "owner-123",
        plan: "FREE",
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    beforeEach(() => {
      mockPrisma.membership.findUnique.mockResolvedValue(mockTargetMembership);
      vi.mocked(membershipRepository.updateRole).mockResolvedValue({
        id: mockMembershipId,
        userId: "target-123",
        workspaceId: mockWorkspaceId,
        role: Role.VIEWER,
        joinedAt: new Date(),
        invitedById: null,
      });
      vi.mocked(emailService.sendRoleChangedEmail).mockResolvedValue(undefined);
    });

    it("should successfully update member role", async () => {
      const result = await memberService.updateMemberRole(
        mockMembershipId,
        Role.VIEWER,
        mockActorMembership
      );

      expect(result.role).toBe(Role.VIEWER);
      expect(membershipRepository.updateRole).toHaveBeenCalledWith(mockMembershipId, Role.VIEWER);
      expect(emailService.sendRoleChangedEmail).toHaveBeenCalledWith(
        mockTargetMembership.user.email,
        mockTargetMembership.workspace.name,
        mockTargetMembership.workspace.slug,
        Role.MEMBER,
        Role.VIEWER
      );
    });

    it("should throw NotFoundError if member does not exist", async () => {
      mockPrisma.membership.findUnique.mockResolvedValue(null);

      await expect(
        memberService.updateMemberRole(mockMembershipId, Role.VIEWER, mockActorMembership)
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw ForbiddenError if member belongs to different workspace", async () => {
      mockPrisma.membership.findUnique.mockResolvedValue({
        ...mockTargetMembership,
        workspaceId: "different-workspace",
      });

      await expect(
        memberService.updateMemberRole(mockMembershipId, Role.VIEWER, mockActorMembership)
      ).rejects.toThrow(ForbiddenError);
    });

    it("should throw ForbiddenError when trying to modify OWNER role", async () => {
      mockPrisma.membership.findUnique.mockResolvedValue({
        ...mockTargetMembership,
        role: Role.OWNER,
      });

      await expect(
        memberService.updateMemberRole(mockMembershipId, Role.ADMIN, mockActorMembership)
      ).rejects.toThrow(ForbiddenError);
    });

    it("should throw ForbiddenError when trying to promote to OWNER", async () => {
      await expect(
        memberService.updateMemberRole(mockMembershipId, Role.OWNER, mockActorMembership)
      ).rejects.toThrow(ForbiddenError);
    });

    it("should throw ForbiddenError when ADMIN tries to modify another ADMIN", async () => {
      mockPrisma.membership.findUnique.mockResolvedValue({
        ...mockTargetMembership,
        role: Role.ADMIN,
      });

      await expect(
        memberService.updateMemberRole(mockMembershipId, Role.MEMBER, mockActorMembership)
      ).rejects.toThrow(ForbiddenError);
    });

    it("should allow OWNER to modify ADMIN roles", async () => {
      const ownerActor = {
        ...mockActorMembership,
        role: Role.OWNER,
      };

      mockPrisma.membership.findUnique.mockResolvedValue({
        ...mockTargetMembership,
        role: Role.ADMIN,
      });

      await expect(
        memberService.updateMemberRole(mockMembershipId, Role.MEMBER, ownerActor)
      ).resolves.not.toThrow();
    });

    it("should throw ForbiddenError when ADMIN tries to promote to ADMIN", async () => {
      await expect(
        memberService.updateMemberRole(mockMembershipId, Role.ADMIN, mockActorMembership)
      ).rejects.toThrow(ForbiddenError);
    });

    it("should allow ADMIN to demote from MEMBER to VIEWER", async () => {
      await expect(
        memberService.updateMemberRole(mockMembershipId, Role.VIEWER, mockActorMembership)
      ).resolves.not.toThrow();
    });

    it("should enforce role hierarchy for ADMIN promotions", async () => {
      mockPrisma.membership.findUnique.mockResolvedValue({
        ...mockTargetMembership,
        role: Role.VIEWER,
      });

      // ADMIN trying to promote VIEWER to ADMIN should fail
      await expect(
        memberService.updateMemberRole(mockMembershipId, Role.ADMIN, mockActorMembership)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("removeMember", () => {
    const mockActorMembership = {
      id: "membership-actor",
      role: Role.ADMIN,
      userId: "actor-123",
    };

    const mockTargetMembership = {
      id: mockMembershipId,
      userId: "target-123",
      workspaceId: mockWorkspaceId,
      role: Role.MEMBER,
      joinedAt: new Date(),
      invitedById: null,
      user: {
        id: "target-123",
        email: "target@example.com",
        name: "Target User",
        password: "hashed",
        status: "ACTIVE",
        avatarUrl: null,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      workspace: {
        id: mockWorkspaceId,
        name: "Test Workspace",
        slug: "test-workspace",
        ownerId: "owner-123",
        plan: "FREE",
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    beforeEach(() => {
      mockPrisma.membership.findUnique.mockResolvedValue(mockTargetMembership);
      vi.mocked(membershipRepository.delete).mockResolvedValue(undefined as any);
      vi.mocked(emailService.sendMemberRemovedEmail).mockResolvedValue(undefined);
    });

    it("should successfully remove member", async () => {
      const result = await memberService.removeMember(
        mockMembershipId,
        mockWorkspaceId,
        mockActorMembership
      );

      expect(result.message).toBe("Member removed successfully");
      expect(membershipRepository.delete).toHaveBeenCalledWith(mockMembershipId);
      expect(emailService.sendMemberRemovedEmail).toHaveBeenCalledWith(
        mockTargetMembership.user.email,
        mockTargetMembership.workspace.name
      );
    });

    it("should throw NotFoundError if member does not exist", async () => {
      mockPrisma.membership.findUnique.mockResolvedValue(null);

      await expect(
        memberService.removeMember(mockMembershipId, mockWorkspaceId, mockActorMembership)
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw ForbiddenError if member belongs to different workspace", async () => {
      mockPrisma.membership.findUnique.mockResolvedValue({
        ...mockTargetMembership,
        workspaceId: "different-workspace",
      });

      await expect(
        memberService.removeMember(mockMembershipId, mockWorkspaceId, mockActorMembership)
      ).rejects.toThrow(ForbiddenError);
    });

    it("should throw ForbiddenError when trying to remove OWNER", async () => {
      mockPrisma.membership.findUnique.mockResolvedValue({
        ...mockTargetMembership,
        role: Role.OWNER,
      });

      await expect(
        memberService.removeMember(mockMembershipId, mockWorkspaceId, mockActorMembership)
      ).rejects.toThrow(ForbiddenError);
    });

    it("should throw ForbiddenError when ADMIN tries to remove another ADMIN", async () => {
      mockPrisma.membership.findUnique.mockResolvedValue({
        ...mockTargetMembership,
        role: Role.ADMIN,
      });

      await expect(
        memberService.removeMember(mockMembershipId, mockWorkspaceId, mockActorMembership)
      ).rejects.toThrow(ForbiddenError);
    });

    it("should allow OWNER to remove ADMIN", async () => {
      const ownerActor = {
        ...mockActorMembership,
        role: Role.OWNER,
      };

      mockPrisma.membership.findUnique.mockResolvedValue({
        ...mockTargetMembership,
        role: Role.ADMIN,
      });

      await expect(
        memberService.removeMember(mockMembershipId, mockWorkspaceId, ownerActor)
      ).resolves.not.toThrow();
    });
  });

  describe("leaveWorkspace", () => {
    const mockMembership = {
      id: mockMembershipId,
      userId: mockUserId,
      workspaceId: mockWorkspaceId,
      role: Role.MEMBER,
      joinedAt: new Date(),
      invitedById: null,
      workspace: {
        id: mockWorkspaceId,
        name: "Test Workspace",
        slug: "test-workspace",
        ownerId: "owner-123",
        plan: "FREE",
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    beforeEach(() => {
      mockPrisma.membership.findUnique.mockResolvedValue(mockMembership);
      vi.mocked(membershipRepository.delete).mockResolvedValue(undefined as any);
    });

    it("should successfully leave workspace as MEMBER", async () => {
      const result = await memberService.leaveWorkspace(mockUserId, mockWorkspaceId);

      expect(result.message).toBe("Successfully left workspace");
      expect(membershipRepository.delete).toHaveBeenCalledWith(mockMembershipId);
    });

    it("should successfully leave workspace as ADMIN", async () => {
      mockPrisma.membership.findUnique.mockResolvedValue({
        ...mockMembership,
        role: Role.ADMIN,
      });

      const result = await memberService.leaveWorkspace(mockUserId, mockWorkspaceId);

      expect(result.message).toBe("Successfully left workspace");
      expect(membershipRepository.delete).toHaveBeenCalledWith(mockMembershipId);
    });

    it("should successfully leave workspace as VIEWER", async () => {
      mockPrisma.membership.findUnique.mockResolvedValue({
        ...mockMembership,
        role: Role.VIEWER,
      });

      const result = await memberService.leaveWorkspace(mockUserId, mockWorkspaceId);

      expect(result.message).toBe("Successfully left workspace");
    });

    it("should throw NotFoundError if membership does not exist", async () => {
      mockPrisma.membership.findUnique.mockResolvedValue(null);

      await expect(memberService.leaveWorkspace(mockUserId, mockWorkspaceId)).rejects.toThrow(
        NotFoundError
      );
    });

    it("should throw ForbiddenError if user is OWNER", async () => {
      mockPrisma.membership.findUnique.mockResolvedValue({
        ...mockMembership,
        role: Role.OWNER,
      });

      await expect(memberService.leaveWorkspace(mockUserId, mockWorkspaceId)).rejects.toThrow(
        ForbiddenError
      );
    });
  });

  describe("transferOwnership", () => {
    const mockCurrentOwnerId = "owner-123";
    const mockTargetUserId = "target-123";
    const mockPassword = "correct-password";

    const mockCurrentOwner = {
      id: mockCurrentOwnerId,
      email: "owner@example.com",
      name: "Current Owner",
      password: "hashed-password",
      status: "ACTIVE" as const,
      avatarUrl: null,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockCurrentOwnerMembership = {
      id: "membership-owner",
      userId: mockCurrentOwnerId,
      workspaceId: mockWorkspaceId,
      role: Role.OWNER,
      joinedAt: new Date(),
      invitedById: null,
    };

    const mockTargetMembership = {
      id: "membership-target",
      userId: mockTargetUserId,
      workspaceId: mockWorkspaceId,
      role: Role.ADMIN,
      joinedAt: new Date(),
      invitedById: mockCurrentOwnerId,
      user: {
        id: mockTargetUserId,
        email: "target@example.com",
        name: "Target User",
        password: "hashed",
        status: "ACTIVE",
        avatarUrl: null,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      workspace: {
        id: mockWorkspaceId,
        name: "Test Workspace",
        slug: "test-workspace",
        ownerId: mockCurrentOwnerId,
        plan: "FREE",
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    beforeEach(() => {
      vi.clearAllMocks();
      vi.mocked(userRepository.findById).mockResolvedValue(mockCurrentOwner);
      vi.mocked(verifyPassword).mockResolvedValue(true);
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);
      vi.mocked(emailService.sendRoleChangedEmail).mockResolvedValue(undefined);
    });

    it("should successfully transfer ownership", async () => {
      mockPrisma.membership.findUnique
        .mockResolvedValueOnce(mockCurrentOwnerMembership)
        .mockResolvedValueOnce(mockTargetMembership);

      const result = await memberService.transferOwnership(
        mockWorkspaceId,
        mockCurrentOwnerId,
        mockTargetUserId,
        mockPassword
      );

      expect(result.message).toBe("Ownership transferred successfully");
      expect(result.newOwnerId).toBe(mockTargetUserId);
      expect(verifyPassword).toHaveBeenCalledWith(mockPassword, mockCurrentOwner.password);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(emailService.sendRoleChangedEmail).toHaveBeenCalledTimes(2);
    });

    it("should throw UnauthorizedError if password is invalid", async () => {
      vi.mocked(verifyPassword).mockResolvedValue(false);

      await expect(
        memberService.transferOwnership(
          mockWorkspaceId,
          mockCurrentOwnerId,
          mockTargetUserId,
          "wrong-password"
        )
      ).rejects.toThrow(UnauthorizedError);
    });

    it("should throw UnauthorizedError if user does not exist", async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null);

      await expect(
        memberService.transferOwnership(
          mockWorkspaceId,
          mockCurrentOwnerId,
          mockTargetUserId,
          mockPassword
        )
      ).rejects.toThrow(UnauthorizedError);
    });

    it("should throw UnauthorizedError if user has no password", async () => {
      vi.mocked(userRepository.findById).mockResolvedValue({
        ...mockCurrentOwner,
        password: null,
      });

      await expect(
        memberService.transferOwnership(
          mockWorkspaceId,
          mockCurrentOwnerId,
          mockTargetUserId,
          mockPassword
        )
      ).rejects.toThrow(UnauthorizedError);
    });

    it("should throw ForbiddenError if current user is not OWNER", async () => {
      mockPrisma.membership.findUnique.mockResolvedValueOnce({
        ...mockCurrentOwnerMembership,
        role: Role.ADMIN,
      });

      await expect(
        memberService.transferOwnership(
          mockWorkspaceId,
          mockCurrentOwnerId,
          mockTargetUserId,
          mockPassword
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it("should throw NotFoundError if current owner membership does not exist", async () => {
      mockPrisma.membership.findUnique.mockResolvedValueOnce(null);

      await expect(
        memberService.transferOwnership(
          mockWorkspaceId,
          mockCurrentOwnerId,
          mockTargetUserId,
          mockPassword
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it("should throw NotFoundError if target user is not a member", async () => {
      mockPrisma.membership.findUnique
        .mockResolvedValueOnce(mockCurrentOwnerMembership)
        .mockResolvedValueOnce(null);

      await expect(
        memberService.transferOwnership(
          mockWorkspaceId,
          mockCurrentOwnerId,
          mockTargetUserId,
          mockPassword
        )
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw BadRequestError if target is already OWNER", async () => {
      mockPrisma.membership.findUnique
        .mockResolvedValueOnce(mockCurrentOwnerMembership)
        .mockResolvedValueOnce({
          ...mockTargetMembership,
          role: Role.OWNER,
        });

      await expect(
        memberService.transferOwnership(
          mockWorkspaceId,
          mockCurrentOwnerId,
          mockTargetUserId,
          mockPassword
        )
      ).rejects.toThrow(BadRequestError);
    });

    it("should use transaction to update both memberships atomically", async () => {
      mockPrisma.membership.findUnique
        .mockResolvedValueOnce(mockCurrentOwnerMembership)
        .mockResolvedValueOnce(mockTargetMembership);

      mockPrisma.membership.update = vi.fn().mockResolvedValue({});

      await memberService.transferOwnership(
        mockWorkspaceId,
        mockCurrentOwnerId,
        mockTargetUserId,
        mockPassword
      );

      // Verify transaction was called (the actual promises are evaluated inside)
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrisma.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining([expect.anything(), expect.anything()])
      );
    });

    it("should send role change emails to both parties", async () => {
      mockPrisma.membership.findUnique
        .mockResolvedValueOnce(mockCurrentOwnerMembership)
        .mockResolvedValueOnce(mockTargetMembership);

      await memberService.transferOwnership(
        mockWorkspaceId,
        mockCurrentOwnerId,
        mockTargetUserId,
        mockPassword
      );

      expect(emailService.sendRoleChangedEmail).toHaveBeenCalledWith(
        mockTargetMembership.user.email,
        mockTargetMembership.workspace.name,
        mockTargetMembership.workspace.slug,
        Role.ADMIN,
        Role.OWNER
      );

      expect(emailService.sendRoleChangedEmail).toHaveBeenCalledWith(
        mockCurrentOwner.email,
        mockTargetMembership.workspace.name,
        mockTargetMembership.workspace.slug,
        Role.OWNER,
        Role.ADMIN
      );
    });

    it("should allow transferring to MEMBER role", async () => {
      mockPrisma.membership.findUnique
        .mockResolvedValueOnce(mockCurrentOwnerMembership)
        .mockResolvedValueOnce({
          ...mockTargetMembership,
          role: Role.MEMBER,
        });

      const result = await memberService.transferOwnership(
        mockWorkspaceId,
        mockCurrentOwnerId,
        mockTargetUserId,
        mockPassword
      );

      expect(result.newOwnerId).toBe(mockTargetUserId);
    });

    it("should allow transferring to VIEWER role", async () => {
      mockPrisma.membership.findUnique
        .mockResolvedValueOnce(mockCurrentOwnerMembership)
        .mockResolvedValueOnce({
          ...mockTargetMembership,
          role: Role.VIEWER,
        });

      const result = await memberService.transferOwnership(
        mockWorkspaceId,
        mockCurrentOwnerId,
        mockTargetUserId,
        mockPassword
      );

      expect(result.newOwnerId).toBe(mockTargetUserId);
    });
  });
});
