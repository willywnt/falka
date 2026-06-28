import 'server-only';

import { prisma } from '@palka/db';
import { isWithinQuota, quotaUsagePercent, remainingQuotaBytes } from '@palka/utils/storage';

import { StorageError } from '../errors/storage-errors';
import type { StorageQuotaSnapshot } from '../types';

export class QuotaService {
  async getQuotaSnapshot(organizationId: string): Promise<StorageQuotaSnapshot> {
    const organization = await this.getActiveOrgQuota(organizationId);

    const usedBytes = organization.storageUsedBytes;
    const quotaBytes = organization.storageQuotaBytes;

    return {
      usedBytes,
      quotaBytes,
      remainingBytes: BigInt(remainingQuotaBytes(Number(usedBytes), Number(quotaBytes))),
      usagePercent: quotaUsagePercent(Number(usedBytes), Number(quotaBytes)),
    };
  }

  async assertQuotaAvailable(organizationId: string, incomingFileSizeBytes: number): Promise<void> {
    const organization = await this.getActiveOrgQuota(organizationId);

    const hasQuota = isWithinQuota(
      Number(organization.storageUsedBytes),
      Number(organization.storageQuotaBytes),
      incomingFileSizeBytes,
    );

    if (!hasQuota) {
      throw StorageError.quotaExceeded();
    }
  }

  private async getActiveOrgQuota(organizationId: string) {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        storageUsedBytes: true,
        storageQuotaBytes: true,
        deletedAt: true,
      },
    });

    if (!organization || organization.deletedAt) {
      throw StorageError.unauthorized();
    }

    return organization;
  }
}

export const quotaService = new QuotaService();
