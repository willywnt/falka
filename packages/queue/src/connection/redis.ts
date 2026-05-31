import type { ConnectionOptions } from 'bullmq';
import type { Redis, RedisOptions } from 'ioredis';
import { Redis as RedisClient } from 'ioredis';

import { logger } from '@olshop/utils/logger';

let sharedConnection: Redis | undefined;

function resolveRedisUrl(): string {
  const url = process.env.REDIS_URL;

  if (!url) {
    throw new Error('REDIS_URL is required for BullMQ workers and queues.');
  }

  return url;
}

function getRedisClientOptions(): RedisOptions {
  return {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  };
}

export function getBullMqConnectionOptions(): ConnectionOptions {
  return {
    url: resolveRedisUrl(),
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  };
}

export function createRedisConnection(label = 'default'): Redis {
  const connection = new RedisClient(resolveRedisUrl(), getRedisClientOptions());

  connection.on('connect', () => {
    logger.info('Redis connected', { label });
  });

  connection.on('error', (error) => {
    logger.error('Redis connection error', {
      label,
      error: error instanceof Error ? error.message : String(error),
    });
  });

  connection.on('close', () => {
    logger.warn('Redis connection closed', { label });
  });

  return connection;
}

export function getSharedRedisConnection(): Redis {
  if (!sharedConnection) {
    sharedConnection = createRedisConnection('shared');
  }

  return sharedConnection;
}

export function duplicateRedisConnection(label: string): ConnectionOptions {
  const shared = getSharedRedisConnection();
  const duplicate = shared.duplicate({
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    retryStrategy: (times) => (times >= 3 ? null : Math.min(times * 400, 2_000)),
  });

  duplicate.on('error', (error) => {
    logger.error('Redis connection error', {
      label,
      error: error instanceof Error ? error.message : String(error),
    });
  });

  logger.debug('Redis duplicate connection prepared', { label });
  return duplicate;
}

export async function pingRedis(connection: Redis = getSharedRedisConnection()): Promise<boolean> {
  try {
    const response = await connection.ping();
    return response === 'PONG';
  } catch {
    return false;
  }
}

export async function closeSharedRedisConnection(): Promise<void> {
  if (!sharedConnection) return;

  await sharedConnection.quit();
  sharedConnection = undefined;
}
