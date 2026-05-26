export type MarketplaceProvider = 'shopee' | 'tokopedia';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface MarketplaceConnection {
  id: string;
  organizationId: string;
  provider: MarketplaceProvider;
  shopId: string;
  shopName: string;
  isActive: boolean;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItem {
  id: string;
  organizationId: string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  currency: string;
  marketplaceProvider: MarketplaceProvider | null;
  externalProductId: string | null;
  syncStatus: SyncStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventorySyncJob {
  id: string;
  organizationId: string;
  provider: MarketplaceProvider;
  status: SyncStatus;
  itemsProcessed: number;
  itemsFailed: number;
  startedAt: Date;
  completedAt: Date | null;
}
