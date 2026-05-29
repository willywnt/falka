import { InventoryError } from '../errors/inventory-errors';

export type StockBuckets = {
  availableStock: number;
  reservedStock: number;
  damagedStock: number;
  incomingStock: number;
};

export function assertNonNegativeStock(buckets: StockBuckets): void {
  if (buckets.availableStock < 0) {
    throw InventoryError.negativeStock('Available stock');
  }
  if (buckets.reservedStock < 0) {
    throw InventoryError.negativeStock('Reserved stock');
  }
  if (buckets.damagedStock < 0) {
    throw InventoryError.negativeStock('Damaged stock');
  }
  if (buckets.incomingStock < 0) {
    throw InventoryError.negativeStock('Incoming stock');
  }
}

export function assertPositiveQuantity(quantity: number, label = 'Quantity'): void {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw InventoryError.validation(`${label} must be a positive integer.`);
  }
}

export function assertNonNegativeQuantity(quantity: number, label = 'Quantity'): void {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw InventoryError.validation(`${label} must be a non-negative integer.`);
  }
}

export function assertCanReserve(availableStock: number, quantity: number): void {
  assertPositiveQuantity(quantity);
  if (availableStock < quantity) {
    throw InventoryError.reservationOverflow(availableStock, quantity);
  }
}

export function assertCanRelease(reservedStock: number, quantity: number): void {
  assertPositiveQuantity(quantity);
  if (reservedStock < quantity) {
    throw InventoryError.insufficientReserved(reservedStock, quantity);
  }
}

export function assertCanDecrease(availableStock: number, quantity: number): void {
  assertPositiveQuantity(quantity);
  if (availableStock < quantity) {
    throw InventoryError.insufficientStock(availableStock, quantity);
  }
}

export function assertValidAdjustment(currentStock: number, targetStock: number): void {
  assertNonNegativeQuantity(targetStock, 'Target stock');
  if (currentStock === targetStock) {
    throw InventoryError.invalidAdjustment('Target stock is the same as current available stock.');
  }
}

export function computeTotalOnHand(
  buckets: Pick<StockBuckets, 'availableStock' | 'reservedStock' | 'damagedStock'>,
): number {
  return buckets.availableStock + buckets.reservedStock + buckets.damagedStock;
}

export function computeAdjustmentQuantity(currentStock: number, targetStock: number): number {
  return Math.abs(targetStock - currentStock);
}
