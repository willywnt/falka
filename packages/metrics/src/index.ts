import { Redis } from 'ioredis';

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

let redisClient: Redis | undefined;

function getMetricsRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (!redisClient) {
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: true,
    });
  }

  return redisClient;
}

export async function incrementMetric(key: MetricKey, amount = 1): Promise<void> {
  const redis = getMetricsRedis();
  if (!redis) return;

  try {
    if (redis.status !== 'ready') {
      await redis.connect();
    }

    await redis.incrby(key, amount);
  } catch {
    // Metrics must never break request flow.
  }
}

export async function getMetric(key: MetricKey): Promise<number> {
  const redis = getMetricsRedis();
  if (!redis) return 0;

  try {
    if (redis.status !== 'ready') {
      await redis.connect();
    }

    const value = await redis.get(key);
    return value ? Number.parseInt(value, 10) : 0;
  } catch {
    return 0;
  }
}

export async function getMetricsSnapshot(): Promise<Record<MetricKey, number>> {
  const entries = await Promise.all(
    Object.values(METRIC_KEYS).map(async (key) => [key, await getMetric(key)] as const),
  );

  return Object.fromEntries(entries) as Record<MetricKey, number>;
}

export async function closeMetricsRedis(): Promise<void> {
  if (!redisClient) return;
  await redisClient.quit();
  redisClient = undefined;
}
