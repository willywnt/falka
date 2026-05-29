import type { Inventory, InventoryEvent, Product, ProductVariant } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import type { ProductDimensions } from '@olshop/types';

import { resolveStockHealth } from '../utils/stock-health';
import type {
  InventoryDetailDto,
  InventoryEventListItemDto,
  InventoryListItemDto,
  InventoryOverviewDto,
  ProductDetailDto,
  ProductListItemDto,
  ProductVariantDetailDto,
  ProductVariantListItemDto,
  RecentMutationListItemDto,
} from '../dto/inventory.dto';
import type { RecentMutationRow } from '../repositories/inventory-query.repository';

function decimalToNumber(value: Prisma.Decimal | null | undefined): number | null {
  if (value == null) return null;
  return Number(value);
}

export function toProductListItemDto(
  product: Product & {
    _count: { variants: number };
    variants?: Array<{ inventory: { availableStock: number } | null }>;
  },
): ProductListItemDto {
  const totalStock =
    product.variants?.reduce((sum, variant) => sum + (variant.inventory?.availableStock ?? 0), 0) ??
    0;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    isActive: product.isActive,
    variantCount: product._count.variants,
    totalStock,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export function toProductDetailDto(product: Product): ProductDetailDto {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    description: product.description,
    isActive: product.isActive,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export function toProductVariantListItemDto(
  variant: ProductVariant & {
    inventory: {
      availableStock: number;
      reservedStock: number;
      incomingStock: number;
      lastAdjustedAt: Date | null;
      updatedAt: Date;
    } | null;
    product?: Pick<Product, 'id' | 'name' | 'slug' | 'brand'>;
  },
): ProductVariantListItemDto {
  const availableStock = variant.inventory?.availableStock ?? 0;

  return {
    id: variant.id,
    productId: variant.productId,
    productName: variant.product?.name ?? null,
    productBrand: variant.product?.brand ?? null,
    sku: variant.sku,
    barcode: variant.barcode,
    name: variant.name,
    price: Number(variant.price),
    cost: decimalToNumber(variant.cost),
    isActive: variant.isActive,
    availableStock,
    reservedStock: variant.inventory?.reservedStock ?? 0,
    incomingStock: variant.inventory?.incomingStock ?? 0,
    lowStockThreshold: variant.lowStockThreshold,
    alertEnabled: variant.alertEnabled,
    stockHealth: resolveStockHealth(availableStock, variant.lowStockThreshold),
    createdAt: variant.createdAt.toISOString(),
    updatedAt: variant.updatedAt.toISOString(),
    lastUpdated: (variant.inventory?.lastAdjustedAt ?? variant.updatedAt).toISOString(),
  };
}

export function toProductVariantDetailDto(
  variant: ProductVariant & {
    inventory: Inventory | null;
    product?: Product | null;
    marketplaceMappings?: Array<{ id: string }>;
  },
): ProductVariantDetailDto {
  const availableStock = variant.inventory?.availableStock ?? 0;

  return {
    id: variant.id,
    productId: variant.productId,
    sku: variant.sku,
    barcode: variant.barcode,
    name: variant.name,
    price: Number(variant.price),
    cost: decimalToNumber(variant.cost),
    weight: decimalToNumber(variant.weight),
    dimensions: variant.dimensions as ProductDimensions | null,
    isActive: variant.isActive,
    lowStockThreshold: variant.lowStockThreshold,
    alertEnabled: variant.alertEnabled,
    stockHealth: resolveStockHealth(availableStock, variant.lowStockThreshold),
    inventory: variant.inventory ? toInventoryDetailDto(variant.inventory) : null,
    product: variant.product ? toProductDetailDto(variant.product) : null,
    marketplaceMappingCount: variant.marketplaceMappings?.length ?? 0,
    createdAt: variant.createdAt.toISOString(),
    updatedAt: variant.updatedAt.toISOString(),
  };
}

export function toInventoryDetailDto(inventory: Inventory): InventoryDetailDto {
  return {
    id: inventory.id,
    variantId: inventory.variantId,
    availableStock: inventory.availableStock,
    reservedStock: inventory.reservedStock,
    damagedStock: inventory.damagedStock,
    incomingStock: inventory.incomingStock,
    totalOnHand: inventory.availableStock + inventory.reservedStock + inventory.damagedStock,
    lastAdjustedAt: inventory.lastAdjustedAt?.toISOString() ?? null,
    updatedAt: inventory.updatedAt.toISOString(),
  };
}

export function toInventoryListItemDto(
  variant: ProductVariant & {
    inventory: Inventory | null;
    product?: Pick<Product, 'id' | 'name' | 'slug'>;
  },
): InventoryListItemDto {
  const availableStock = variant.inventory?.availableStock ?? 0;

  return {
    variantId: variant.id,
    sku: variant.sku,
    variantName: variant.name,
    productId: variant.productId,
    productName: variant.product?.name ?? '',
    availableStock,
    reservedStock: variant.inventory?.reservedStock ?? 0,
    damagedStock: variant.inventory?.damagedStock ?? 0,
    incomingStock: variant.inventory?.incomingStock ?? 0,
    lowStockThreshold: variant.lowStockThreshold,
    stockHealth: resolveStockHealth(availableStock, variant.lowStockThreshold),
    lastAdjustedAt: variant.inventory?.lastAdjustedAt?.toISOString() ?? null,
  };
}

export function toInventoryEventListItemDto(event: InventoryEvent): InventoryEventListItemDto {
  return {
    id: event.id,
    variantId: event.variantId,
    type: event.type,
    quantity: event.quantity,
    previousStock: event.previousStock,
    newStock: event.newStock,
    reason: event.reason,
    metadata: event.metadata as Record<string, unknown> | null,
    actorId: event.actorId,
    createdAt: event.createdAt.toISOString(),
  };
}

export function toInventoryOverviewDto(stats: {
  productCount: number;
  variantCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  healthyCount: number;
  totalAvailableUnits: number;
  mutationsLast24h: number;
}): InventoryOverviewDto {
  return stats;
}

export function toRecentMutationListItemDto(event: RecentMutationRow): RecentMutationListItemDto {
  return {
    id: event.id,
    variantId: event.variantId,
    sku: event.variant.sku,
    variantName: event.variant.name,
    productName: event.variant.product.name,
    type: event.type,
    quantity: event.quantity,
    previousStock: event.previousStock,
    newStock: event.newStock,
    reason: event.reason,
    actorId: event.actorId,
    createdAt: event.createdAt.toISOString(),
  };
}
