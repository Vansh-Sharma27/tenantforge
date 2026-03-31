import { Plan } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";

import { config } from "@/config";
import { redis } from "@/lib/redis";
import { membershipRepository } from "@/repositories/membership.repository";
import { workspaceRepository } from "@/repositories/workspace.repository";
import { auditService } from "@/services/audit.service";
import { emailService } from "@/services/email.service";
import { stripeService } from "@/services/stripe.service";
import { AuditActions } from "@/types/audit.types";
import { logger } from "@/utils/logger";

/**
 * Webhook controller for handling Stripe events
 */
export class WebhookController {
  /**
   * POST /api/v1/webhooks/stripe
   * Handle Stripe webhook events
   */
  async handleStripeWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers["stripe-signature"] as string;

      if (!signature) {
        return res.status(400).json({ error: "Missing stripe-signature header" });
      }

      if (!config.stripe.webhookSecret) {
        logger.error("Stripe webhook secret not configured");
        return res.status(500).json({ error: "Webhook not configured" });
      }

      // Verify webhook signature
      let event: Stripe.Event;
      try {
        event = stripeService.verifyWebhookSignature(
          req.body,
          signature,
          config.stripe.webhookSecret
        );
      } catch (err) {
        logger.warn({ error: err }, "Stripe webhook signature verification failed");
        return res.status(400).json({ error: "Invalid webhook signature" });
      }

      // Idempotency check: GET first so failed events can be retried by Stripe
      const eventKey = `stripe_webhook:${event.id}`;
      const alreadyProcessed = await redis.get(eventKey);

      if (alreadyProcessed !== null) {
        logger.info({ eventId: event.id }, "Webhook event already processed");
        return res.status(200).json({ received: true });
      }

      // Handle event by type — set idempotency key ONLY after success
      await this.handleEvent(event);

      // Mark as processed with 24h TTL after successful handling
      await redis.set(eventKey, "processed", "EX", 86400);

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error({ error }, "Stripe webhook processing error");
      next(error);
    }
  }

  /**
   * Route events to appropriate handlers
   */
  private async handleEvent(event: Stripe.Event) {
    logger.info({ type: event.type, eventId: event.id }, "Processing Stripe webhook event");

    switch (event.type) {
      case "checkout.session.completed":
        await this.handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;

      case "invoice.paid":
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "customer.subscription.updated":
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        logger.debug({ type: event.type }, "Unhandled webhook event type");
    }
  }

  /**
   * Handle checkout.session.completed
   */
  private async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const workspaceId = session.metadata?.workspaceId;

    if (!workspaceId || !session.subscription) {
      logger.warn({ session }, "Checkout session missing workspace ID or subscription");
      return;
    }

    // Determine plan from price ID
    const subscription = await stripeService.getSubscription(session.subscription as string);
    if (!subscription) {
      logger.warn(
        { subscriptionId: session.subscription },
        "Subscription not found in Stripe during checkout completion"
      );
      return;
    }
    const priceId = subscription.items.data[0]?.price.id;
    const plan = this.mapPriceToPlan(priceId);

    await workspaceRepository.update(workspaceId, {
      stripeSubId: session.subscription as string,
      plan,
    });

    auditService.log({
      workspaceId,
      actorType: "webhook",
      action: AuditActions.SUBSCRIPTION_CREATED,
      metadata: {
        subscriptionId: session.subscription,
        plan,
      },
    });

    logger.info({ workspaceId, plan }, "Subscription created from checkout");
  }

  /**
   * Handle invoice.paid
   */
  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    const rawSub = invoice.parent?.subscription_details?.subscription;
    const subscriptionId =
      rawSub == null ? undefined : typeof rawSub === "string" ? rawSub : rawSub.id;

    if (!subscriptionId) {
      return;
    }

    const workspace = await workspaceRepository.findByStripeSubscriptionId(subscriptionId);

    if (workspace) {
      logger.info({ workspaceId: workspace.id }, "Invoice paid - subscription active");

      auditService.log({
        workspaceId: workspace.id,
        actorType: "webhook",
        action: AuditActions.SUBSCRIPTION_UPDATED,
        metadata: {
          invoiceId: invoice.id,
          amount: invoice.amount_paid,
        },
      });
    }
  }

  /**
   * Handle invoice.payment_failed
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const rawSub = invoice.parent?.subscription_details?.subscription;
    const subscriptionId =
      rawSub == null ? undefined : typeof rawSub === "string" ? rawSub : rawSub.id;

    if (!subscriptionId) {
      return;
    }

    const workspace = await workspaceRepository.findByStripeSubscriptionId(subscriptionId);

    if (workspace) {
      logger.warn({ workspaceId: workspace.id }, "Payment failed");

      auditService.log({
        workspaceId: workspace.id,
        actorType: "webhook",
        action: AuditActions.PAYMENT_FAILED,
        metadata: {
          invoiceId: invoice.id,
          attemptCount: invoice.attempt_count,
        },
      });

      // Notify workspace owner about payment failure
      const owner = await membershipRepository.findOwnerByWorkspaceId(workspace.id);

      if (owner?.user?.email) {
        await emailService.sendPaymentFailedEmail(
          owner.user.email,
          workspace.name,
          workspace.slug,
          invoice.attempt_count || 1
        );
      }
    }
  }

  /**
   * Handle customer.subscription.updated
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const workspace = await workspaceRepository.findByStripeSubscriptionId(subscription.id);

    if (!workspace) {
      return;
    }

    const priceId = subscription.items.data[0]?.price.id;
    const plan = this.mapPriceToPlan(priceId);

    await workspaceRepository.update(workspace.id, {
      plan,
    });

    auditService.log({
      workspaceId: workspace.id,
      actorType: "webhook",
      action: AuditActions.SUBSCRIPTION_UPDATED,
      metadata: {
        subscriptionId: subscription.id,
        plan,
        status: subscription.status,
      },
    });

    logger.info({ workspaceId: workspace.id, plan }, "Subscription updated");
  }

  /**
   * Handle customer.subscription.deleted
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const workspace = await workspaceRepository.findByStripeSubscriptionId(subscription.id);

    if (!workspace) {
      return;
    }

    await workspaceRepository.update(workspace.id, {
      plan: Plan.FREE,
      stripeSubId: null,
    });

    auditService.log({
      workspaceId: workspace.id,
      actorType: "webhook",
      action: AuditActions.SUBSCRIPTION_CANCELLED,
      metadata: {
        subscriptionId: subscription.id,
      },
    });

    logger.info({ workspaceId: workspace.id }, "Subscription cancelled - downgraded to FREE");
  }

  /**
   * Map Stripe price ID to Plan enum
   */
  private mapPriceToPlan(priceId?: string): Plan {
    if (!priceId) {
      return Plan.FREE;
    }

    if (priceId === config.stripe.priceIds.pro) {
      return Plan.PRO;
    }

    if (priceId === config.stripe.priceIds.enterprise) {
      return Plan.ENTERPRISE;
    }

    logger.warn({ priceId }, "Unknown Stripe price ID - defaulting to FREE");
    return Plan.FREE; // Default to FREE if unknown to prevent unauthorized upgrades
  }
}

export const webhookController = new WebhookController();
