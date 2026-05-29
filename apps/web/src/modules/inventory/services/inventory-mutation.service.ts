import 'server-only';

import type { Inventory, InventoryEventType, Prisma } from '@prisma/client';
import { prisma, type TransactionClient } from '@olshop/db';

import {
  assertCanDecrease,
  assertCanRelease,
  assertCanReserve,
  assertNonNegativeStock,
  assertPositiveQuantity,
  assertValidAdjustment,
  computeAdjustmentQuantity,
} from '../domain/inventory-rules';
import {
  INVENTORY_MUTATION_METADATA_KEYS,
  type InventoryMutationContext,
  type InventoryMutationHookPayload,
  type MutationApplyResult,
  type StockBucketSnapshot,
} from '../domain/mutation.types';
import { toInventoryDetailDto, toInventoryEventListItemDto } from '../dto/inventory.mappers';
import { InventoryError } from '../errors/inventory-errors';
import {
  inventoryEventRepository,
  inventoryRepository,
  productVariantRepository,
} from '../repositories';
import type { StockMutationResultDto } from '../types';
import { onInventoryMutationFailed, onInventoryMutated } from './inventory-mutation.hooks';
import { appLogger } from '@/lib/logger';

type MutationOptions = InventoryMutationContext & {
  eventType: InventoryEventType;
  apply: (current: StockBucketSnapshot) => MutationApplyResult;
  skipSyncHook?: boolean;
};

type MutationExecutionResult = {
  dto: StockMutationResultDto;
  hookPayload: InventoryMutationHookPayload;
};

export class InventoryMutationService {
  async increaseStock(
    context: InventoryMutationContext & { quantity: number; eventType?: 'INCREASE' | 'SYNC' },
  ): Promise<StockMutationResultDto> {
    assertPositiveQuantity(context.quantity);

    return this.executeMutation({
      ...context,
      eventType: context.eventType ?? 'INCREASE',
      apply: (current) => {
        const previousStock = current.availableStock;
        const newStock = previousStock + context.quantity;

        return {
          ...current,
          availableStock: newStock,
          quantity: context.quantity,
          previousStock,
          newStock,
        };
      },
    });
  }

  async decreaseStock(
    context: InventoryMutationContext & { quantity: number },
  ): Promise<StockMutationResultDto> {
    return this.executeMutation({
      ...context,
      eventType: 'DECREASE',
      apply: (current) => {
        assertCanDecrease(current.availableStock, context.quantity);

        const previousStock = current.availableStock;
        const newStock = previousStock - context.quantity;

        return {
          ...current,
          availableStock: newStock,
          quantity: context.quantity,
          previousStock,
          newStock,
        };
      },
    });
  }

  async adjustStock(
    context: InventoryMutationContext & { targetAvailableStock: number },
  ): Promise<StockMutationResultDto> {
    return this.executeMutation({
      ...context,
      eventType: 'ADJUSTMENT',
      apply: (current) => {
        assertValidAdjustment(current.availableStock, context.targetAvailableStock);

        const previousStock = current.availableStock;
        const newStock = context.targetAvailableStock;

        return {
          ...current,
          availableStock: newStock,
          quantity: computeAdjustmentQuantity(previousStock, newStock),
          previousStock,
          newStock,
        };
      },
    });
  }

  async reserveStock(
    context: InventoryMutationContext & { quantity: number },
  ): Promise<StockMutationResultDto> {
    return this.executeMutation({
      ...context,
      eventType: 'RESERVE',
      apply: (current) => {
        assertCanReserve(current.availableStock, context.quantity);

        const previousStock = current.availableStock;
        const newStock = previousStock - context.quantity;

        return {
          availableStock: newStock,
          reservedStock: current.reservedStock + context.quantity,
          damagedStock: current.damagedStock,
          incomingStock: current.incomingStock,
          quantity: context.quantity,
          previousStock,
          newStock,
        };
      },
    });
  }

