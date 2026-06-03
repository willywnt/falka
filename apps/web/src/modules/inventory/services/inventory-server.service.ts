import 'server-only';

import { prisma } from '@olshop/db';
import type { Inventory, StockLedger } from '@prisma/client';

import { appLogger } from '@/lib/logger';

import { InventoryError } from '../errors/inventory-errors';
import type {
  AdjustStockResult,
  InventorySnapshot,
  InventoryView,
  StockLedgerEntryItem,
} from '../types';
import type { AdjustStockInput } from '../validators/adjust-stock';
import { computeBalanceAfter } from '../utils/stock-math';

const LEDGER_PAGE_SIZE = 50;

function emptySnapshot(variantId: string): InventorySnapshot {
  return {
    variantId,
    availableStock: 0,
    reservedStock: 0,
    damagedStock: 0,
    incomingStock: 0,
    lastAdjustedAt: null,
  };
}

function mapInventory(inventory: Inventory): InventorySnapshot {
  return {
    variantId: inventory.variantId,
    availableStock: inventory.availableStock,
    reservedStock: inventory.reservedStock,
    damagedStock: inventory.damagedStock,
    incomingStock: inventory.incomingStock,
    lastAdjustedAt: inventory.lastAdjustedAt?.toISOString() ?? null,
  };
}

function mapLedgerEntry(entry: StockLedger): StockLedgerEntryItem {
  return {
    id: entry.id,
    variantId: entry.variantId,
    delta: entry.delta,
    balanceAfter: entry.balanceAfter,
    reason: entry.reason,
    source: entry.source,
    referenceId: entry.referenceId,
    note: entry.note,
    createdAt: entry.createdAt.toISOString(),
  };
}

/**
 * Owns the `Inventory` (fast-read cache) and append-only `StockLedger` (source of
 * truth) tables. Every stock mutation writes a ledger row and updates the cached
 * snapshot inside a single transaction. Other modules touch stock ONLY through
 * this service.
 */
export class InventoryServerService {
  /** Idempotently create the 1:1 inventory row for a newly created variant. */
  async ensureInventory(variantId: string): Promise<InventorySnapshot> {
    const inventory = await prisma.inventory.upsert({
      where: { variantId },
      create: { variantId },
      update: {},
    });

    return mapInventory(inventory);
  }

  async getSnapshot(userId: string, variantId: string): Promise<InventorySnapshot> {
    await this.assertVariantOwned(userId, variantId);

    const inventory = await prisma.inventory.findUnique({ where: { variantId } });
    return inventory ? mapInventory(inventory) : emptySnapshot(variantId);
  }

  async getView(userId: string, variantId: string): Promise<InventoryView> {
    await this.assertVariantOwned(userId, variantId);

    const [inventory, entries] = await Promise.all([
      prisma.inventory.findUnique({ where: { variantId } }),
      prisma.stockLedger.findMany({
        where: { variantId, userId },
        orderBy: { createdAt: 'desc' },
        take: LEDGER_PAGE_SIZE,
      }),
    ]);

    return {
      snapshot: inventory ? mapInventory(inventory) : emptySnapshot(variantId),
      ledger: entries.map(mapLedgerEntry),
    };
  }

  async adjustStock(
    userId: string,
    variantId: string,
    input: AdjustStockInput,
  ): Promise<AdjustStockResult> {
    const outcome = await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findFirst({
        where: { id: variantId, userId, deletedAt: null },
        select: { id: true },
      });
      if (!variant) throw InventoryError.variantNotFound();

      const existing = await tx.inventory.findUnique({ where: { variantId } });
      const currentAvailable = existing?.availableStock ?? 0;

      const balance = computeBalanceAfter(currentAvailable, input.delta);
      if (!balance.ok) {
        if (balance.reason === 'insufficient_stock') {
          throw InventoryError.insufficientStock(currentAvailable, input.delta);
        }
        throw InventoryError.validation('Delta must not be zero.');
      }

      const now = new Date();
      const inventory = await tx.inventory.upsert({
        where: { variantId },
        create: { variantId, availableStock: balance.balanceAfter, lastAdjustedAt: now },
        update: { availableStock: balance.balanceAfter, lastAdjustedAt: now },
      });

      const entry = await tx.stockLedger.create({
        data: {
          userId,
          variantId,
          delta: input.delta,
          balanceAfter: balance.balanceAfter,
          reason: input.reason,
          source: 'MANUAL',
          note: input.note ?? null,
        },
      });

      return { inventory: mapInventory(inventory), entry: mapLedgerEntry(entry) };
    });

    appLogger.info('inventory.adjusted', {
      userId,
      variantId,
      delta: input.delta,
      reason: input.reason,
      balanceAfter: outcome.entry.balanceAfter,
    });

    return outcome;
  }

  private async assertVariantOwned(userId: string, variantId: string): Promise<void> {
    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, userId, deletedAt: null },
      select: { id: true },
    });
    if (!variant) throw InventoryError.variantNotFound();
  }
}

export const inventoryServerService = new InventoryServerService();
