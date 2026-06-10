import 'server-only';

import { createLogger } from '@falka/logger/server';

export {
  createLogger,
  logEvents,
  logger,
  type LogContext,
  type Logger,
} from '@falka/logger/server';

export const appLogger = createLogger({ component: 'web' });
