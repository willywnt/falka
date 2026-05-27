import { Redis } from 'ioredis';

let redisClient: Redis | undefined;

function resolveRedisUrl(): string | undefined {
  return process.env.REDIS_URL;
}

export function getRateLimitRedis(): Redis | null {
  const url = resolveRedisUrl();
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

export async function closeRateLimitRedis(): Promise<void> {
  if (!redisClient) return;
  await redisClient.quit();
  redisClient = undefined;
}

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

export type RateLimitOptions = {
  key: string;
  limit: number;
  windowSeconds: number;
};

/**
 * Sliding-window counter using Redis INCR + EXPIRE.
 * Fails open when Redis is unavailable so the app keeps serving traffic.
 */
export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const redis = getRateLimitRedis();

  if (!redis) {
    return {
      allowed: true,
      limit: options.limit,
      remaining: options.limit,
      retryAfterSeconds: 0,
    };
  }

  try {
    if (redis.status !== 'ready') {
      await redis.connect();
    }

    const redisKey = `ratelimit:${options.key}`;
    const count = await redis.incr(redisKey);

    if (count === 1) {
      await redis.expire(redisKey, options.windowSeconds);
    }

    const ttl = await redis.ttl(redisKey);
    const retryAfterSeconds = ttl > 0 ? ttl : options.windowSeconds;
    const remaining = Math.max(options.limit - count, 0);

    return {
      allowed: count <= options.limit,
      limit: options.limit,
      remaining,
      retryAfterSeconds,
    };
  } catch {
    return {
      allowed: true,
      limit: options.limit,
      remaining: options.limit,
      retryAfterSeconds: 0,
    };
  }
}

export function buildIpRateLimitKey(prefix: string, ip: string): string {
  return `${prefix}:ip:${ip}`;
}

export function buildUserRateLimitKey(prefix: string, userId: string): string {
  return `${prefix}:user:${userId}`;
}

export async function getRateLimitStatus(options: RateLimitOptions): Promise<RateLimitResult> {
  const redis = getRateLimitRedis();

  if (!redis) {
    return {
      allowed: true,
      limit: options.limit,
      remaining: options.limit,
      retryAfterSeconds: 0,
    };
  }

  try {
    if (redis.status !== 'ready') {
      await redis.connect();
    }

    const redisKey = `ratelimit:${options.key}`;
    const currentValue = await redis.get(redisKey);
    const count = currentValue ? Number.parseInt(currentValue, 10) : 0;
    const ttl = await redis.ttl(redisKey);
    const retryAfterSeconds = ttl > 0 ? ttl : options.windowSeconds;

    return {
      allowed: count < options.limit,
      limit: options.limit,
      remaining: Math.max(options.limit - count, 0),
      retryAfterSeconds,
    };
  } catch {
    return {
      allowed: true,
      limit: options.limit,
      remaining: options.limit,
      retryAfterSeconds: 0,
    };
  }
}

export async function incrementRateLimitCounter(
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  return checkRateLimit(options);
}
