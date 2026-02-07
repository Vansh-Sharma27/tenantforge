import Stripe from "stripe";

import { stripe } from "@/config/stripe";
import { logger } from "@/utils/logger";

interface CreateCustomerParams {
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  userId: string;
  userEmail: string;
  userName: string;
}

interface CreateCheckoutSessionParams {
  customerId: string;
  priceId: string;
  workspaceId: string;
  workspaceSlug: string;
  successUrl: string;
  cancelUrl: string;
}

export class StripeService {
  /**
   * Create a new Stripe customer
   */
  async createCustomer(params: CreateCustomerParams): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.create({
        email: params.userEmail,
        name: params.userName,
        metadata: {
          userId: params.userId,
          workspaceId: params.workspaceId,
          workspaceSlug: params.workspaceSlug,
          workspaceName: params.workspaceName,
        },
      });

      logger.info(
        { customerId: customer.id, workspaceId: params.workspaceId },
        "Stripe customer created"
      );
      return customer;
    } catch (error) {
      logger.error({ error, params }, "Failed to create Stripe customer");
      throw new Error("Failed to create Stripe customer");
    }
  }

  /**
   * Retrieve a Stripe customer
   */
  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted) {
        throw new Error("Customer has been deleted");
      }
      return customer as Stripe.Customer;
    } catch (error) {
      logger.error({ error, customerId }, "Failed to retrieve Stripe customer");
      throw new Error("Failed to retrieve Stripe customer");
    }
  }

  /**
   * Retrieve a Stripe subscription
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      return await stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      logger.error({ error, subscriptionId }, "Failed to retrieve Stripe subscription");
      throw new Error("Failed to retrieve Stripe subscription");
    }
  }

  /**
   * Create a Checkout Session for subscription
   */
  async createCheckoutSession(
    params: CreateCheckoutSessionParams
  ): Promise<Stripe.Checkout.Session> {
    try {
      const session = await stripe.checkout.sessions.create({
        customer: params.customerId,
        mode: "subscription",
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: {
          workspaceId: params.workspaceId,
          workspaceSlug: params.workspaceSlug,
        },
      });

      logger.info(
        { sessionId: session.id, workspaceId: params.workspaceId },
        "Checkout session created"
      );
      return session;
    } catch (error) {
      logger.error({ error, params }, "Failed to create checkout session");
      throw new Error("Failed to create checkout session");
    }
  }

  /**
   * Create a Customer Portal session
   */
  async createPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      logger.info({ sessionId: session.id, customerId }, "Portal session created");
      return session;
    } catch (error) {
      logger.error({ error, customerId }, "Failed to create portal session");
      throw new Error("Failed to create portal session");
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): Stripe.Event {
    try {
      return stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (error) {
      logger.error({ error }, "Webhook signature verification failed");
      throw new Error("Webhook signature verification failed");
    }
  }
}

export const stripeService = new StripeService();
