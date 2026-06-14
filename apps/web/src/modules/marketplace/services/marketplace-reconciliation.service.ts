import 'server-only';

import { prisma } from '@falka/db';
import { computeStockDrift } from '@falka/queue';
import type { DriftExternalInput, DriftMappedInput } from '@falka/queue';

import { appLogger } from '@/lib/logger';

import { getMarketplaceImportAdapter } from '../adapters/import-adapter';
import { MarketplaceError } from '../errors/marketplace-errors';
import type { MarketplaceDriftReport } from '../types';
import { marketplaceEncryptionService } from './encryption.service';

/**
 * On-demand drift reconciliation: pulls a connection's CURRENT external listings
 * (read-only, no snapshot write) and compares each mapped variant's provider stock
 * against internal available. Surfaces over/under/missing drift so staff can re-sync;
 * never writes back to the marketplace and never overwrites internal stock.
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

    const listingRows = await prisma.marketplaceProduct.findMany({
      where: {
        marketplaceConnectionId: connectionId,
        organizationId,
        deletedAt: null,
        mapping: { isNot: null },
      },
      select: {
        id: true,
        externalProductId: true,
        externalVariantId: true,
        externalSku: true,
        mapping: {
          select: {
            syncEnabled: true,
            productVariant: {
              select: {
                id: true,
                sku: true,
                name: true,
                product: { select: { name: true } },
                inventory: { select: { availableStock: true } },
              },
            },
          },
        },
      },
    });

    const mapped: DriftMappedInput[] = [];
    for (const row of listingRows) {
      if (!row.mapping) continue;
      const variant = row.mapping.productVariant;
      mapped.push({
        marketplaceProductId: row.id,
        externalProductId: row.externalProductId,
        externalVariantId: row.externalVariantId,
        externalSku: row.externalSku,
        variantId: variant.id,
        variantSku: variant.sku,
        variantName: variant.name,
        productName: variant.product.name,
        internalAvailable: variant.inventory?.availableStock ?? 0,
        syncEnabled: row.mapping.syncEnabled,
      });
    }

    const adapter = getMarketplaceImportAdapter(connection.provider);
    const listings = await adapter.fetchListings({
      shopId: connection.shopId,
      // Stub adapters ignore the token; seeded connections store a non-cipher
      // placeholder, so decrypt leniently and let a real adapter fail its own auth.
      accessToken:
        marketplaceEncryptionService.safeDecryptToken(connection.encryptedAccessToken) ?? '',
    });

    const external: DriftExternalInput[] = listings.map((listing) => ({
      externalProductId: listing.externalProductId,
      externalVariantId: listing.externalVariantId,
      stock: listing.stock,
    }));

    const summary = computeStockDrift({ mapped, external });

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
}

export const marketplaceReconciliationService = new MarketplaceReconciliationService();
