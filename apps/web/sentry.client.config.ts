import * as Sentry from '@sentry/nextjs';

import { sanitizeForLogging } from '@falka/logger/sanitize';

import { isClientSentryEnabled } from '@falka/config/sentry';

if (isClientSentryEnabled()) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment:
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.extra) {
        event.extra = sanitizeForLogging(event.extra) as Record<string, unknown>;
      }

      return event;
    },
  });
}
