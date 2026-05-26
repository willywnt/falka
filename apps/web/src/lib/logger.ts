import { logger } from '@olshop/utils/logger';

import type { LogContext, Logger } from '@olshop/utils/logger';

/** Application logger — structured JSON via Pino. Ready for Sentry/APM integration. */
export const appLogger: Logger = logger;

export type { Logger, LogContext };
