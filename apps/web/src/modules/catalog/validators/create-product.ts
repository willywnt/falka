import { z } from 'zod';

/** Decimal(12,2) caps the storable money value just under 10^10. */
const MAX_MONEY = 9_999_999_999;
/** Decimal(10,3) caps the storable weight just under 10^7. */
const MAX_WEIGHT = 9_999_999;
const MAX_STOCK = 1_000_000_000;

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value === '' ? undefined : value));

export const createVariantSchema = z.object({
  sku: z.string().trim().min(1, 'SKU is required').max(64),
  name: z.string().trim().min(1, 'Variant name is required').max(200),
  barcode: optionalTrimmed(64),
  price: z.coerce.number().nonnegative('Price must be 0 or more').max(MAX_MONEY),
  cost: z.coerce.number().nonnegative().max(MAX_MONEY).optional(),
  weight: z.coerce.number().nonnegative().max(MAX_WEIGHT).optional(),
  lowStockThreshold: z.coerce.number().int().nonnegative().max(MAX_STOCK).default(0),
  alertEnabled: z.boolean().default(true),
  initialStock: z.coerce.number().int().nonnegative().max(MAX_STOCK).default(0),
});

export type CreateVariantInput = z.infer<typeof createVariantSchema>;

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required').max(200),
  description: optionalTrimmed(2000),
  category: optionalTrimmed(100),
  variant: createVariantSchema,
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
