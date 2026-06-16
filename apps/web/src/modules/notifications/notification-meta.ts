import type { NotificationCategory, NotificationSeverity, NotificationType } from '@prisma/client';

type NotificationTypeMeta = {
  category: NotificationCategory;
  /** Default severity when a producer doesn't override it. */
  severity: NotificationSeverity;
};

/**
 * `type` -> (category, default severity). An exhaustive Record so adding a new
 * NotificationType is a compile error until it's classified here. `category` is
 * derived from this map at write time (the producer only passes a `type`), and is
 * also stored on the row (denormalized) for fast filtering.
 */
export const NOTIFICATION_TYPE_META: Record<NotificationType, NotificationTypeMeta> = {
  STOCK_OVERSOLD: { category: 'INVENTORY', severity: 'URGENT' },
  RESTOCK_URGENT: { category: 'INVENTORY', severity: 'URGENT' },
  LOW_STOCK: { category: 'INVENTORY', severity: 'INFO' },
  DEAD_STOCK_CAPITAL: { category: 'INVENTORY', severity: 'INFO' },
  MARKETPLACE_CHANNEL_UNHEALTHY: { category: 'MARKETPLACE', severity: 'URGENT' },
  ORDERS_TO_SHIP: { category: 'ORDERS', severity: 'INFO' },
  RETURNS_PENDING: { category: 'RETURNS', severity: 'INFO' },
  ORDER_PLACED: { category: 'ORDERS', severity: 'INFO' },
  ORDER_SHIPPED: { category: 'ORDERS', severity: 'INFO' },
  RETURN_OPENED: { category: 'RETURNS', severity: 'WARNING' },
  RETURN_PROCESSED: { category: 'RETURNS', severity: 'INFO' },
  SALE_REFUNDED: { category: 'SALES', severity: 'INFO' },
  SALE_BELOW_COST: { category: 'SALES', severity: 'WARNING' },
  PURCHASE_RECEIVED: { category: 'PURCHASING', severity: 'SUCCESS' },
  OPNAME_POSTED: { category: 'INVENTORY', severity: 'INFO' },
  MARKETPLACE_SYNC_FAILED: { category: 'MARKETPLACE', severity: 'URGENT' },
  MARKETPLACE_TOKEN_EXPIRING: { category: 'MARKETPLACE', severity: 'WARNING' },
  TEAM_MEMBER_JOINED: { category: 'TEAM', severity: 'INFO' },
  SYSTEM: { category: 'SYSTEM', severity: 'INFO' },
};

/**
 * The tray only distinguishes urgent vs info (matching the derived feed's two
 * tones); WARNING/SUCCESS fold into 'info'.
 */
export function severityToTone(severity: NotificationSeverity): 'urgent' | 'info' {
  return severity === 'URGENT' ? 'urgent' : 'info';
}
