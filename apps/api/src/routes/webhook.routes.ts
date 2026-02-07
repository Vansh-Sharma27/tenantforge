import express, { Router } from "express";

import { webhookController } from "@/controllers/webhook.controller";

const router: Router = Router();

/**
 * POST /api/v1/webhooks/stripe
 * Stripe webhook handler (no authentication, signature verified)
 *
 * IMPORTANT: This route must receive raw body for signature verification
 * The raw body parsing is configured in app.ts
 */
router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  webhookController.handleStripeWebhook.bind(webhookController)
);

export default router;
