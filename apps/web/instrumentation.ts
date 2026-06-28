import { isServerSentryEnabled } from '@palka/config/sentry';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateServerEnvOnStartup } = await import('@palka/config/env.server');
    validateServerEnvOnStartup();

    if (isServerSentryEnabled()) {
      await import('./sentry.server.config');
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge' && isServerSentryEnabled()) {
    await import('./sentry.edge.config');
  }
}

export async function onRequestError(
  error: unknown,
  request: { path: string; method: string; headers: { [key: string]: string } },
) {
  if (!isServerSentryEnabled()) return;

  const Sentry = await import('@sentry/nextjs');
  Sentry.captureException(error, {
    tags: {
      path: request.path,
      method: request.method,
    },
  });
}
