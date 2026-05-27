import * as Sentry from '@sentry/node';
import { isServerSentryEnabled } from '@olshop/config/sentry';
import { sanitizeForLogging } from '@olshop/logger/sanitize';

export function initWorkerSentry(): void {
  if (!isServerSentryEnabled()) return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT ?? 'production',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.extra) {
        event.extra = sanitizeForLogging(event.extra) as Record<string, unknown>;
      }

      return event;
    },
  });
}

export function captureWorkerException(error: unknown, context?: Record<string, unknown>): void {
  if (!isServerSentryEnabled()) return;

  Sentry.captureException(error, {
    extra: context ? (sanitizeForLogging(context) as Record<string, unknown>) : undefined,
  });
}

export async function flushWorkerSentry(timeoutMs = 2000): Promise<void> {
  if (!isServerSentryEnabled()) return;
  await Sentry.flush(timeoutMs);
}
