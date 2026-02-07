import { Router } from "express";

import { billingController } from "@/controllers/billing.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/rbac.middleware";
import { requireWorkspace } from "@/middleware/tenant.middleware";

const router: Router = Router({ mergeParams: true });

// All billing routes require authentication and tenant context
router.use(requireAuth);
router.use(requireWorkspace);

/**
 * POST /api/v1/workspaces/:slug/billing/checkout
 * Create Stripe Checkout Session (OWNER only)
 */
router.post("/checkout", requireRole("OWNER"), (req, res, next) =>
  billingController.createCheckoutSession(req, res, next)
);

/**
 * POST /api/v1/workspaces/:slug/billing/portal
 * Create Stripe Customer Portal Session (OWNER only)
 */
router.post("/portal", requireRole("OWNER"), (req, res, next) =>
  billingController.createPortalSession(req, res, next)
);

/**
 * GET /api/v1/workspaces/:slug/billing
 * Get billing information (ADMIN+ can view)
 */
router.get("/", requireRole("ADMIN", "OWNER"), (req, res, next) =>
  billingController.getBillingInfo(req, res, next)
);

export default router;
