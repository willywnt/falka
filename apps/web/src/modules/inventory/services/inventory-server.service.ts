import 'server-only';

import { prisma } from '@olshop/db';

import { buildUniqueSlug, slugify } from '../domain/slug';
import { INVENTORY_MUTATION_METADATA_KEYS } from '../domain/mutation.types';
import {
  inventoryEventRepository,
  inventoryQueryRepository,
  productRepository,
  productVariantRepository,
} from '../repositories';
import {
  toInventoryDetailDto,
  toInventoryEventListItemDto,
  toInventoryListItemDto,
  toInventoryOverviewDto,
  toProductDetailDto,
  toProductListItemDto,
  toProductVariantDetailDto,
  toProductVariantListItemDto,
  toRecentMutationListItemDto,
} from '../dto/inventory.mappers';
import { InventoryError } from '../errors/inventory-errors';
import type {
  InventoryDetailDto,
  InventoryEventListItemDto,
  InventoryHistoryResultDto,
  InventoryListItemDto,
  InventoryOverviewDto,
  ProductDetailDto,
  ProductListItemDto,
  ProductVariantDetailDto,
  ProductVariantListItemDto,
  RecentMutationListItemDto,
  StockMutationResultDto,
} from '../types';
import type {
  AdjustStockInput,
  CreateProductInput,
  CreateProductVariantInput,
  DecreaseStockInput,
  IncreaseStockInput,
  ListInventoryHistoryQuery,
  ListProductsQuery,
  ListRecentMutationsQuery,
  ListVariantsQuery,
  ReleaseStockInput,
  ReserveStockInput,
} from '../validators';
import type { PaginatedResult } from '@olshop/db';
import { inventoryMutationService } from './inventory-mutation.service';
import { appLogger } from '@/lib/logger';

function buildMutationContext(
  userId: string,
  variantId: string,
  input: {
    reason?: string;
    idempotencyKey?: string;
    metadata?: Record<string, unknown>;
  },
  source: 'api' | 'dashboard',
) {
  return {
    userId,
    variantId,
    actorId: userId,
    reason: input.reason,
    idempotencyKey: input.idempotencyKey,
    metadata: {
      ...input.metadata,
      [INVENTORY_MUTATION_METADATA_KEYS.SOURCE]: source,
      ...(input.idempotencyKey
        ? { [INVENTORY_MUTATION_METADATA_KEYS.IDEMPOTENCY_KEY]: input.idempotencyKey }
        : {}),
    },
  };
}

export class InventoryServerService {
  async getOverview(userId: string): Promise<InventoryOverviewDto> {
    const stats = await inventoryQueryRepository.getOverviewStats(userId);
    return toInventoryOverviewDto(stats);
  }

  async listProductsPaginated(
    userId: string,
    query: ListProductsQuery,
  ): Promise<PaginatedResult<ProductListItemDto>> {
    const result = await inventoryQueryRepository.findProductsPaginated(userId, query);
    return {
      items: result.items.map(toProductListItemDto),
      meta: result.meta,
    };
  }

  async listVariantsPaginated(
    userId: string,
    query: ListVariantsQuery,
  ): Promise<PaginatedResult<ProductVariantListItemDto>> {
    const result = await inventoryQueryRepository.findVariantsPaginated(userId, query);
    return {
      items: result.items.map(toProductVariantListItemDto),
      meta: result.meta,
    };
  }

  async getVariantDetail(userId: string, variantId: string): Promise<ProductVariantDetailDto> {
    const variant = await inventoryQueryRepository.findVariantDetail(userId, variantId);
    if (!variant) throw InventoryError.notFound('Variant not found.');
    return toProductVariantDetailDto(variant);
  }

  async listRecentMutations(
    userId: string,
    query: ListRecentMutationsQuery,
  ): Promise<RecentMutationListItemDto[]> {
    const events = await inventoryQueryRepository.findRecentMutations(userId, query.limit);
    return events.map(toRecentMutationListItemDto);
  }

  async listBrands(userId: string): Promise<string[]> {
    return inventoryQueryRepository.listBrands(userId);
  }

  async listProducts(userId: string): Promise<ProductListItemDto[]> {
    const products = await productRepository.findManyByUser(userId);
    return products.map(toProductListItemDto);
  }

  async createProduct(userId: string, input: CreateProductInput): Promise<ProductDetailDto> {
    const existingSlugs = await productRepository.findSlugsByUser(userId);
    const slug = input.slug ?? buildUniqueSlug(slugify(input.name), existingSlugs);

    if (input.slug && existingSlugs.includes(input.slug)) {
      throw InventoryError.duplicateSlug();
    }

    const product = await prisma.$transaction(async (tx) => {
      const created = await productRepository.create(
        {
          userId,
          name: input.name,
          slug,
          brand: input.brand ?? null,
          description: input.description ?? null,
          isActive: input.isActive,
        },
        tx,
      );

      await tx.auditLog.create({
        data: {
          userId,
          action: 'inventory.product.created',
          resource: 'product',
          metadata: { productId: created.id, slug: created.slug, name: created.name },
        },
      });

      return created;
    });

    appLogger.info('inventory.product.created', {
      userId,
      productId: product.id,
      slug: product.slug,
    });

    return toProductDetailDto(product);
  }

