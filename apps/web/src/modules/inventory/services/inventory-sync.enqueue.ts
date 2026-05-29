import 'server-only';

import type { InventoryMutationHookPayload } from '../domain/mutation.types';
import { appLogger } from '@/lib/logger';

export type InventorySyncJobPayload = {
  userId: string;
  variantId: string;
  sku: string;
  eventId: string;
  eventType: InventoryMutationHookPayload['eventType'];
  availableStock: number;
  enqueuedAt: string;
};

/**
 * Foundation for async marketplace stock propagation.
 * Does NOT perform sync — enqueues (or logs) for future BullMQ workers.
 */
export async function enqueueInventorySyncPropagation(
  payload: InventoryMutationHookPayload,
): Promise<void> {
  const jobPayload: InventorySyncJobPayload = {
    userId: payload.userId,
    variantId: payload.variantId,
    sku: payload.sku,
    eventId: payload.eventId,
    eventType: payload.eventType,
    availableStock: payload.newStock,
    enqueuedAt: new Date().toISOString(),
  };

  // Queue worker registration is deferred — log structured payload for now.
  // When INVENTORY_SYNC queue is wired, replace with: getQueue(QUEUE_NAMES.INVENTORY_SYNC).add(...)
  appLogger.info('inventory.sync.enqueue_prepared', {
    queue: 'inventory-sync',
    job: 'propagate-stock',
    payload: jobPayload,
  });
}
