import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@olshop/config/limits';
import { z } from 'zod';

export const STOCK_STATUS_FILTERS = ['ALL', 'HEALTHY', 'LOW_STOCK', 'OUT_OF_STOCK'] as const;
export type StockStatusFilter = (typeof STOCK_STATUS_FILTERS)[number];

export const ACTIVE_STATUS_FILTERS = ['ALL', 'ACTIVE', 'INACTIVE'] as const;
export type ActiveStatusFilter = (typeof ACTIVE_STATUS_FILTERS)[number];

export const PRODUCT_SORT_FIELDS = ['createdAt', 'name', 'variantCount', 'totalStock'] as const;
export type ProductSortField = (typeof PRODUCT_SORT_FIELDS)[number];

export const VARIANT_SORT_FIELDS = ['createdAt', 'sku', 'availableStock', 'updatedAt'] as const;
export type VariantSortField = (typeof VARIANT_SORT_FIELDS)[number];

const paginationSchema = {
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
};

export const listProductsQuerySchema = z.object({
  ...paginationSchema,
  search: z.string().trim().max(100).optional(),
  brand: z.string().trim().max(100).optional(),
  active: z.enum(ACTIVE_STATUS_FILTERS).default('ALL'),
  sortBy: z.enum(PRODUCT_SORT_FIELDS).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

export const listVariantsQuerySchema = z.object({
  ...paginationSchema,
  search: z.string().trim().max(100).optional(),
  productId: z.string().cuid().optional(),
  brand: z.string().trim().max(100).optional(),
  stockStatus: z.enum(STOCK_STATUS_FILTERS).default('ALL'),
  active: z.enum(ACTIVE_STATUS_FILTERS).default('ALL'),
  sortBy: z.enum(VARIANT_SORT_FIELDS).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListVariantsQuery = z.infer<typeof listVariantsQuerySchema>;

export const listRecentMutationsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export type ListRecentMutationsQuery = z.infer<typeof listRecentMutationsQuerySchema>;

export const INVENTORY_DASHBOARD_TABS = [
  'overview',
  'products',
  'variants',
  'inventory',
  'timeline',
] as const;

export type InventoryDashboardTab = (typeof INVENTORY_DASHBOARD_TABS)[number];
