import 'server-only';

import { createLogger } from '@palka/logger/server';

export {
  createLogger,
  logEvents,
  logger,
  type LogContext,
  type Logger,
} from '@palka/logger/server';

export const appLogger = createLogger({ component: 'web' });
