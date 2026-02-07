import { z } from "zod";

// Body schemas
export const createCheckoutSchema = z.object({
  priceId: z.string().min(1, "Price ID is required"),
});

export const createPortalSchema = z.object({});

// Type exports
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
export type CreatePortalInput = z.infer<typeof createPortalSchema>;
