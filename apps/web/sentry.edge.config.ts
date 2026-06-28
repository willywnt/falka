import * as Sentry from '@sentry/nextjs';

import { isServerSentryEnabled } from '@palka/config/sentry';

if (isServerSentryEnabled()) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.05),
  });
}
