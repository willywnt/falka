import { z } from 'zod';

export const trackingNumberSchema = z
  .string()
  .trim()
  .min(3, 'Resi number must be at least 3 characters')
  .max(64, 'Resi number must be at most 64 characters')
  .regex(
    /^[A-Za-z0-9_-]+$/,
    'Resi number can only contain letters, numbers, dashes, and underscores',
  );

export type TrackingNumberInput = z.infer<typeof trackingNumberSchema>;
