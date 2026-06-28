import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@palka/config/limits';
import { z } from 'zod';

/** Mirrors Prisma's OrderStatus — kept as literals so the validator stays client-safe. */
export const ORDER_STATUS_FILTER_VALUES = [
  'PENDING',
  'PAID',
  'SHIPPED',
  'COMPLETED',
  'CANCELLED',
] as const;

/** Mirrors Prisma's MarketplaceProvider — literals keep the validator client-safe. */
export const ORDER_PROVIDER_FILTER_VALUES = ['LAZADA', 'SHOPEE', 'TOKOPEDIA'] as const;

/**
 * Page + filter params for the orders list (most-recently-changed first; tenant-scoped in
 * the service). `search` matches order id / resi / buyer, case-insensitive; `provider` filters
 * by marketplace and `connectionId` by a specific store.
 */
export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  search: z.string().trim().min(1).max(64).optional(),
  status: z.enum(ORDER_STATUS_FILTER_VALUES).optional(),
  provider: z.enum(ORDER_PROVIDER_FILTER_VALUES).optional(),
  connectionId: z.string().cuid().optional(),
});

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
