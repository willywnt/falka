import { prisma } from '@falka/db';
import { logger } from '@falka/logger/server';
import { getObjectStorageProvider } from '@falka/storage';

import type { JobResultMetadata } from '../types/index.js';
import {
  verifyStorageConsistencyJobSchema,
  type VerifyStorageConsistencyJobPayload,
} from '../types/index.js';

export type StorageConsistencyFinding = {
  type: 'orphan_db_metadata' | 'orphan_storage_object';
  recordingId?: string;
  storageKey?: string;
  suggestion: string;
};

export async function processVerifyStorageConsistencyJob(
  rawPayload: VerifyStorageConsistencyJobPayload,
): Promise<JobResultMetadata & { findings: StorageConsistencyFinding[] }> {
  const payload = verifyStorageConsistencyJobSchema.parse(rawPayload);
  const storage = getObjectStorageProvider();
  const startedAt = Date.now();
  const findings: StorageConsistencyFinding[] = [];

  const recordings = await prisma.recording.findMany({
    where: {
      status: { in: ['COMPLETED', 'UPLOADING', 'PENDING_DELETE'] },
    },
    select: {
      id: true,
      storageKey: true,
      status: true,
    },
    take: payload.batchSize,
    orderBy: { updatedAt: 'asc' },
  });

  for (const recording of recordings) {
    if (!recording.storageKey) continue;

    const exists = await storage.objectExists(recording.storageKey);
    if (!exists) {
      findings.push({
        type: 'orphan_db_metadata',
        recordingId: recording.id,
        storageKey: recording.storageKey,
        suggestion: payload.dryRun
          ? 'Review recording metadata; storage object is missing. Consider marking FAILED or removing stale metadata.'
          : 'Logged for operator review only (auto-repair disabled).',
      });
    }
  }

  const storageKeys = await storage.listObjectKeys('recordings/', payload.batchSize);
  const dbKeys = new Set(
    recordings
      .map((recording) => recording.storageKey)
      .filter((key): key is string => Boolean(key)),
  );

  for (const storageKey of storageKeys) {
    if (dbKeys.has(storageKey)) continue;

    const referenced = await prisma.recording.findFirst({
      where: { storageKey },
      select: { id: true },
    });

    if (!referenced) {
      findings.push({
        type: 'orphan_storage_object',
        storageKey,
        suggestion:
          'Storage object has no matching recording row. Review before deletion; do not auto-delete.',
      });
    }
  }

  logger.warn('storage.consistency.verification.completed', {
    dryRun: payload.dryRun,
    scannedRecordings: recordings.length,
    scannedStorageObjects: storageKeys.length,
    findings: findings.length,
    requestId: payload.requestId,
  });

  return {
    processed: recordings.length + storageKeys.length,
    succeeded: findings.length,
    failed: 0,
    skipped: 0,
    durationMs: Date.now() - startedAt,
    details: {
      dryRun: payload.dryRun,
      findingCount: findings.length,
    },
    findings,
  };
}

export function getDefaultVerifyStorageConsistencyPayload(): VerifyStorageConsistencyJobPayload {
  return verifyStorageConsistencyJobSchema.parse({});
}
