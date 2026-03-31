import { randomBytes } from "crypto";

import { InvitationStatus, Role } from "@prisma/client";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { invitationRepository } from "@/repositories/invitation.repository";
import { membershipRepository } from "@/repositories/membership.repository";
import { userRepository } from "@/repositories/user.repository";
import { workspaceRepository } from "@/repositories/workspace.repository";
import { emailService } from "@/services/email.service";
import { InvitationService } from "@/services/invitation.service";
import { ForbiddenError, ConflictError, NotFoundError, BadRequestError } from "@/utils/errors";

// Mock all dependencies
vi.mock("@/repositories/invitation.repository");
vi.mock("@/repositories/membership.repository");
vi.mock("@/repositories/user.repository");
vi.mock("@/repositories/workspace.repository");
vi.mock("@/services/email.service");
vi.mock("crypto", () => ({
  randomBytes: vi.fn(),
}));

describe("InvitationService", () => {
  let invitationService: InvitationService;

  const mockWorkspaceId = "workspace-123";
  const mockUserId = "user-123";
  const mockEmail = "invitee@example.com";
  const mockToken = "a".repeat(64); // 64 character token

  beforeEach(() => {
    vi.clearAllMocks();
    invitationService = new InvitationService();

    // Mock randomBytes to return predictable token
    // randomBytes(32).toString("hex") produces 64 chars (32 bytes * 2 hex chars per byte)
    // We need to return a Buffer that when .toString("hex") is called, produces our expected token
    const buffer = Buffer.alloc(32);
    buffer.fill(0xaa); // Fill with 0xaa which produces "aa" in hex
    vi.mocked(randomBytes).mockReturnValue(buffer);
  });

  describe("sendInvitation", () => {
    const mockInviterMembership = {
      id: "membership-123",
      userId: mockUserId,
      workspaceId: mockWorkspaceId,
      role: Role.ADMIN,
      joinedAt: new Date(),
      invitedById: null,
    };

    const mockWorkspace = {
      id: mockWorkspaceId,
      name: "Test Workspace",
      slug: "test-workspace",
      ownerId: "owner-123",
      plan: "FREE",
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockInviter = {
      id: mockUserId,
      email: "inviter@example.com",
      name: "Inviter Name",
      password: "hashed",
      status: "ACTIVE",
      avatarUrl: null,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      vi.mocked(membershipRepository.findByUserAndWorkspace).mockResolvedValue(
        mockInviterMembership
      );
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(invitationRepository.findByEmailAndWorkspace).mockResolvedValue(null);
      vi.mocked(workspaceRepository.findById).mockResolvedValue(mockWorkspace);
      vi.mocked(userRepository.findById).mockResolvedValue(mockInviter);
    });

    it("should successfully send invitation when all validations pass", async () => {
      const mockInvitation = {
        id: "invitation-123",
        email: mockEmail,
        workspaceId: mockWorkspaceId,
        role: Role.MEMBER,
        token: mockToken,
        status: InvitationStatus.PENDING,
        invitedById: mockUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(invitationRepository.create).mockResolvedValue(mockInvitation);
      vi.mocked(emailService.sendInvitationEmail).mockResolvedValue(undefined);

      const result = await invitationService.sendInvitation(
        mockWorkspaceId,
        mockUserId,
        mockEmail,
        Role.MEMBER
      );

      expect(result).toEqual(mockInvitation);
      expect(invitationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: mockEmail,
          workspaceId: mockWorkspaceId,
          role: Role.MEMBER,
          invitedById: mockUserId,
          token: mockToken,
        })
      );
      expect(emailService.sendInvitationEmail).toHaveBeenCalledWith(
        mockEmail,
        mockWorkspace.name,
        mockInviter.name,
        Role.MEMBER,
        mockToken
      );
    });

    it("should generate 64 character token", async () => {
      const mockInvitation = {
        id: "invitation-123",
        email: mockEmail,
        workspaceId: mockWorkspaceId,
        role: Role.MEMBER,
        token: mockToken,
        status: InvitationStatus.PENDING,
        invitedById: mockUserId,
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(invitationRepository.create).mockResolvedValue(mockInvitation);
      vi.mocked(emailService.sendInvitationEmail).mockResolvedValue(undefined);

      await invitationService.sendInvitation(mockWorkspaceId, mockUserId, mockEmail, Role.MEMBER);

      expect(randomBytes).toHaveBeenCalledWith(32);
      const createCall = vi.mocked(invitationRepository.create).mock.calls[0][0];
      expect(createCall.token).toHaveLength(64);
    });

    it("should set expiration to 7 days from now", async () => {
      const mockInvitation = {
        id: "invitation-123",
        email: mockEmail,
        workspaceId: mockWorkspaceId,
        role: Role.MEMBER,
        token: mockToken,
        status: InvitationStatus.PENDING,
        invitedById: mockUserId,
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(invitationRepository.create).mockResolvedValue(mockInvitation);
      vi.mocked(emailService.sendInvitationEmail).mockResolvedValue(undefined);

      const beforeCall = Date.now();
      await invitationService.sendInvitation(mockWorkspaceId, mockUserId, mockEmail, Role.MEMBER);
      const afterCall = Date.now();

      const createCall = vi.mocked(invitationRepository.create).mock.calls[0][0];
      const expiresAt = createCall.expiresAt.getTime();
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

      // Allow for small time difference during test execution
      expect(expiresAt).toBeGreaterThanOrEqual(beforeCall + sevenDaysInMs - 100);
      expect(expiresAt).toBeLessThanOrEqual(afterCall + sevenDaysInMs + 100);
    });

    it("should throw ForbiddenError if inviter is not a member", async () => {
      vi.mocked(membershipRepository.findByUserAndWorkspace).mockResolvedValue(null);

      await expect(
        invitationService.sendInvitation(mockWorkspaceId, mockUserId, mockEmail, Role.MEMBER)
      ).rejects.toThrow(ForbiddenError);
    });

    it("should throw ForbiddenError if inviter is MEMBER", async () => {
      vi.mocked(membershipRepository.findByUserAndWorkspace).mockResolvedValue({
        ...mockInviterMembership,
        role: Role.MEMBER,
      });

      await expect(
        invitationService.sendInvitation(mockWorkspaceId, mockUserId, mockEmail, Role.MEMBER)
      ).rejects.toThrow(ForbiddenError);
    });

    it("should throw ForbiddenError if inviter is VIEWER", async () => {
      vi.mocked(membershipRepository.findByUserAndWorkspace).mockResolvedValue({
        ...mockInviterMembership,
        role: Role.VIEWER,
      });

      await expect(
        invitationService.sendInvitation(mockWorkspaceId, mockUserId, mockEmail, Role.MEMBER)
      ).rejects.toThrow(ForbiddenError);
    });

    it("should allow OWNER to send invitations", async () => {
      vi.mocked(membershipRepository.findByUserAndWorkspace).mockResolvedValue({
        ...mockInviterMembership,
        role: Role.OWNER,
      });

      const mockInvitation = {
        id: "invitation-123",
        email: mockEmail,
        workspaceId: mockWorkspaceId,
        role: Role.MEMBER,
        token: mockToken,
        status: InvitationStatus.PENDING,
        invitedById: mockUserId,
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(invitationRepository.create).mockResolvedValue(mockInvitation);
      vi.mocked(emailService.sendInvitationEmail).mockResolvedValue(undefined);

      await expect(
        invitationService.sendInvitation(mockWorkspaceId, mockUserId, mockEmail, Role.MEMBER)
      ).resolves.not.toThrow();
    });

    it("should allow ADMIN to send invitations", async () => {
      const mockInvitation = {
        id: "invitation-123",
        email: mockEmail,
        workspaceId: mockWorkspaceId,
        role: Role.MEMBER,
        token: mockToken,
        status: InvitationStatus.PENDING,
        invitedById: mockUserId,
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(invitationRepository.create).mockResolvedValue(mockInvitation);
      vi.mocked(emailService.sendInvitationEmail).mockResolvedValue(undefined);

      await expect(
        invitationService.sendInvitation(mockWorkspaceId, mockUserId, mockEmail, Role.MEMBER)
      ).resolves.not.toThrow();
    });

    it("should throw ConflictError if user is already a member", async () => {
      const existingUser = {
        id: "existing-user-123",
        email: mockEmail,
        name: "Existing User",
        password: "hashed",
        status: "ACTIVE" as const,
        avatarUrl: null,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const existingMembership = {
        id: "membership-456",
        userId: existingUser.id,
        workspaceId: mockWorkspaceId,
        role: Role.MEMBER,
        joinedAt: new Date(),
        invitedById: null,
      };

      vi.mocked(userRepository.findByEmail).mockResolvedValue(existingUser);
      vi.mocked(membershipRepository.findByUserAndWorkspace)
        .mockResolvedValueOnce(mockInviterMembership)
        .mockResolvedValueOnce(existingMembership);

      await expect(
        invitationService.sendInvitation(mockWorkspaceId, mockUserId, mockEmail, Role.MEMBER)
      ).rejects.toThrow(ConflictError);
    });

    it("should throw ConflictError if pending invitation already exists", async () => {
      const pendingInvitation = {
        id: "invitation-456",
        email: mockEmail,
        workspaceId: mockWorkspaceId,
        role: Role.MEMBER,
        token: "existing-token",
        status: InvitationStatus.PENDING,
        invitedById: mockUserId,
        expiresAt: new Date(Date.now() + 1000000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(invitationRepository.findByEmailAndWorkspace).mockResolvedValue(pendingInvitation);

      await expect(
        invitationService.sendInvitation(mockWorkspaceId, mockUserId, mockEmail, Role.MEMBER)
      ).rejects.toThrow(ConflictError);
    });

    it("should queue invitation email with correct parameters", async () => {
      const mockInvitation = {
        id: "invitation-123",
        email: mockEmail,
        workspaceId: mockWorkspaceId,
        role: Role.ADMIN,
        token: mockToken,
        status: InvitationStatus.PENDING,
        invitedById: mockUserId,
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(invitationRepository.create).mockResolvedValue(mockInvitation);
      vi.mocked(emailService.sendInvitationEmail).mockResolvedValue(undefined);

      await invitationService.sendInvitation(mockWorkspaceId, mockUserId, mockEmail, Role.ADMIN);

      expect(emailService.sendInvitationEmail).toHaveBeenCalledWith(
        mockEmail,
        mockWorkspace.name,
        mockInviter.name,
        Role.ADMIN,
        mockToken
      );
    });
  });

  describe("listPendingInvitations", () => {
    it("should return pending invitations for workspace", async () => {
      const mockInvitations = [
        {
          id: "invitation-1",
          email: "user1@example.com",
          workspaceId: mockWorkspaceId,
          role: Role.MEMBER,
          token: "token1",
          status: InvitationStatus.PENDING,
          invitedById: mockUserId,
          expiresAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "invitation-2",
          email: "user2@example.com",
          workspaceId: mockWorkspaceId,
          role: Role.ADMIN,
          token: "token2",
          status: InvitationStatus.PENDING,
          invitedById: mockUserId,
          expiresAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(invitationRepository.findPendingByWorkspace).mockResolvedValue(mockInvitations);

      const result = await invitationService.listPendingInvitations(mockWorkspaceId);

      expect(result).toEqual(mockInvitations);
      expect(invitationRepository.findPendingByWorkspace).toHaveBeenCalledWith(mockWorkspaceId);
    });

    it("should return empty array when no pending invitations", async () => {
      vi.mocked(invitationRepository.findPendingByWorkspace).mockResolvedValue([]);

      const result = await invitationService.listPendingInvitations(mockWorkspaceId);

      expect(result).toEqual([]);
    });
  });

  describe("revokeInvitation", () => {
    const mockInvitationId = "invitation-123";
    const mockActorId = "actor-123";

    const mockInvitation = {
      id: mockInvitationId,
      email: mockEmail,
      workspaceId: mockWorkspaceId,
      role: Role.MEMBER,
      token: mockToken,
      status: InvitationStatus.PENDING,
      invitedById: mockUserId,
      expiresAt: new Date(Date.now() + 1000000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockActorMembership = {
      id: "membership-actor",
      userId: mockActorId,
      workspaceId: mockWorkspaceId,
      role: Role.ADMIN,
      joinedAt: new Date(),
      invitedById: null,
    };

    beforeEach(() => {
      vi.mocked(invitationRepository.findById).mockResolvedValue(mockInvitation);
      vi.mocked(membershipRepository.findByUserAndWorkspace).mockResolvedValue(mockActorMembership);
      vi.mocked(invitationRepository.updateStatus).mockResolvedValue(undefined as any);
    });

    it("should successfully revoke invitation when actor is ADMIN", async () => {
      const result = await invitationService.revokeInvitation(
        mockInvitationId,
        mockWorkspaceId,
        mockActorId
      );

      expect(result.message).toBe("Invitation revoked successfully");
      expect(invitationRepository.updateStatus).toHaveBeenCalledWith(
        mockInvitationId,
        InvitationStatus.REVOKED
      );
    });

    it("should successfully revoke invitation when actor is OWNER", async () => {
      vi.mocked(membershipRepository.findByUserAndWorkspace).mockResolvedValue({
        ...mockActorMembership,
        role: Role.OWNER,
      });

      const result = await invitationService.revokeInvitation(
        mockInvitationId,
        mockWorkspaceId,
        mockActorId
      );

      expect(result.message).toBe("Invitation revoked successfully");
      expect(invitationRepository.updateStatus).toHaveBeenCalledWith(
        mockInvitationId,
        InvitationStatus.REVOKED
      );
    });

    it("should throw NotFoundError if invitation does not exist", async () => {
      vi.mocked(invitationRepository.findById).mockResolvedValue(null);

      await expect(
        invitationService.revokeInvitation(mockInvitationId, mockWorkspaceId, mockActorId)
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError if invitation belongs to different workspace", async () => {
      vi.mocked(invitationRepository.findById).mockResolvedValue({
        ...mockInvitation,
        workspaceId: "different-workspace",
      });

      await expect(
        invitationService.revokeInvitation(mockInvitationId, mockWorkspaceId, mockActorId)
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw ForbiddenError if actor is not a member", async () => {
      vi.mocked(membershipRepository.findByUserAndWorkspace).mockResolvedValue(null);

      await expect(
        invitationService.revokeInvitation(mockInvitationId, mockWorkspaceId, mockActorId)
      ).rejects.toThrow(ForbiddenError);
    });

    it("should throw ForbiddenError if actor is MEMBER", async () => {
      vi.mocked(membershipRepository.findByUserAndWorkspace).mockResolvedValue({
        ...mockActorMembership,
        role: Role.MEMBER,
      });

      await expect(
        invitationService.revokeInvitation(mockInvitationId, mockWorkspaceId, mockActorId)
      ).rejects.toThrow(ForbiddenError);
    });

    it("should throw ForbiddenError if actor is VIEWER", async () => {
      vi.mocked(membershipRepository.findByUserAndWorkspace).mockResolvedValue({
        ...mockActorMembership,
        role: Role.VIEWER,
      });

      await expect(
        invitationService.revokeInvitation(mockInvitationId, mockWorkspaceId, mockActorId)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("acceptInvitation", () => {
    const mockInvitation = {
      id: "invitation-123",
      email: mockEmail,
      workspaceId: mockWorkspaceId,
      role: Role.MEMBER,
      token: mockToken,
      status: InvitationStatus.PENDING,
      invitedById: mockUserId,
      expiresAt: new Date(Date.now() + 1000000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockWorkspace = {
      id: mockWorkspaceId,
      name: "Test Workspace",
      slug: "test-workspace",
      ownerId: "owner-123",
      plan: "FREE" as const,
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      vi.mocked(invitationRepository.findByToken).mockResolvedValue(mockInvitation);
      vi.mocked(workspaceRepository.findById).mockResolvedValue(mockWorkspace);
    });

    describe("with userId (existing user)", () => {
      const existingUserId = "existing-user-123";

      const mockAcceptingUser = {
        id: existingUserId,
        email: mockEmail,
        name: "Accepting User",
        password: "hashed",
        status: "ACTIVE" as const,
        avatarUrl: null,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      beforeEach(() => {
        // Mock the accepting user lookup for email verification
        vi.mocked(userRepository.findById).mockResolvedValue(mockAcceptingUser);
      });

      it("should create membership and accept invitation", async () => {
        const mockMembership = {
          id: "membership-new",
          userId: existingUserId,
          workspaceId: mockWorkspaceId,
          role: Role.MEMBER,
          joinedAt: new Date(),
          invitedById: mockUserId,
        };

        vi.mocked(membershipRepository.findByUserAndWorkspace).mockResolvedValue(null);
        vi.mocked(membershipRepository.create).mockResolvedValue(mockMembership);
        vi.mocked(invitationRepository.updateStatus).mockResolvedValue(undefined as any);
        vi.mocked(emailService.sendWelcomeEmail).mockResolvedValue(undefined);

        const result = await invitationService.acceptInvitation(mockToken, existingUserId);

        expect(result.membership).toEqual(mockMembership);
        expect(result.workspace).toEqual(mockWorkspace);
        expect(invitationRepository.updateStatus).toHaveBeenCalledWith(
          mockInvitation.id,
          InvitationStatus.ACCEPTED
        );
        expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
          mockEmail,
          mockWorkspace.name,
          mockWorkspace.slug
        );
      });

      it("should throw ConflictError if user is already a member", async () => {
        const existingMembership = {
          id: "membership-existing",
          userId: existingUserId,
          workspaceId: mockWorkspaceId,
          role: Role.MEMBER,
          joinedAt: new Date(),
          invitedById: null,
        };

        vi.mocked(membershipRepository.findByUserAndWorkspace).mockResolvedValue(
          existingMembership
        );

        await expect(invitationService.acceptInvitation(mockToken, existingUserId)).rejects.toThrow(
          ConflictError
        );
      });
    });

    describe("without userId (new user registration)", () => {
      it("should return invitation details without creating membership", async () => {
        const result = await invitationService.acceptInvitation(mockToken);

        expect(result.invitation).toEqual({
          email: mockEmail,
          workspaceName: mockWorkspace.name,
          role: Role.MEMBER,
        });
        expect(membershipRepository.create).not.toHaveBeenCalled();
        expect(invitationRepository.updateStatus).not.toHaveBeenCalled();
      });
    });

    describe("validation", () => {
      it("should throw NotFoundError if invitation does not exist", async () => {
        vi.mocked(invitationRepository.findByToken).mockResolvedValue(null);

        await expect(invitationService.acceptInvitation(mockToken)).rejects.toThrow(NotFoundError);
      });

      it("should throw BadRequestError if invitation has expired", async () => {
        vi.mocked(invitationRepository.findByToken).mockResolvedValue({
          ...mockInvitation,
          expiresAt: new Date(Date.now() - 1000),
        });

        await expect(invitationService.acceptInvitation(mockToken)).rejects.toThrow(
          BadRequestError
        );
      });

      it("should throw BadRequestError if invitation is already accepted", async () => {
        vi.mocked(invitationRepository.findByToken).mockResolvedValue({
          ...mockInvitation,
          status: InvitationStatus.ACCEPTED,
        });

        await expect(invitationService.acceptInvitation(mockToken)).rejects.toThrow(
          BadRequestError
        );
      });

      it("should throw BadRequestError if invitation is revoked", async () => {
        vi.mocked(invitationRepository.findByToken).mockResolvedValue({
          ...mockInvitation,
          status: InvitationStatus.REVOKED,
        });

        await expect(invitationService.acceptInvitation(mockToken)).rejects.toThrow(
          BadRequestError
        );
      });
    });
  });

  describe("getInvitationDetails", () => {
    const mockInvitation = {
      id: "invitation-123",
      email: mockEmail,
      workspaceId: mockWorkspaceId,
      role: Role.MEMBER,
      token: mockToken,
      status: InvitationStatus.PENDING,
      invitedById: mockUserId,
      expiresAt: new Date(Date.now() + 1000000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockWorkspace = {
      id: mockWorkspaceId,
      name: "Test Workspace",
      slug: "test-workspace",
      ownerId: "owner-123",
      plan: "FREE" as const,
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      vi.mocked(invitationRepository.findByToken).mockResolvedValue(mockInvitation);
      vi.mocked(workspaceRepository.findById).mockResolvedValue(mockWorkspace);
    });

    it("should return invitation details", async () => {
      const result = await invitationService.getInvitationDetails(mockToken);

      expect(result).toEqual({
        email: mockEmail,
        workspaceName: mockWorkspace.name,
        workspaceSlug: mockWorkspace.slug,
        role: Role.MEMBER,
      });
    });

    it("should throw NotFoundError if invitation does not exist", async () => {
      vi.mocked(invitationRepository.findByToken).mockResolvedValue(null);

      await expect(invitationService.getInvitationDetails(mockToken)).rejects.toThrow(
        NotFoundError
      );
    });

    it("should throw BadRequestError if invitation has expired", async () => {
      vi.mocked(invitationRepository.findByToken).mockResolvedValue({
        ...mockInvitation,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(invitationService.getInvitationDetails(mockToken)).rejects.toThrow(
        BadRequestError
      );
    });

    it("should throw BadRequestError if invitation is already accepted", async () => {
      vi.mocked(invitationRepository.findByToken).mockResolvedValue({
        ...mockInvitation,
        status: InvitationStatus.ACCEPTED,
      });

      await expect(invitationService.getInvitationDetails(mockToken)).rejects.toThrow(
        BadRequestError
      );
    });

    it("should throw BadRequestError if invitation is revoked", async () => {
      vi.mocked(invitationRepository.findByToken).mockResolvedValue({
        ...mockInvitation,
        status: InvitationStatus.REVOKED,
      });

      await expect(invitationService.getInvitationDetails(mockToken)).rejects.toThrow(
        BadRequestError
      );
    });
  });
});
