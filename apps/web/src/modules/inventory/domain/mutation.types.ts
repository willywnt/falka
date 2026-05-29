import type { InventoryEventType } from '@prisma/client';

/** Standard metadata envelope for all inventory mutations. */
export type InventoryMutationMetadata = {
  idempotencyKey?: string;
  source?: 'api' | 'dashboard' | 'worker' | 'system';
  operationRef?: string;
  [key: string]: unknown;
};

export type InventoryMutationContext = {
  userId: string;
  variantId: string;
  actorId?: string;
  reason?: string;
  metadata?: InventoryMutationMetadata;
  idempotencyKey?: string;
};

export type StockBucketSnapshot = {
  availableStock: number;
  reservedStock: number;
  damagedStock: number;
  incomingStock: number;
};

export type MutationApplyResult = StockBucketSnapshot & {
  quantity: number;
  previousStock: number;
  newStock: number;
};

export type InventoryMutationHookPayload = {
  userId: string;
  variantId: string;
  sku: string;
  eventId: string;
  eventType: InventoryEventType;
  quantity: number;
  previousStock: number;
  newStock: number;
  actorId: string | null;
};

export const INVENTORY_MUTATION_METADATA_KEYS = {
  IDEMPOTENCY_KEY: 'idempotencyKey',
  SOURCE: 'source',
  OPERATION_REF: 'operationRef',
} as const;
