import 'server-only';

import type { InventoryEvent, InventoryEventType, Prisma } from '@prisma/client';
import { prisma, type TransactionClient } from '@olshop/db';

import { INVENTORY_MUTATION_METADATA_KEYS } from '../domain/mutation.types';

export type InventoryEventTimelineQuery = {
  limit?: number;
  cursor?: string;
  type?: InventoryEventType;
  actorId?: string;
};

export class InventoryEventRepository {
  async create(
    data: {
      variantId: string;
      userId: string;
      type: InventoryEvent['type'];
      quantity: number;
      previousStock: number;
      newStock: number;
      reason?: string | null;
      metadata?: Prisma.InputJsonValue;
      actorId?: string | null;
    },
    tx: TransactionClient,
  ) {
    return tx.inventoryEvent.create({
      data: {
        variantId: data.variantId,
        userId: data.userId,
        type: data.type,
        quantity: data.quantity,
        previousStock: data.previousStock,
        newStock: data.newStock,
        reason: data.reason ?? null,
        metadata: data.metadata,
        actorId: data.actorId ?? null,
      },
    });
  }

  async findByIdempotencyKey(
    userId: string,
    variantId: string,
    idempotencyKey: string,
    tx?: TransactionClient,
  ) {
    const client = tx ?? prisma;

    return client.inventoryEvent.findFirst({
      where: {
        userId,
        variantId,
        metadata: {
          path: [INVENTORY_MUTATION_METADATA_KEYS.IDEMPOTENCY_KEY],
          equals: idempotencyKey,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findTimeline(userId: string, variantId: string, query: InventoryEventTimelineQuery = {}) {
    return prisma.inventoryEvent.findMany({
      where: {
        userId,
        variantId,
        ...(query.type ? { type: query.type } : {}),
        ...(query.actorId ? { actorId: query.actorId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit ?? 50,
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
    });
  }

  async findByIdForUser(userId: string, eventId: string) {
    return prisma.inventoryEvent.findFirst({
      where: { id: eventId, userId },
    });
  }
}

export const inventoryEventRepository = new InventoryEventRepository();
