import { z } from 'zod';
import { InventoryEventType } from '@prisma/client';

const mutationMetadataSchema = z.record(z.unknown()).optional();

const idempotencyKeySchema = z
  .string()
  .trim()
  .min(8, 'Idempotency key must be at least 8 characters')
  .max(128)
  .regex(/^[A-Za-z0-9._:-]+$/, 'Invalid idempotency key format')
  .optional();

export const mutationReasonSchema = z.string().trim().min(1, 'Reason is required').max(500);

export const optionalMutationReasonSchema = z.string().trim().max(500).optional();

export const adjustStockSchema = z.object({
  targetAvailableStock: z.coerce
    .number()
    .int('Stock must be a whole number')
    .nonnegative('Stock cannot be negative'),
  reason: mutationReasonSchema,
  idempotencyKey: idempotencyKeySchema,
  metadata: mutationMetadataSchema,
});

export type AdjustStockInput = z.infer<typeof adjustStockSchema>;

export const reserveStockSchema = z.object({
  quantity: z.coerce.number().int().positive('Quantity must be a positive integer'),
  reason: mutationReasonSchema,
  idempotencyKey: idempotencyKeySchema,
  metadata: mutationMetadataSchema,
});

export type ReserveStockInput = z.infer<typeof reserveStockSchema>;

export const releaseStockSchema = z.object({
  quantity: z.coerce.number().int().positive('Quantity must be a positive integer'),
  reason: mutationReasonSchema,
  idempotencyKey: idempotencyKeySchema,
  metadata: mutationMetadataSchema,
});

export type ReleaseStockInput = z.infer<typeof releaseStockSchema>;

export const increaseStockSchema = z.object({
  quantity: z.coerce.number().int().positive('Quantity must be a positive integer'),
  reason: optionalMutationReasonSchema,
  idempotencyKey: idempotencyKeySchema,
  metadata: mutationMetadataSchema,
});

export type IncreaseStockInput = z.infer<typeof increaseStockSchema>;

export const decreaseStockSchema = z.object({
  quantity: z.coerce.number().int().positive('Quantity must be a positive integer'),
  reason: optionalMutationReasonSchema,
  idempotencyKey: idempotencyKeySchema,
  metadata: mutationMetadataSchema,
});

export type DecreaseStockInput = z.infer<typeof decreaseStockSchema>;

/** @deprecated Use reserveStockSchema or releaseStockSchema */
export const stockMutationSchema = z.object({
  quantity: z.coerce.number().int().positive('Quantity must be a positive integer'),
  reason: optionalMutationReasonSchema,
  metadata: mutationMetadataSchema,
});

export type StockMutationInput = z.infer<typeof stockMutationSchema>;

export const listInventoryHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
  cursor: z.string().cuid().optional(),
  type: z.nativeEnum(InventoryEventType).optional(),
  actorId: z.string().cuid().optional(),
});

export type ListInventoryHistoryQuery = z.infer<typeof listInventoryHistoryQuerySchema>;

/** @deprecated Use listInventoryHistoryQuerySchema */
export const listInventoryEventsQuerySchema = listInventoryHistoryQuerySchema;

export type ListInventoryEventsQuery = ListInventoryHistoryQuery;
