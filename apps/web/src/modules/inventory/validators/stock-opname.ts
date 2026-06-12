import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@falka/config/limits';
import { z } from 'zod';

/** Create a new (empty) opname session — just an optional note to start. */
export const createStockOpnameSchema = z.object({
  note: z.string().trim().max(500).optional(),
});
export type CreateStockOpnameInput = z.infer<typeof createStockOpnameSchema>;

/** Add or update a counted line. `systemQuantity` is snapshotted server-side, never trusted from the client. */
export const upsertOpnameItemSchema = z.object({
  variantId: z.string().cuid(),
  countedQuantity: z.coerce.number().int().min(0).max(1_000_000),
});
export type UpsertOpnameItemInput = z.infer<typeof upsertOpnameItemSchema>;

export const stockOpnameIdSchema = z.object({ id: z.string().cuid() });
export const stockOpnameItemParamsSchema = z.object({
  id: z.string().cuid(),
  itemId: z.string().cuid(),
});

/** Paginated opname-session list, optionally filtered by code/note. */
export const listStockOpnameQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  search: z.string().trim().min(1).max(64).optional(),
});
export type ListStockOpnameQuery = z.infer<typeof listStockOpnameQuerySchema>;

export function parseListStockOpnameQuery(searchParams: URLSearchParams) {
  return listStockOpnameQuerySchema.safeParse({
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
    search: searchParams.get('search') ?? undefined,
  });
}

/** Variants to add to a count, matched by SKU/name, paginated. */
export const searchCountableVariantsSchema = z.object({
  q: z.string().trim().max(100).optional().default(''),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});
export type SearchCountableVariantsQuery = z.infer<typeof searchCountableVariantsSchema>;

export function parseSearchCountableVariantsQuery(searchParams: URLSearchParams) {
  return searchCountableVariantsSchema.safeParse({
    q: searchParams.get('q') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
  });
}

/** Resolve a scanned/typed code (barcode or SKU) to one variant to count. */
export const resolveCountableCodeSchema = z.object({ code: z.string().trim().min(1).max(120) });
