import type { ReadonlyURLSearchParams } from 'next/navigation';

import type {
  InventoryDashboardTab,
  ListProductsQuery,
  ListVariantsQuery,
} from '../validators/queries';

export type InventoryUrlFilters = {
  tab: InventoryDashboardTab;
  page: number;
  pageSize: number;
  search: string;
  brand?: string;
  stockStatus: ListVariantsQuery['stockStatus'];
  active: ListProductsQuery['active'];
  productId?: string;
  variantId?: string;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
};

const DEFAULTS: InventoryUrlFilters = {
  tab: 'overview',
  page: 1,
  pageSize: 10,
  search: '',
  stockStatus: 'ALL',
  active: 'ALL',
  sortOrder: 'desc',
};

export function parseInventorySearchParams(
  searchParams: ReadonlyURLSearchParams | URLSearchParams,
): InventoryUrlFilters {
  const tab = searchParams.get('tab');
  const stockStatus = searchParams.get('stockStatus');
  const active = searchParams.get('active');

  return {
    tab: (tab as InventoryDashboardTab) || DEFAULTS.tab,
    page: Number(searchParams.get('page') ?? DEFAULTS.page) || 1,
    pageSize: Number(searchParams.get('pageSize') ?? DEFAULTS.pageSize) || DEFAULTS.pageSize,
    search: searchParams.get('search') ?? '',
    brand: searchParams.get('brand') ?? undefined,
    stockStatus: (stockStatus as InventoryUrlFilters['stockStatus']) || DEFAULTS.stockStatus,
    active: (active as InventoryUrlFilters['active']) || DEFAULTS.active,
    productId: searchParams.get('productId') ?? undefined,
    variantId: searchParams.get('variantId') ?? undefined,
    sortBy: searchParams.get('sortBy') ?? undefined,
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || DEFAULTS.sortOrder,
  };
}

export function serializeInventorySearchParams(filters: InventoryUrlFilters): string {
  const params = new URLSearchParams();

  if (filters.tab !== DEFAULTS.tab) params.set('tab', filters.tab);
  if (filters.page !== DEFAULTS.page) params.set('page', String(filters.page));
  if (filters.pageSize !== DEFAULTS.pageSize) params.set('pageSize', String(filters.pageSize));
  if (filters.search.trim()) params.set('search', filters.search.trim());
  if (filters.brand) params.set('brand', filters.brand);
  if (filters.stockStatus !== DEFAULTS.stockStatus) params.set('stockStatus', filters.stockStatus);
  if (filters.active !== DEFAULTS.active) params.set('active', filters.active);
  if (filters.productId) params.set('productId', filters.productId);
  if (filters.variantId) params.set('variantId', filters.variantId);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder !== DEFAULTS.sortOrder) params.set('sortOrder', filters.sortOrder);

  return params.toString();
}

export function toProductsListQuery(filters: InventoryUrlFilters): ListProductsQuery {
  return {
    page: filters.page,
    pageSize: filters.pageSize,
    search: filters.search.trim() || undefined,
    brand: filters.brand,
    active: filters.active,
    sortBy: (filters.sortBy as ListProductsQuery['sortBy']) ?? 'createdAt',
    sortOrder: filters.sortOrder,
  };
}

export function toVariantsListQuery(filters: InventoryUrlFilters): ListVariantsQuery {
  return {
    page: filters.page,
    pageSize: filters.pageSize,
    search: filters.search.trim() || undefined,
    productId: filters.productId,
    brand: filters.brand,
    stockStatus: filters.stockStatus,
    active: filters.active,
    sortBy: (filters.sortBy as ListVariantsQuery['sortBy']) ?? 'updatedAt',
    sortOrder: filters.sortOrder,
  };
}

export function buildInventoryQueryString(
  current: InventoryUrlFilters,
  patch: Partial<InventoryUrlFilters>,
): string {
  return serializeInventorySearchParams({ ...current, ...patch });
}
