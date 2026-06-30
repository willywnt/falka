import 'server-only';

import { prisma } from '@palka/db';
import {
  computeStockDrift,
  findDriftMappedListings,
  resolveSyncWarehouseStock,
} from '@palka/queue';
import type { DriftExternalInput } from '@palka/queue';
import type { MarketplaceProvider } from '@prisma/client';

import { appLogger } from '@/lib/logger';

import { getMarketplaceImportAdapter } from '../adapters/import-adapter';
import { MarketplaceError } from '../errors/marketplace-errors';
import type { MarketplaceDriftReport } from '../types';
import { runWithFreshConnectionToken } from './connection-token.service';

/**
 * On-demand drift reconciliation: pulls a connection's CURRENT external stock
 * (read-only, no snapshot write) and compares each mapped variant's provider stock
 * against internal available. Surfaces over/under/missing drift so staff can re-sync;
 * never writes back to the marketplace and never overwrites internal stock. Pulls only
 * the MAPPED items when the adapter supports it (no full-catalog scan).
 */
export class MarketplaceReconciliationService {
  async checkDrift(organizationId: string, connectionId: string): Promise<MarketplaceDriftReport> {
    const connection = await prisma.marketplaceConnection.findFirst({
      where: { id: connectionId, organizationId, deletedAt: null },
    });
    if (!connection) throw MarketplaceError.notFound();
    if (!connection.isActive) {
      throw MarketplaceError.validation('Marketplace connection is not active.');
    }

    const [mapped, totalListings] = await Promise.all([
      findDriftMappedListings(organizationId, connectionId),
      prisma.marketplaceProduct.count({
        where: { marketplaceConnectionId: connectionId, organizationId, deletedAt: null },
      }),
    ]);

    // Nothing mapped → nothing to reconcile; skip the provider call entirely.
    const base =
      mapped.length === 0
        ? computeStockDrift({ mapped: [], external: [] })
        : computeStockDrift({
            mapped,
            external: await this.fetchExternalStock(connection, mapped),
          });
    // With a sync warehouse configured, `external` already reflects only that warehouse's
    // sellable (set in fetchExternalStock) — so drift compares apples to apples: internal
    // available vs the ONE warehouse Palka owns, not the cross-warehouse sum.

    // Per-item drift pulls ONLY the mapped items, so the computed unmappedExternal is
    // meaningless — report the real "listings not yet mapped" count from the DB instead.
    const summary = { ...base, unmappedExternal: Math.max(0, totalListings - mapped.length) };

    appLogger.info('marketplace.drift.checked', {
      organizationId,
      connectionId,
      provider: connection.provider,
      drifted: summary.drifted,
      missingExternal: summary.missingExternal,
      unmappedExternal: summary.unmappedExternal,
    });

    return {
      connectionId,
      provider: connection.provider,
      shopName: connection.shopName,
      checkedAt: new Date().toISOString(),
      summary,
    };
  }

  /**
   * Current external stock for the mapped items — only those items (one provider call
   * each when the adapter supports it), not the whole catalog. Falls back to a full
   * listings pull for adapters without per-item fetch (the tiny stub).
   */
  private async fetchExternalStock(
    connection: {
      id: string;
      provider: MarketplaceProvider;
      shopId: string;
      externalShopCipher: string | null;
      encryptedAccessToken: string;
      encryptedRefreshToken: string | null;
      tokenExpiresAt: Date | null;
      syncWarehouseCode: string | null;
    },
    mapped: { externalProductId: string }[],
  ): Promise<DriftExternalInput[]> {
    const adapter = getMarketplaceImportAdapter(connection.provider);
    const externalProductIds = [...new Set(mapped.map((item) => item.externalProductId))];

    // Same proactive + reactive token refresh as sync/import — a near-expiry or already-dead token
    // self-heals here too (stub adapters ignore the token).
    const listings = await runWithFreshConnectionToken(connection, (accessToken) =>
      adapter.fetchListingsForItems && externalProductIds.length > 0
        ? adapter.fetchListingsForItems({
            shopId: connection.shopId,
            shopCipher: connection.externalShopCipher,
            accessToken,
            externalProductIds,
          })
        : adapter.fetchListings({
            shopId: connection.shopId,
            shopCipher: connection.externalShopCipher,
            accessToken,
          }),
    );

    return listings.map((listing) => ({
      externalProductId: listing.externalProductId,
      externalVariantId: listing.externalVariantId,
      // Palka owns ONE warehouse: compare against its own sellable (0 if the SKU doesn't carry
      // it), not the cross-warehouse sum. Falls back to total sellable when unconfigured.
      stock: resolveSyncWarehouseStock(listing, connection.syncWarehouseCode),
    }));
  }
}

export const marketplaceReconciliationService = new MarketplaceReconciliationService();
