import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@olshop/config/limits';
import { z } from 'zod';

/** Decimal(12,2) caps the storable money value just under 10^10. */
const MAX_MONEY = 9_999_999_999;

/** Components that make up a bundle/kit. An empty array clears the bundle. */
export const setBundleSchema = z.object({
  components: z
    .array(
      z.object({
        componentVariantId: z.string().min(1),
        quantity: z.number().int().positive().max(1000),
      }),
    )
    .max(50),
});

export type SetBundleInput = z.infer<typeof setBundleSchema>;

/** Create a bundle from scratch: the host variant's identity + its components. */
export const createBundleSchema = z.object({
  name: z.string().trim().min(1, 'Bundle name is required').max(200),
  sku: z.string().trim().min(1, 'SKU is required').max(64),
  price: z.coerce.number().nonnegative('Price must be 0 or more').max(MAX_MONEY),
  category: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
  components: setBundleSchema.shape.components.min(1, 'Add at least one component'),
});

export type CreateBundleInput = z.infer<typeof createBundleSchema>;

/** Filter + paginate the bundles list (matches the bundle's SKU / name / product name). */
export const listBundlesQuerySchema = z.object({
  q: z.string().trim().max(100).optional().default(''),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type ListBundlesQuery = z.infer<typeof listBundlesQuerySchema>;
