export {
  createLogger,
  logger,
  logEvents,
  type CreateLoggerOptions,
  type LogContext,
  type LogLevel,
  type Logger,
  type StructuredLogger,
} from './create-logger.js';

export {
  extendCorrelationContext,
  getCorrelationContext,
  getRequestId,
  runWithCorrelationContext,
  runWithRequestId,
  type CorrelationContext,
} from './correlation.js';

export { generateRequestId, REQUEST_ID_HEADER, resolveRequestId } from './correlation-id.js';
