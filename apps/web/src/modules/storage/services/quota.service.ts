import 'server-only';

import { prisma } from '@olshop/db';
import { isWithinQuota, quotaUsagePercent, remainingQuotaBytes } from '@olshop/utils/storage';

import { StorageError } from '../errors/storage-errors';
import type { StorageQuotaSnapshot } from '../types';

export class QuotaService {
  async getQuotaSnapshot(userId: string): Promise<StorageQuotaSnapshot> {
    const user = await this.getActiveUserQuota(userId);

    const usedBytes = user.storageUsedBytes;
    const quotaBytes = user.storageQuotaBytes;

    return {
      usedBytes,
      quotaBytes,
      remainingBytes: BigInt(remainingQuotaBytes(Number(usedBytes), Number(quotaBytes))),
      usagePercent: quotaUsagePercent(Number(usedBytes), Number(quotaBytes)),
    };
  }

  async assertQuotaAvailable(userId: string, incomingFileSizeBytes: number): Promise<void> {
    const user = await this.getActiveUserQuota(userId);

    const hasQuota = isWithinQuota(
      Number(user.storageUsedBytes),
      Number(user.storageQuotaBytes),
      incomingFileSizeBytes,
    );

    if (!hasQuota) {
      throw StorageError.quotaExceeded();
    }
  }

  private async getActiveUserQuota(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        storageUsedBytes: true,
        storageQuotaBytes: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      throw StorageError.unauthorized();
    }

    return user;
  }
}

export const quotaService = new QuotaService();
