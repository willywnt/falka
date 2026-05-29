import type { InventoryEventType, MarketplaceSyncStatus } from '@prisma/client';
import type { ProductDimensions } from '@olshop/types';

import type { StockHealthStatus } from '../utils/stock-health';

export type ProductListItemDto = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  isActive: boolean;
  variantCount: number;
  totalStock: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductDetailDto = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductVariantListItemDto = {
  id: string;
  productId: string;
  productName: string | null;
  productBrand: string | null;
  sku: string;
  barcode: string | null;
  name: string;
  price: number;
  cost: number | null;
  isActive: boolean;
  availableStock: number;
  reservedStock: number;
  incomingStock: number;
  lowStockThreshold: number;
  alertEnabled: boolean;
  stockHealth: StockHealthStatus;
  createdAt: string;
  updatedAt: string;
  lastUpdated: string | null;
};

export type ProductVariantDetailDto = {
  id: string;
  productId: string;
  sku: string;
  barcode: string | null;
  name: string;
  price: number;
  cost: number | null;
  weight: number | null;
  dimensions: ProductDimensions | null;
  isActive: boolean;
  lowStockThreshold: number;
  alertEnabled: boolean;
  stockHealth: StockHealthStatus;
  inventory: InventoryDetailDto | null;
  product: ProductDetailDto | null;
  marketplaceMappingCount: number;
  createdAt: string;
  updatedAt: string;
};

export type InventoryDetailDto = {
  id: string;
  variantId: string;
  availableStock: number;
  reservedStock: number;
  damagedStock: number;
  incomingStock: number;
  totalOnHand: number;
  lastAdjustedAt: string | null;
  updatedAt: string;
};

export type InventoryListItemDto = {
  variantId: string;
  sku: string;
  variantName: string;
  productId: string;
  productName: string;
  availableStock: number;
  reservedStock: number;
  damagedStock: number;
  incomingStock: number;
  lowStockThreshold: number;
  stockHealth: StockHealthStatus;
  lastAdjustedAt: string | null;
};

export type InventoryEventListItemDto = {
  id: string;
  variantId: string;
  type: InventoryEventType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  actorId: string | null;
  createdAt: string;
};

export type StockMutationResultDto = {
  inventory: InventoryDetailDto;
  event: InventoryEventListItemDto;
  idempotentReplay?: boolean;
};

export type InventoryHistoryResultDto = {
  variantId: string;
  sku: string;
  variantName: string;
  events: InventoryEventListItemDto[];
};

export type InventoryOverviewDto = {
  productCount: number;
  variantCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  healthyCount: number;
  totalAvailableUnits: number;
  mutationsLast24h: number;
};

export type RecentMutationListItemDto = {
  id: string;
  variantId: string;
  sku: string;
  variantName: string;
  productName: string;
  type: InventoryEventType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string | null;
  actorId: string | null;
  createdAt: string;
};

export type MarketplaceMappingPreviewDto = {
  id: string;
  syncStatus: MarketplaceSyncStatus;
  externalSku: string | null;
  lastSyncedAt: string | null;
};

export type PaginationMetaDto = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};
