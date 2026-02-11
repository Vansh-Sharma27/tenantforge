import { Request, Response, NextFunction } from "express";

import { config } from "@/config";
import { createCheckoutSchema } from "@/schemas/billing.schema";
import { stripeService } from "@/services/stripe.service";
import { BadRequestError } from "@/utils/errors";

const PLAN_PRICE_MAP: Record<string, string | undefined> = {
  PRO: config.stripe.priceIds.pro,
  ENTERPRISE: config.stripe.priceIds.enterprise,
};

export class BillingController {
  /**
   * POST /api/v1/workspaces/:slug/billing/checkout
   * Creates a Stripe Checkout Session for subscription
   */
  async createCheckoutSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { plan } = createCheckoutSchema.parse(req.body);
      const workspace = req.workspace!;

      const priceId = PLAN_PRICE_MAP[plan];
      if (!priceId) {
        throw new BadRequestError(`Stripe price not configured for ${plan} plan`);
      }

      // Verify workspace has Stripe customer
      if (!workspace.stripeCustomerId) {
        throw new BadRequestError("Workspace is not set up for billing");
      }

      // Create checkout session
      const session = await stripeService.createCheckoutSession({
        customerId: workspace.stripeCustomerId,
        priceId,
        workspaceId: workspace.id,
        workspaceSlug: workspace.slug,
        successUrl: `${config.frontend.url}/w/${workspace.slug}/billing?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${config.frontend.url}/w/${workspace.slug}/billing`,
      });

      res.status(200).json({
        success: true,
        data: {
          checkoutUrl: session.url,
        },
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/workspaces/:slug/billing/portal
   * Creates a Stripe Customer Portal session
   */
  async createPortalSession(req: Request, res: Response, next: NextFunction) {
    try {
      const workspace = req.workspace!;

      // Verify workspace has Stripe customer
      if (!workspace.stripeCustomerId) {
        throw new BadRequestError("Workspace is not set up for billing");
      }

      // Create portal session
      const session = await stripeService.createPortalSession(
        workspace.stripeCustomerId,
        `${config.frontend.url}/w/${workspace.slug}/billing`
      );

      res.status(200).json({
        success: true,
        data: {
          portalUrl: session.url,
        },
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/workspaces/:slug/billing
   * Retrieves billing information and subscription status
   */
  async getBillingInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const workspace = req.workspace!;

      let subscriptionDetails = null;

      // Get subscription details if workspace has one
      if (workspace.stripeSubId) {
        const subscription = await stripeService.getSubscription(workspace.stripeSubId);
        const subAny = subscription as any;

        subscriptionDetails = {
          status: subscription.status,
          currentPeriodEnd: subAny.current_period_end
            ? new Date((subAny.current_period_end as number) * 1000).toISOString()
            : new Date().toISOString(),
          cancelAtPeriodEnd: subAny.cancel_at_period_end || false,
        };
      }

      res.status(200).json({
        success: true,
        data: {
          plan: workspace.plan,
          subscription: subscriptionDetails,
          hasStripeCustomer: !!workspace.stripeCustomerId,
        },
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const billingController = new BillingController();
