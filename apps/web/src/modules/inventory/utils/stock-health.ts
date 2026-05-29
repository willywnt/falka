import { DEFAULT_LOW_STOCK_THRESHOLD } from '@olshop/config/limits';

export const STOCK_HEALTH_STATUSES = ['healthy', 'low_stock', 'out_of_stock'] as const;

export type StockHealthStatus = (typeof STOCK_HEALTH_STATUSES)[number];

export const STOCK_HEALTH_LABELS: Record<StockHealthStatus, string> = {
  healthy: 'Healthy',
  low_stock: 'Low stock',
  out_of_stock: 'Out of stock',
};

export function resolveStockHealth(
  availableStock: number,
  lowStockThreshold: number = DEFAULT_LOW_STOCK_THRESHOLD,
): StockHealthStatus {
  if (availableStock <= 0) return 'out_of_stock';
  if (availableStock <= lowStockThreshold) return 'low_stock';
  return 'healthy';
}

export function isLowStock(availableStock: number, lowStockThreshold: number): boolean {
  return availableStock > 0 && availableStock <= lowStockThreshold;
}

export function isOutOfStock(availableStock: number): boolean {
  return availableStock <= 0;
}