  async releaseStock(
    context: InventoryMutationContext & { quantity: number },
  ): Promise<StockMutationResultDto> {
    return this.executeMutation({
      ...context,
      eventType: 'RELEASE',
      apply: (current) => {
        assertCanRelease(current.reservedStock, context.quantity);

        const previousStock = current.availableStock;
        const newStock = previousStock + context.quantity;

        return {
          availableStock: newStock,
          reservedStock: current.reservedStock - context.quantity,
          damagedStock: current.damagedStock,
          incomingStock: current.incomingStock,
          quantity: context.quantity,
          previousStock,
          newStock,
        };
      },
    });
  }

  /**
   * Creates an empty inventory row for a new variant. Not a stock mutation.
   */
  async bootstrapEmptyInventory(variantId: string, tx: TransactionClient): Promise<Inventory> {
    const existing = await inventoryRepository.findByVariantId(variantId, tx);
    if (existing) return existing;
    return inventoryRepository.createForVariant(variantId, tx, 0);
  }

  /**
   * Applies initial stock during variant creation within an existing transaction.
   * Routes through the same mutation pipeline as runtime stock changes.
   */
  async applyInitialStock(
    context: InventoryMutationContext & { quantity: number },
    tx: TransactionClient,
  ): Promise<StockMutationResultDto> {
    if (context.quantity <= 0) {
      throw InventoryError.validation('Initial stock must be positive to apply via mutation.');
    }

    return this.executeMutation(
      {
        ...context,
        eventType: 'INCREASE',
        reason: context.reason ?? 'Initial stock on variant creation',
        metadata: {
          ...context.metadata,
          source: 'system',
          operationRef: 'variant.bootstrap',
        },
        skipSyncHook: true,
        apply: (current) => {
          const previousStock = current.availableStock;
          const newStock = previousStock + context.quantity;

          return {
            ...current,
            availableStock: newStock,
            quantity: context.quantity,
            previousStock,
            newStock,
          };
        },
      },
      tx,
    );
  }

