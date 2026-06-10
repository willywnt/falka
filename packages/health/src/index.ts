import { healthCheckDb } from '@falka/db';
import { getObjectStorageProvider } from '@falka/storage';

export type DependencyStatus = 'ok' | 'degraded' | 'unavailable' | 'skipped';

export type PlatformHealthSnapshot = {
  status: 'ok' | 'degraded' | 'error';
  uptimeSeconds: number;
  version: string;
  environment: string;
  timestamp: string;
  dependencies: {
    database: DependencyStatus;
    redis: DependencyStatus;
    storage: DependencyStatus;
    worker: DependencyStatus;
  };
};

const startedAt = Date.now();

export function getPlatformUptimeSeconds(): number {
  return Math.floor((Date.now() - startedAt) / 1000);
}

export function resolveAppVersion(): string {
  return process.env.APP_VERSION ?? process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev';
}

async function checkRedis(): Promise<DependencyStatus> {
  const url = process.env.REDIS_URL;
  if (!url) return 'skipped';

  try {
    const { default: Redis } = await import('ioredis');
    const client = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3_000,
      lazyConnect: true,
      retryStrategy: () => null,
    });

    client.on('error', () => {});

    await client.connect();
    const response = await client.ping();
    await client.quit();

    return response === 'PONG' ? 'ok' : 'degraded';
  } catch {
    return 'unavailable';
  }
}

async function checkStorage(): Promise<DependencyStatus> {
  try {
    const provider = getObjectStorageProvider();
    const available = await provider.checkAvailability();
    return available ? 'ok' : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

async function checkWorker(): Promise<DependencyStatus> {
  const workerHealthUrl =
    process.env.WORKER_HEALTH_URL ??
    `http://127.0.0.1:${process.env.WORKER_HEALTH_PORT ?? '3001'}/health`;

  try {
    const response = await fetch(workerHealthUrl, {
      signal: AbortSignal.timeout(3_000),
    });

    if (!response.ok) return 'degraded';

    const payload = (await response.json()) as { status?: string };
    return payload.status === 'ok' || payload.status === 'degraded' ? 'ok' : 'degraded';
  } catch {
    return process.env.NODE_ENV === 'production' ? 'degraded' : 'skipped';
  }
}

function resolveOverallStatus(
  dependencies: PlatformHealthSnapshot['dependencies'],
): PlatformHealthSnapshot['status'] {
  const values = Object.values(dependencies).filter((value) => value !== 'skipped');

  if (values.every((value) => value === 'ok')) return 'ok';
  if (values.some((value) => value === 'unavailable')) return 'error';
  return 'degraded';
}

export async function getPlatformHealthSnapshot(): Promise<PlatformHealthSnapshot> {
  const [databaseHealthy, redis, storage, worker] = await Promise.all([
    healthCheckDb(),
    checkRedis(),
    checkStorage(),
    checkWorker(),
  ]);

  const dependencies = {
    database: databaseHealthy ? 'ok' : 'unavailable',
    redis,
    storage,
    worker,
  } satisfies PlatformHealthSnapshot['dependencies'];

  return {
    status: resolveOverallStatus(dependencies),
    uptimeSeconds: getPlatformUptimeSeconds(),
    version: resolveAppVersion(),
    environment: process.env.NODE_ENV ?? 'development',
    timestamp: new Date().toISOString(),
    dependencies,
  };
}
