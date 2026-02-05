import { Role } from "@prisma/client";
import { Router } from "express";

import { workspaceController } from "@/controllers/workspace.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/rbac.middleware";
import { requireWorkspace } from "@/middleware/tenant.middleware";

const router = Router();

/**
 * Workspace routes
 * All routes require authentication
 */

// Create new workspace
router.post("/", requireAuth, (req, res, next) =>
  workspaceController.createWorkspace(req, res, next)
);

// List user's workspaces
router.get("/", requireAuth, (req, res, next) =>
  workspaceController.listWorkspaces(req, res, next)
);

// Get workspace details
// Requires workspace membership (enforced by requireWorkspace)
router.get("/:slug", requireAuth, requireWorkspace, (req, res, next) =>
  workspaceController.getWorkspace(req, res, next)
);

// Update workspace
// Requires OWNER or ADMIN role
router.patch(
  "/:slug",
  requireAuth,
  requireWorkspace,
  requireRole(Role.OWNER, Role.ADMIN),
  (req, res, next) => workspaceController.updateWorkspace(req, res, next)
);

// Delete workspace
// Requires OWNER role only
router.delete("/:slug", requireAuth, requireWorkspace, requireRole(Role.OWNER), (req, res, next) =>
  workspaceController.deleteWorkspace(req, res, next)
);

export default router;
