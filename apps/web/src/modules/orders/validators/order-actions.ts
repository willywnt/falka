import { z } from 'zod';

const trackingNumber = z.string().trim().min(1).max(64);

/** Mark a paid order shipped; optionally set/update the tracking number at the same time. */
export const markShippedSchema = z.object({
  trackingNumber: trackingNumber.optional(),
});
export type MarkShippedInput = z.infer<typeof markShippedSchema>;

/** Set or update an order's tracking number. */
export const setResiSchema = z.object({
  trackingNumber: trackingNumber,
});
export type SetResiInput = z.infer<typeof setResiSchema>;

/** Cancel an order (pre-ship); the reason is optional free text. */
export const cancelOrderSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
