import * as Sentry from '@sentry/nextjs';

import { sanitizeForLogging } from '@falka/logger/sanitize';

import { isServerSentryEnabled } from '@falka/config/sentry';

if (isServerSentryEnabled()) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.extra) {
        event.extra = sanitizeForLogging(event.extra) as Record<string, unknown>;
      }

      if (event.contexts) {
        event.contexts = sanitizeForLogging(event.contexts) as typeof event.contexts;
      }

      return event;
    },
  });
}
