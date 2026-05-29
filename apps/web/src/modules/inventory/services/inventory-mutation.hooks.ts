import 'server-only';

import type { InventoryMutationHookPayload } from '../domain/mutation.types';
import { appLogger } from '@/lib/logger';

import { enqueueInventorySyncPropagation } from './inventory-sync.enqueue';

/**
 * Post-mutation hook — extensible foundation for BullMQ sync propagation.
 * Called after successful transactional commit (fire-and-forget safe).
 */
export async function onInventoryMutated(payload: InventoryMutationHookPayload): Promise<void> {
  appLogger.info('inventory.mutation.completed', {
    userId: payload.userId,
    variantId: payload.variantId,
    sku: payload.sku,
    eventId: payload.eventId,
    eventType: payload.eventType,
    quantity: payload.quantity,
    previousStock: payload.previousStock,
    newStock: payload.newStock,
    actorId: payload.actorId,
  });

  try {
    await enqueueInventorySyncPropagation(payload);
  } catch (error) {
    appLogger.error('inventory.mutation.sync_enqueue_failed', {
      variantId: payload.variantId,
      eventId: payload.eventId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export function onInventoryMutationFailed(payload: {
  userId: string;
  variantId: string;
  eventType: string;
  error: string;
}): void {
  appLogger.error('inventory.mutation.failed', payload);
}
