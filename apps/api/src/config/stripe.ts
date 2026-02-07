import Stripe from "stripe";

import { config } from "@/config";

if (!config.stripe?.secretKey) {
  throw new Error("Stripe secret key is not configured");
}

const stripe: Stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: "2026-01-28.clover",
  typescript: true,
});

export { stripe };
