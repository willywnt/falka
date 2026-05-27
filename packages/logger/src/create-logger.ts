import pino, { type Logger as PinoLogger } from 'pino';

import { getCorrelationContext } from './correlation.js';
import { sanitizeForLogging } from './sanitize.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogContext = Record<string, unknown>;

export type CreateLoggerOptions = {
  name?: string;
  component?: string;
};

function resolveLogLevel(): LogLevel {
  const env = process.env.LOG_LEVEL;
  if (env === 'debug' || env === 'info' || env === 'warn' || env === 'error') {
    return env;
  }

  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

function shouldUsePrettyLogs(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.LOG_PRETTY !== 'false';
}

function createPinoInstance(options: CreateLoggerOptions = {}): PinoLogger {
  const base = {
    service: 'olshop',
    env: process.env.NODE_ENV ?? 'development',
    ...(options.component ? { component: options.component } : {}),
  };

  if (shouldUsePrettyLogs()) {
    return pino({
      name: options.name ?? 'olshop',
      level: resolveLogLevel(),
      base,
      timestamp: pino.stdTimeFunctions.isoTime,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    });
  }

  return pino({
    name: options.name ?? 'olshop',
    level: resolveLogLevel(),
    base,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label };
      },
    },
  });
}

function buildContext(context?: LogContext): LogContext {
  const correlation = getCorrelationContext();
  const merged: LogContext = {
    ...(correlation?.requestId ? { requestId: correlation.requestId } : {}),
    ...(correlation?.userId ? { userId: correlation.userId } : {}),
    ...(correlation?.jobId ? { jobId: correlation.jobId } : {}),
    ...(correlation?.queueName ? { queueName: correlation.queueName } : {}),
    ...(context ? (sanitizeForLogging(context) as LogContext) : {}),
  };

  return merged;
}

export type StructuredLogger = {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
  child: (bindings: LogContext) => StructuredLogger;
};

function wrapLogger(pinoLogger: PinoLogger): StructuredLogger {
  return {
    debug(message, context) {
      const payload = buildContext(context);
      if (Object.keys(payload).length > 0) {
        pinoLogger.debug(payload, message);
        return;
      }
      pinoLogger.debug(message);
    },
    info(message, context) {
      const payload = buildContext(context);
      if (Object.keys(payload).length > 0) {
        pinoLogger.info(payload, message);
        return;
      }
      pinoLogger.info(message);
    },
    warn(message, context) {
      const payload = buildContext(context);
      if (Object.keys(payload).length > 0) {
        pinoLogger.warn(payload, message);
        return;
      }
      pinoLogger.warn(message);
    },
    error(message, context) {
      const payload = buildContext(context);
      if (Object.keys(payload).length > 0) {
        pinoLogger.error(payload, message);
        return;
      }
      pinoLogger.error(message);
    },
    child(bindings) {
      return wrapLogger(pinoLogger.child(sanitizeForLogging(bindings) as LogContext));
    },
  };
}

const defaultLogger = wrapLogger(createPinoInstance());

export function createLogger(options: CreateLoggerOptions = {}): StructuredLogger {
  return wrapLogger(createPinoInstance(options));
}

export const logger = defaultLogger;

export type Logger = StructuredLogger;

/** Domain event helpers for consistent operational logging. */
export const logEvents = {
  authSuccess(userId: string, method: string, context?: LogContext) {
    logger.info('auth.success', { userId, method, ...context });
  },
  authFailure(reason: string, context?: LogContext) {
    logger.warn('auth.failure', { reason, ...context });
  },
  uploadStarted(context: LogContext) {
    logger.info('upload.started', context);
  },
  uploadFailed(context: LogContext) {
    logger.warn('upload.failed', context);
  },
  uploadCompleted(context: LogContext) {
    logger.info('upload.completed', context);
  },
  recoveryStarted(context: LogContext) {
    logger.info('recording.recovery.started', context);
  },
  recoveryCompleted(context: LogContext) {
    logger.info('recording.recovery.completed', context);
  },
  recoveryFailed(context: LogContext) {
    logger.warn('recording.recovery.failed', context);
  },
  apiFailure(context: LogContext) {
    logger.error('api.failure', context);
  },
  jobStarted(context: LogContext) {
    logger.info('job.started', context);
  },
  jobCompleted(context: LogContext) {
    logger.info('job.completed', context);
  },
  jobFailed(context: LogContext) {
    logger.error('job.failed', context);
  },
};
