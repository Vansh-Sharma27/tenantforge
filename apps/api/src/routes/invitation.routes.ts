import { Role } from "@prisma/client";
import { Router } from "express";

import { invitationController } from "@/controllers/invitation.controller";
import { requireAuth, optionalAuth } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/rbac.middleware";
import { requireWorkspace } from "@/middleware/tenant.middleware";

const router: Router = Router();

/**
 * Invitation routes
 */

// Workspace-scoped routes (require auth + tenant + ADMIN+)

// Send invitation to workspace
router.post(
  "/workspaces/:slug/invitations",
  requireAuth,
  requireWorkspace,
  requireRole(Role.OWNER, Role.ADMIN),
  (req, res, next) => invitationController.sendInvitation(req, res, next)
);

// List pending invitations for workspace
router.get(
  "/workspaces/:slug/invitations",
  requireAuth,
  requireWorkspace,
  requireRole(Role.OWNER, Role.ADMIN),
  (req, res, next) => invitationController.listPendingInvitations(req, res, next)
);

// Revoke invitation
router.delete(
  "/workspaces/:slug/invitations/:id",
  requireAuth,
  requireWorkspace,
  requireRole(Role.OWNER, Role.ADMIN),
  (req, res, next) => invitationController.revokeInvitation(req, res, next)
);

// Token-based routes (public or auth optional)

// Accept invitation (can be authenticated or not)
router.post("/invitations/:token/accept", optionalAuth, (req, res, next) =>
  invitationController.acceptInvitation(req, res, next)
);

// Get invitation details (public for registration flow)
router.get("/invitations/:token", (req, res, next) =>
  invitationController.getInvitationDetails(req, res, next)
);

export default router;
