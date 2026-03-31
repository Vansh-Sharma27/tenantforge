import Stripe from "stripe";

import { config } from "@/config";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    if (!config.stripe?.secretKey) {
      throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
    }
    stripeClient = new Stripe(config.stripe.secretKey, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    });
  }
  return stripeClient;
}