  async listVariants(userId: string, productId?: string): Promise<ProductVariantListItemDto[]> {
    if (productId) {
      const product = await productRepository.findByIdForUser(userId, productId);
      if (!product) throw InventoryError.notFound('Product not found.');

      const variants = await productVariantRepository.findManyByProduct(userId, productId);
      return variants.map(toProductVariantListItemDto);
    }

    const variants = await productVariantRepository.findManyByUser(userId);
    return variants.map(toProductVariantListItemDto);
  }

  async createVariant(
    userId: string,
    input: CreateProductVariantInput,
  ): Promise<ProductVariantDetailDto> {
    const product = await productRepository.findByIdForUser(userId, input.productId);
    if (!product) throw InventoryError.notFound('Product not found.');
    if (!product.isActive) throw InventoryError.inactiveProduct();

    const existingSku = await productVariantRepository.findBySkuForUser(userId, input.sku);
    if (existingSku) throw InventoryError.duplicateSku();

    const variant = await prisma.$transaction(async (tx) => {
      const created = await productVariantRepository.create(
        {
          productId: input.productId,
          userId,
          sku: input.sku,
          barcode: input.barcode ?? null,
          name: input.name,
          price: input.price,
          cost: input.cost ?? null,
          weight: input.weight ?? null,
          dimensions: input.dimensions ?? undefined,
          isActive: input.isActive,
        },
        tx,
      );

      await inventoryMutationService.bootstrapEmptyInventory(created.id, tx);

      if (input.initialStock > 0) {
        await inventoryMutationService.applyInitialStock(
          {
            userId,
            variantId: created.id,
            actorId: userId,
            quantity: input.initialStock,
          },
          tx,
        );
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'inventory.variant.created',
          resource: 'product_variant',
          metadata: {
            variantId: created.id,
            productId: created.productId,
            sku: created.sku,
            initialStock: input.initialStock,
          },
        },
      });

      const withInventory = await productVariantRepository.findByIdForUser(userId, created.id, tx);
      return withInventory ?? { ...created, inventory: null, product };
    });

    appLogger.info('inventory.variant.created', {
      userId,
      variantId: variant.id,
      sku: variant.sku,
      initialStock: input.initialStock,
    });

    return toProductVariantDetailDto(variant);
  }

  async getInventory(userId: string, variantId: string): Promise<InventoryDetailDto> {
    const variant = await productVariantRepository.findByIdForUser(userId, variantId);
    if (!variant) throw InventoryError.notFound('Variant not found.');
    if (!variant.inventory) throw InventoryError.notFound('Inventory record not found.');

    return toInventoryDetailDto(variant.inventory);
  }

  async listInventory(userId: string): Promise<InventoryListItemDto[]> {
    const variants = await productVariantRepository.findManyByUser(userId);
    return variants.map(toInventoryListItemDto);
  }

  async adjustStock(
    userId: string,
    variantId: string,
    input: AdjustStockInput,
    source: 'api' | 'dashboard' = 'api',
  ): Promise<StockMutationResultDto> {
    return inventoryMutationService.adjustStock({
      ...buildMutationContext(userId, variantId, input, source),
      targetAvailableStock: input.targetAvailableStock,
    });
  }

  async reserveStock(
    userId: string,
    variantId: string,
    input: ReserveStockInput,
    source: 'api' | 'dashboard' = 'api',
  ): Promise<StockMutationResultDto> {
    return inventoryMutationService.reserveStock({
      ...buildMutationContext(userId, variantId, input, source),
      quantity: input.quantity,
    });
  }

  async releaseStock(
    userId: string,
    variantId: string,
    input: ReleaseStockInput,
    source: 'api' | 'dashboard' = 'api',
  ): Promise<StockMutationResultDto> {
    return inventoryMutationService.releaseStock({
      ...buildMutationContext(userId, variantId, input, source),
      quantity: input.quantity,
    });
  }

  async increaseStock(
    userId: string,
    variantId: string,
    input: IncreaseStockInput,
  ): Promise<StockMutationResultDto> {
    return inventoryMutationService.increaseStock({
      ...buildMutationContext(userId, variantId, input, 'api'),
      quantity: input.quantity,
    });
  }

  async decreaseStock(
    userId: string,
    variantId: string,
    input: DecreaseStockInput,
  ): Promise<StockMutationResultDto> {
    return inventoryMutationService.decreaseStock({
      ...buildMutationContext(userId, variantId, input, 'api'),
      quantity: input.quantity,
    });
  }

  async getInventoryHistory(
    userId: string,
    variantId: string,
    query: ListInventoryHistoryQuery,
  ): Promise<InventoryHistoryResultDto> {
    const variant = await productVariantRepository.findByIdForUser(userId, variantId);
    if (!variant) throw InventoryError.notFound('Variant not found.');

    const events = await inventoryEventRepository.findTimeline(userId, variantId, {
      limit: query.limit,
      cursor: query.cursor,
      type: query.type,
      actorId: query.actorId,
    });

    return {
      variantId,
      sku: variant.sku,
      variantName: variant.name,
      events: events.map(toInventoryEventListItemDto),
    };
  }

  /** @deprecated Use getInventoryHistory */
  async listInventoryEvents(
    userId: string,
    variantId: string,
    query: ListInventoryHistoryQuery,
  ): Promise<InventoryEventListItemDto[]> {
    const history = await this.getInventoryHistory(userId, variantId, query);
    return history.events;
  }
}

export const inventoryServerService = new InventoryServerService();
