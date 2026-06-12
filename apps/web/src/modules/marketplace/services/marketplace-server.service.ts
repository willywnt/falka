import 'server-only';

import { prisma } from '@falka/db';
import type { MarketplaceProvider, MarketplaceConnection } from '@prisma/client';

import { MarketplaceError } from '../errors/marketplace-errors';
import type {
  MarketplaceConnectionDetail,
  MarketplaceConnectionListItem,
  MarketplaceConnectionStatus,
} from '../types';
import type { CreateMarketplaceConnectionInput } from '../validators/create-connection';
import { getTokenStatus } from '../utils/token-lifecycle';
import { isSupportedMarketplaceProvider } from './provider.registry';
import { marketplaceEncryptionService } from './encryption.service';
import { appLogger } from '@/lib/logger';

function resolveConnectionStatus(
  isActive: boolean,
  tokenExpiresAt: Date | null,
): MarketplaceConnectionStatus {
  if (!isActive) return 'disconnected';
  if (getTokenStatus(tokenExpiresAt) === 'expired') return 'expired';
  return 'connected';
}

function mapConnection(connection: MarketplaceConnection): MarketplaceConnectionListItem {
  const tokenStatus = getTokenStatus(connection.tokenExpiresAt);

  return {
    id: connection.id,
    provider: connection.provider,
    shopId: connection.shopId,
    shopName: connection.shopName,
    isActive: connection.isActive,
    tokenExpiresAt: connection.tokenExpiresAt?.toISOString() ?? null,
    tokenStatus,
    connectionStatus: resolveConnectionStatus(connection.isActive, connection.tokenExpiresAt),
    createdAt: connection.createdAt.toISOString(),
    updatedAt: connection.updatedAt.toISOString(),
  };
}

export class MarketplaceServerService {
  async listConnections(organizationId: string): Promise<MarketplaceConnectionListItem[]> {
    // Sync-health rollup per store: listings awaiting review + failed pushes,
    // so the connections list can flag trouble without opening each detail.
    const [connections, reviewCounts, failedCounts] = await Promise.all([
      prisma.marketplaceConnection.findMany({
        where: {
          organizationId,
          deletedAt: null,
        },
        orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.marketplaceProductMapping.groupBy({
        by: ['marketplaceConnectionId'],
        where: { organizationId, mappingStatus: 'NEEDS_REVIEW' },
        _count: { _all: true },
      }),
      prisma.marketplaceProductMapping.groupBy({
        by: ['marketplaceConnectionId'],
        where: { organizationId, lastSyncStatus: 'FAILED' },
        _count: { _all: true },
      }),
    ]);

    const reviewByConnection = new Map(
      reviewCounts.map((row) => [row.marketplaceConnectionId, row._count._all]),
    );
    const failedByConnection = new Map(
      failedCounts.map((row) => [row.marketplaceConnectionId, row._count._all]),
    );

    return connections.map((connection) => ({
      ...mapConnection(connection),
      needsReviewCount: reviewByConnection.get(connection.id) ?? 0,
      failedSyncCount: failedByConnection.get(connection.id) ?? 0,
    }));
  }

  async getConnectionById(
    organizationId: string,
    connectionId: string,
  ): Promise<MarketplaceConnectionDetail> {
    const connection = await this.getOwnedConnection(connectionId, organizationId);
    return mapConnection(connection);
  }

  async createConnection(
    organizationId: string,
    actorUserId: string,
    input: CreateMarketplaceConnectionInput,
  ): Promise<MarketplaceConnectionDetail> {
    if (!isSupportedMarketplaceProvider(input.provider)) {
      throw MarketplaceError.invalidProvider();
    }

    const encryptedAccessToken = marketplaceEncryptionService.encryptToken(input.accessToken);
    const encryptedRefreshToken = input.refreshToken
      ? marketplaceEncryptionService.encryptToken(input.refreshToken)
      : null;

    const existing = await prisma.marketplaceConnection.findFirst({
      where: {
        organizationId,
        provider: input.provider,
        shopId: input.shopId,
        deletedAt: null,
      },
    });

    if (existing?.isActive) {
      throw MarketplaceError.duplicateConnection();
    }

    const connection = await prisma.$transaction(async (tx) => {
      let saved: MarketplaceConnection;

      if (existing) {
        saved = await tx.marketplaceConnection.update({
          where: { id: existing.id },
          data: {
            shopName: input.shopName,
            encryptedAccessToken,
            encryptedRefreshToken,
            tokenExpiresAt: input.expiresAt,
            isActive: true,
          },
        });
      } else {
        saved = await tx.marketplaceConnection.create({
          data: {
            userId: actorUserId,
            organizationId,
            provider: input.provider as MarketplaceProvider,
            shopId: input.shopId,
            shopName: input.shopName,
            encryptedAccessToken,
            encryptedRefreshToken,
            tokenExpiresAt: input.expiresAt,
            isActive: true,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          organizationId,
          action: 'marketplace.connected',
          resource: 'marketplace_connection',
          metadata: {
            connectionId: saved.id,
            provider: saved.provider,
            shopId: saved.shopId,
            shopName: saved.shopName,
          },
        },
      });

      return saved;
    });

    appLogger.info('marketplace.connected', {
      organizationId,
      connectionId: connection.id,
      provider: connection.provider,
      shopId: connection.shopId,
    });

    return mapConnection(connection);
  }

  async disconnectConnection(
    organizationId: string,
    actorUserId: string,
    connectionId: string,
  ): Promise<MarketplaceConnectionDetail> {
    const connection = await this.getOwnedConnection(connectionId, organizationId);

    if (!connection.isActive) {
      return mapConnection(connection);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const saved = await tx.marketplaceConnection.update({
        where: { id: connectionId },
        data: { isActive: false },
      });

      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          organizationId,
          action: 'marketplace.disconnected',
          resource: 'marketplace_connection',
          metadata: {
            connectionId: saved.id,
            provider: saved.provider,
            shopId: saved.shopId,
            shopName: saved.shopName,
          },
        },
      });

      return saved;
    });

    appLogger.info('marketplace.disconnected', {
      organizationId,
      connectionId,
      provider: updated.provider,
      shopId: updated.shopId,
    });

    return mapConnection(updated);
  }

  /**
   * Server-only accessor for future sync jobs and token refresh workers.
   * Never expose decrypted tokens through API responses.
   */
  async getDecryptedTokens(organizationId: string, connectionId: string) {
    const connection = await this.getOwnedConnection(connectionId, organizationId);

    if (!connection.isActive) {
      throw MarketplaceError.validation('Marketplace connection is not active.');
    }

    return {
      provider: connection.provider,
      shopId: connection.shopId,
      accessToken: marketplaceEncryptionService.decryptToken(connection.encryptedAccessToken),
      refreshToken: marketplaceEncryptionService.safeDecryptToken(connection.encryptedRefreshToken),
      tokenExpiresAt: connection.tokenExpiresAt,
    };
  }

  private async getOwnedConnection(connectionId: string, organizationId: string) {
    const connection = await prisma.marketplaceConnection.findFirst({
      where: {
        id: connectionId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!connection) {
      throw MarketplaceError.notFound();
    }

    return connection;
  }
}

export const marketplaceServerService = new MarketplaceServerService();
