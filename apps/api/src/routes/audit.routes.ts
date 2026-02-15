import { Router } from "express";

import { auditController } from "@/controllers/audit.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/rbac.middleware";
import { requireWorkspace } from "@/middleware/tenant.middleware";

const router: Router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(requireWorkspace);

/**
 * GET /api/v1/workspaces/:slug/audit
 * List audit logs (ADMIN+ can view)
 */
router.get("/", requireRole("ADMIN", "OWNER"), (req, res, next) =>
  auditController.listAuditLogs(req, res, next)
);

export default router;
