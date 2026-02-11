import { z } from "zod";

// Body schemas
export const createCheckoutSchema = z.object({
  plan: z.enum(["PRO", "ENTERPRISE"]),
});

export const createPortalSchema = z.object({});

// Type exports
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
export type CreatePortalInput = z.infer<typeof createPortalSchema>;
