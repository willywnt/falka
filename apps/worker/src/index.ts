import { connectDb } from '@palka/db';
import { validateServerEnvOnStartup } from '@palka/config/env.server';
import { shutdownWorkerInfrastructure, startWorkerInfrastructure } from '@palka/queue';
import { logger } from '@palka/logger/server';

import { startHealthServer } from './health-server.js';
import { captureWorkerException, flushWorkerSentry, initWorkerSentry } from './sentry.js';

const HEALTH_PORT = Number(process.env.WORKER_HEALTH_PORT ?? 3001);
const ENABLE_SCHEDULERS = process.env.WORKER_ENABLE_SCHEDULERS !== 'false';
const SHUTDOWN_TIMEOUT_MS = Number(process.env.WORKER_SHUTDOWN_TIMEOUT_MS ?? 30_000);

let isShuttingDown = false;

async function bootstrap(): Promise<void> {
  validateServerEnvOnStartup();
  initWorkerSentry();

  await connectDb();
  await startWorkerInfrastructure({ registerSchedulers: ENABLE_SCHEDULERS });

  const healthServer = startHealthServer(HEALTH_PORT);

  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info('worker.signal.received', { signal });

    const forceExitTimer = setTimeout(() => {
      logger.error('worker.shutdown.timeout', { timeoutMs: SHUTDOWN_TIMEOUT_MS });
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    await new Promise<void>((resolve, reject) => {
      healthServer.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    }).catch((error) => {
      logger.warn('worker.health.shutdown_failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    });

    await shutdownWorkerInfrastructure();
    await flushWorkerSentry();
    clearTimeout(forceExitTimer);
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  logger.info('worker.started', {
    healthPort: HEALTH_PORT,
    schedulersEnabled: ENABLE_SCHEDULERS,
  });
}

bootstrap().catch((error) => {
  captureWorkerException(error, { phase: 'bootstrap' });
  logger.error('worker.bootstrap.failed', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
