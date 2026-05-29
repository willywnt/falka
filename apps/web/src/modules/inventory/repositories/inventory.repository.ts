import 'server-only';

import type { Inventory } from '@prisma/client';
import { prisma, type TransactionClient } from '@olshop/db';

export class InventoryRepository {
  async findByVariantId(variantId: string, tx?: TransactionClient) {
    const client = tx ?? prisma;
    return client.inventory.findUnique({ where: { variantId } });
  }

  /**
   * Row-level lock for transactional mutations (SELECT … FOR UPDATE).
   * Must be called inside an active transaction.
   */
  async findByVariantIdForUpdate(
    variantId: string,
    tx: TransactionClient,
  ): Promise<Inventory | null> {
    const rows = await tx.$queryRaw<Inventory[]>`
      SELECT
        id,
        "variantId",
        "availableStock",
        "reservedStock",
        "damagedStock",
        "incomingStock",
        "lastAdjustedAt",
        "createdAt",
        "updatedAt"
      FROM inventory
      WHERE "variantId" = ${variantId}
      FOR UPDATE
    `;

    return rows[0] ?? null;
  }

  async createForVariant(variantId: string, tx: TransactionClient, initialStock = 0) {
    return tx.inventory.create({
      data: {
        variantId,
        availableStock: initialStock,
        lastAdjustedAt: initialStock > 0 ? new Date() : null,
      },
    });
  }

  async updateBuckets(
    inventoryId: string,
    data: {
      availableStock: number;
      reservedStock: number;
      damagedStock: number;
      incomingStock: number;
    },
    tx: TransactionClient,
  ) {
    return tx.inventory.update({
      where: { id: inventoryId },
      data: {
        ...data,
        lastAdjustedAt: new Date(),
      },
    });
  }
}

export const inventoryRepository = new InventoryRepository();
