import Stripe from "stripe";

import { getStripe } from "@/config/stripe";
import {
  AppError,
  BadRequestError,
  InternalServerError,
  NotFoundError,
  TooManyRequestsError,
} from "@/utils/errors";
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
   * Maps Stripe errors to appropriate AppError subclasses.
   */
  private handleStripeError(error: unknown, context: string): never {
    if (error instanceof Stripe.errors.StripeCardError) {
      throw new BadRequestError(`Card error: ${error.message}`);
    }
    if (error instanceof Stripe.errors.StripeRateLimitError) {
      throw new TooManyRequestsError("Stripe rate limit exceeded. Please try again later.");
    }
    if (error instanceof Stripe.errors.StripeInvalidRequestError) {
      // Distinguish "not found" from other invalid requests
      if (error.statusCode === 404 || error.message?.toLowerCase().includes("no such")) {
        throw new NotFoundError("Stripe resource");
      }
      throw new BadRequestError(`Invalid Stripe request: ${error.message}`);
    }
    if (error instanceof Stripe.errors.StripeAPIError) {
      throw new InternalServerError("Stripe API error. Please try again.");
    }
    logger.error({ error, context }, "Unexpected Stripe error");
    throw new InternalServerError(context);
  }

  /**
   * Create a new Stripe customer
   */
  async createCustomer(params: CreateCustomerParams): Promise<Stripe.Customer> {
    try {
      const customer = await getStripe().customers.create({
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
      this.handleStripeError(error, "Failed to create Stripe customer");
    }
  }

  /**
   * Update Stripe customer metadata
   */
  async updateCustomerMetadata(
    customerId: string,
    metadata: Record<string, string>
  ): Promise<void> {
    try {
      await getStripe().customers.update(customerId, { metadata });
      logger.info({ customerId }, "Stripe customer metadata updated");
    } catch (error) {
      logger.error({ error, customerId }, "Failed to update Stripe customer metadata");
      this.handleStripeError(error, "Failed to update Stripe customer metadata");
    }
  }

  /**
   * Delete a Stripe customer (used to clean up on DB transaction failure)
   */
  async deleteCustomer(customerId: string): Promise<void> {
    try {
      await getStripe().customers.del(customerId);
      logger.info({ customerId }, "Stripe customer deleted");
    } catch (error) {
      logger.error({ error, customerId }, "Failed to delete Stripe customer");
      // Do not rethrow — this is a cleanup call; log and continue
    }
  }

  /**
   * Retrieve a Stripe customer
   */
  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      const customer = await getStripe().customers.retrieve(customerId);
      if (customer.deleted) {
        throw new NotFoundError("Stripe customer");
      }
      return customer as Stripe.Customer;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ error, customerId }, "Failed to retrieve Stripe customer");
      this.handleStripeError(error, "Failed to retrieve Stripe customer");
    }
  }

  /**
   * Retrieve a Stripe subscription. Returns null if the subscription no longer exists.
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      return await getStripe().subscriptions.retrieve(subscriptionId);
    } catch (error) {
      if (error instanceof Stripe.errors.StripeInvalidRequestError) {
        logger.warn(
          { subscriptionId },
          "Stripe subscription not found — likely cancelled externally"
        );
        return null;
      }
      logger.error({ error, subscriptionId }, "Failed to retrieve Stripe subscription");
      this.handleStripeError(error, "Failed to retrieve Stripe subscription");
    }
  }

  /**
   * Create a Checkout Session for subscription
   */
  async createCheckoutSession(
    params: CreateCheckoutSessionParams
  ): Promise<Stripe.Checkout.Session> {
    try {
      const session = await getStripe().checkout.sessions.create({
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
      this.handleStripeError(error, "Failed to create checkout session");
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
      const session = await getStripe().billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      logger.info({ sessionId: session.id, customerId }, "Portal session created");
      return session;
    } catch (error) {
      logger.error({ error, customerId }, "Failed to create portal session");
      this.handleStripeError(error, "Failed to create portal session");
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
      return getStripe().webhooks.constructEvent(payload, signature, secret);
    } catch (error) {
      logger.error({ error }, "Webhook signature verification failed");
      throw new BadRequestError("Webhook signature verification failed");
    }
  }
}

export const stripeService = new StripeService();
