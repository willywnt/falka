import { z } from 'zod';

/** A rate is a percent in [0, 100] with up to 2 decimals (mirrors Decimal(5,2)). */
const rateSchema = z.number().min(0).max(100);

export const updateFeeConfigSchema = z
  .object({
    qrisFeeRate: rateSchema.optional(),
    connectionRates: z
      .array(z.object({ connectionId: z.string().min(1), commissionRate: rateSchema }))
      .optional(),
  })
  .refine((value) => value.qrisFeeRate !== undefined || value.connectionRates !== undefined, {
    message: 'Tidak ada perubahan.',
  });

/** Derive a month's fee estimates from the configured rates. `month` is "YYYY-MM". */
export const deriveFeesSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Bulan harus format YYYY-MM.'),
});

export type UpdateFeeConfigInput = z.infer<typeof updateFeeConfigSchema>;
export type DeriveFeesInput = z.infer<typeof deriveFeesSchema>;
