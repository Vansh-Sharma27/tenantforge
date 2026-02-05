import { Role } from "@prisma/client";
import { Router } from "express";

import { memberController } from "@/controllers/member.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireMinRole, requireRole } from "@/middleware/rbac.middleware";
import { requireWorkspace } from "@/middleware/tenant.middleware";

const router: Router = Router();

/**
 * Member management routes
 * All routes require authentication and workspace membership
 * Routes are prefixed with /api/v1/workspaces/:slug
 */

// List members in workspace
// Any workspace member can view the member list
router.get("/:slug/members", requireAuth, requireWorkspace, (req, res, next) =>
  memberController.listMembers(req, res, next)
);

// Update member role
// Requires ADMIN or OWNER role
router.patch(
  "/:slug/members/:id",
  requireAuth,
  requireWorkspace,
  requireMinRole(Role.ADMIN),
  (req, res, next) => memberController.updateMemberRole(req, res, next)
);

// Remove member from workspace
// Requires ADMIN or OWNER role
router.delete(
  "/:slug/members/:id",
  requireAuth,
  requireWorkspace,
  requireMinRole(Role.ADMIN),
  (req, res, next) => memberController.removeMember(req, res, next)
);

// Leave workspace
// Any workspace member can leave (except OWNER)
router.post("/:slug/leave", requireAuth, requireWorkspace, (req, res, next) =>
  memberController.leaveWorkspace(req, res, next)
);

// Transfer ownership
// Requires OWNER role
router.post(
  "/:slug/transfer",
  requireAuth,
  requireWorkspace,
  requireRole(Role.OWNER),
  (req, res, next) => memberController.transferOwnership(req, res, next)
);

export default router;
