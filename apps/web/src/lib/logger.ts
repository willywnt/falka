import 'server-only';

import { createLogger } from '@olshop/logger/server';

export {
  createLogger,
  logEvents,
  logger,
  type LogContext,
  type Logger,
} from '@olshop/logger/server';

export const appLogger = createLogger({ component: 'web' });
