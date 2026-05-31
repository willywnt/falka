import { Redis, type RedisOptions } from 'ioredis';

export type { Redis } from 'ioredis';

let sharedClient: Redis | undefined;
let markedUnavailable = false;
let devWarningLogged = false;

function getOptionalRedisOptions(): RedisOptions {
  return {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    lazyConnect: true,
    retryStrategy: (times) => {
      if (times >= 3) {
        markedUnavailable = true;
        return null;
      }
      return Math.min(times * 400, 2_000);
    },
  };
}

function logDevUnavailableOnce(): void {
  if (devWarningLogged || process.env.NODE_ENV === 'production') return;
  devWarningLogged = true;
  console.warn(
    '[redis] Cannot connect (is Redis running on REDIS_URL?). Rate limits and metrics fail open until restart.',
  );
}

function attachErrorHandlers(client: Redis): void {
  client.on('error', () => {
    markedUnavailable = true;
    logDevUnavailableOnce();
  });

  client.on('ready', () => {
    markedUnavailable = false;
  });
}

/** Shared lazy Redis client for optional features (rate limit, metrics). Returns null when REDIS_URL is unset. */
export function getOptionalRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url || markedUnavailable) return null;

  if (!sharedClient) {
    sharedClient = new Redis(url, getOptionalRedisOptions());
    attachErrorHandlers(sharedClient);
  }

  return sharedClient;
}

export async function withOptionalRedis<T>(
  run: (redis: Redis) => Promise<T>,
  fallback: T,
): Promise<T> {
  const redis = getOptionalRedis();
  if (!redis) return fallback;

  try {
    if (redis.status !== 'ready' && redis.status !== 'connecting') {
      await redis.connect();
    }

    if (redis.status !== 'ready') {
      return fallback;
    }

    return await run(redis);
  } catch {
    markedUnavailable = true;
    logDevUnavailableOnce();
    return fallback;
  }
}

export async function closeOptionalRedis(): Promise<void> {
  if (!sharedClient) return;
  await sharedClient.quit().catch(() => undefined);
  sharedClient = undefined;
  markedUnavailable = false;
}
