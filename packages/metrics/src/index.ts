import { closeOptionalRedis, withOptionalRedis } from '@falka/redis';

export const METRIC_KEYS = {
  UPLOADS_TOTAL: 'metrics:uploads:total',
  UPLOADS_FAILED: 'metrics:uploads:failed',
  UPLOADS_RETRIED: 'metrics:uploads:retried',
  STORAGE_BYTES: 'metrics:storage:bytes',
  RECORDING_DURATION_SECONDS: 'metrics:recordings:duration_seconds',
  RECOVERY_SUCCESS: 'metrics:recovery:success',
  RECOVERY_FAILED: 'metrics:recovery:failed',
  JOBS_FAILED: 'metrics:jobs:failed',
  JOBS_RETRIED: 'metrics:jobs:retried',
} as const;

export type MetricKey = (typeof METRIC_KEYS)[keyof typeof METRIC_KEYS];

export { closeOptionalRedis as closeMetricsRedis };

export async function incrementMetric(key: MetricKey, amount = 1): Promise<void> {
  await withOptionalRedis(async (redis) => {
    await redis.incrby(key, amount);
  }, undefined);
}

export async function getMetric(key: MetricKey): Promise<number> {
  return withOptionalRedis(async (redis) => {
    const value = await redis.get(key);
    return value ? Number.parseInt(value, 10) : 0;
  }, 0);
}

export async function getMetricsSnapshot(): Promise<Record<MetricKey, number>> {
  const entries = await Promise.all(
    Object.values(METRIC_KEYS).map(async (key) => [key, await getMetric(key)] as const),
  );

  return Object.fromEntries(entries) as Record<MetricKey, number>;
}
