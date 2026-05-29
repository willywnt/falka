export type InventoryEventTypeName =
  | 'INCREASE'
  | 'DECREASE'
  | 'ADJUSTMENT'
  | 'RESERVE'
  | 'RELEASE'
  | 'SYNC';

export type MarketplaceSyncStatusName = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'CONFLICT';

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}