  private async executeMutation(
    options: MutationOptions,
    existingTx?: TransactionClient,
  ): Promise<StockMutationResultDto> {
    try {
      if (existingTx) {
        const result = await this.mutateInTransaction(existingTx, options);
        return result.dto;
      }

      const result = await prisma.$transaction((tx) => this.mutateInTransaction(tx, options));

      if (!options.skipSyncHook) {
        void onInventoryMutated(result.hookPayload).catch((error) => {
          appLogger.error('inventory.mutation.hook_failed', {
            variantId: options.variantId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        });
      }

      return result.dto;
    } catch (error) {
      onInventoryMutationFailed({
        userId: options.userId,
        variantId: options.variantId,
        eventType: options.eventType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async mutateInTransaction(
    tx: TransactionClient,
    options: MutationOptions,
  ): Promise<MutationExecutionResult> {
    const idempotencyKey = options.idempotencyKey ?? options.metadata?.idempotencyKey;

    if (idempotencyKey) {
      const existingEvent = await inventoryEventRepository.findByIdempotencyKey(
        options.userId,
        options.variantId,
        idempotencyKey,
        tx,
      );

      if (existingEvent) {
        appLogger.info('inventory.mutation.idempotent_replay', {
          userId: options.userId,
          variantId: options.variantId,
          idempotencyKey,
          eventId: existingEvent.id,
        });

        const inventory = await inventoryRepository.findByVariantId(options.variantId, tx);
        if (!inventory) throw InventoryError.notFound('Inventory record not found.');

        const replayVariant = await productVariantRepository.findByIdForUser(
          options.userId,
          options.variantId,
          tx,
        );

        return {
          dto: {
            inventory: toInventoryDetailDto(inventory),
            event: toInventoryEventListItemDto(existingEvent),
            idempotentReplay: true,
          },
          hookPayload: {
            userId: options.userId,
            variantId: options.variantId,
            sku: replayVariant?.sku ?? '',
            eventId: existingEvent.id,
            eventType: existingEvent.type,
            quantity: existingEvent.quantity,
            previousStock: existingEvent.previousStock,
            newStock: existingEvent.newStock,
            actorId: existingEvent.actorId,
          },
        };
      }
    }

    const variant = await productVariantRepository.findByIdForUser(
      options.userId,
      options.variantId,
      tx,
    );

    if (!variant) throw InventoryError.notFound('Variant not found.');
    if (!variant.isActive) throw InventoryError.inactiveVariant();
    if (!variant.product.isActive) throw InventoryError.inactiveProduct();

    const inventory = await inventoryRepository.findByVariantIdForUpdate(options.variantId, tx);

    if (!inventory) throw InventoryError.notFound('Inventory record not found.');

    const currentBuckets: StockBucketSnapshot = {
      availableStock: inventory.availableStock,
      reservedStock: inventory.reservedStock,
      damagedStock: inventory.damagedStock,
      incomingStock: inventory.incomingStock,
    };

    const nextBuckets = options.apply(currentBuckets);
    assertNonNegativeStock(nextBuckets);

    const eventMetadata = this.buildEventMetadata(options, idempotencyKey);

    const updatedInventory = await inventoryRepository.updateBuckets(
      inventory.id,
      {
        availableStock: nextBuckets.availableStock,
        reservedStock: nextBuckets.reservedStock,
        damagedStock: nextBuckets.damagedStock,
        incomingStock: nextBuckets.incomingStock,
      },
      tx,
    );

    const actorId = options.actorId ?? options.userId;

    const event = await inventoryEventRepository.create(
      {
        variantId: options.variantId,
        userId: options.userId,
        type: options.eventType,
        quantity: nextBuckets.quantity,
        previousStock: nextBuckets.previousStock,
        newStock: nextBuckets.newStock,
        reason: options.reason ?? null,
        metadata: eventMetadata,
        actorId,
      },
      tx,
    );

    await tx.auditLog.create({
      data: {
        userId: options.userId,
        action: `inventory.${options.eventType.toLowerCase()}`,
        resource: 'inventory',
        metadata: {
          variantId: options.variantId,
          sku: variant.sku,
          quantity: nextBuckets.quantity,
          previousStock: nextBuckets.previousStock,
          newStock: nextBuckets.newStock,
          eventId: event.id,
          ...(idempotencyKey ? { idempotencyKey } : {}),
        },
      },
    });

    appLogger.info('inventory.mutation.applied', {
      userId: options.userId,
      variantId: options.variantId,
      sku: variant.sku,
      eventType: options.eventType,
      eventId: event.id,
      quantity: nextBuckets.quantity,
      previousStock: nextBuckets.previousStock,
      newStock: nextBuckets.newStock,
      actorId,
    });

    return {
      dto: {
        inventory: toInventoryDetailDto(updatedInventory),
        event: toInventoryEventListItemDto(event),
        idempotentReplay: false,
      },
      hookPayload: {
        userId: options.userId,
        variantId: options.variantId,
        sku: variant.sku,
        eventId: event.id,
        eventType: options.eventType,
        quantity: nextBuckets.quantity,
        previousStock: nextBuckets.previousStock,
        newStock: nextBuckets.newStock,
        actorId,
      },
    };
  }

  private buildEventMetadata(
    options: MutationOptions,
    idempotencyKey?: string,
  ): Prisma.InputJsonValue {
    const metadata: Record<string, unknown> = {
      ...(options.metadata ?? {}),
    };

    if (idempotencyKey) {
      metadata[INVENTORY_MUTATION_METADATA_KEYS.IDEMPOTENCY_KEY] = idempotencyKey;
    }

    if (!metadata[INVENTORY_MUTATION_METADATA_KEYS.SOURCE]) {
      metadata[INVENTORY_MUTATION_METADATA_KEYS.SOURCE] = 'api';
    }

    return metadata as Prisma.InputJsonValue;
  }
}

export const inventoryMutationService = new InventoryMutationService();
