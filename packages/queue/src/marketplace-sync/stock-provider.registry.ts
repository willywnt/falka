import type { MarketplaceProvider } from '@prisma/client';

import { MarketplaceSyncError } from './sync-errors.js';
import type {
  NormalizedStockUpdateRequest,
  NormalizedStockUpdateResponse,
} from './stock-normalizer.js';

export type StockProviderUpdateParams = NormalizedStockUpdateRequest & { accessToken: string };

export interface MarketplaceStockProviderAdapter {
  readonly provider: MarketplaceProvider;
  updateStock(params: StockProviderUpdateParams): Promise<NormalizedStockUpdateResponse>;
  validateStockSync(accessToken: string): Promise<{ ready: boolean; reason?: string }>;
}

/** Simulates a successful push so the whole pipeline is exercisable without real APIs. */
export class DevMarketplaceStockProvider implements MarketplaceStockProviderAdapter {
  constructor(readonly provider: MarketplaceProvider) {}

  updateStock(params: StockProviderUpdateParams): Promise<NormalizedStockUpdateResponse> {
    return Promise.resolve({
      success: true,
      externalStock: params.quantity,
      raw: { simulated: true, provider: this.provider, quantity: params.quantity },
    });
  }

  validateStockSync(): Promise<{ ready: boolean }> {
    return Promise.resolve({ ready: true });
  }
}

/** Stand-in for a provider whose real adapter has not been wired yet. */
export class UnwiredMarketplaceStockProvider implements MarketplaceStockProviderAdapter {
  constructor(readonly provider: MarketplaceProvider) {}

  updateStock(): Promise<NormalizedStockUpdateResponse> {
    return Promise.reject(
      MarketplaceSyncError.providerUnavailable(`No stock adapter wired for ${this.provider}.`),
    );
  }

  validateStockSync(): Promise<{ ready: boolean; reason?: string }> {
    return Promise.resolve({ ready: false, reason: 'Provider adapter not wired.' });
  }
}

const registry = new Map<MarketplaceProvider, MarketplaceStockProviderAdapter>();

export function registerMarketplaceStockProvider(adapter: MarketplaceStockProviderAdapter): void {
  registry.set(adapter.provider, adapter);
}

/** Defaults to the Dev (simulated) adapter so stubbed end-to-end sync works today. */
export function getMarketplaceStockProvider(
  provider: MarketplaceProvider,
): MarketplaceStockProviderAdapter {
  const existing = registry.get(provider);
  if (existing) return existing;

  const adapter = new DevMarketplaceStockProvider(provider);
  registry.set(provider, adapter);
  return adapter;
}
