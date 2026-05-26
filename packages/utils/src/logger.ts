import pino from 'pino';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function resolveLogLevel(): LogLevel {
  const env = process.env.LOG_LEVEL;
  if (env === 'debug' || env === 'info' || env === 'warn' || env === 'error') {
    return env;
  }

  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[resolveLogLevel()];
}

const pinoLogger = pino({
  name: 'olshop',
  level: resolveLogLevel(),
  base: {
    service: 'olshop',
    env: process.env.NODE_ENV ?? 'development',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
});

function write(level: LogLevel, message: string, context?: LogContext) {
  if (!shouldLog(level)) return;

  if (context && Object.keys(context).length > 0) {
    pinoLogger[level](context, message);
    return;
  }

  pinoLogger[level](message);
}

/** Structured Pino logger — swap transport/sink for Sentry or APM later. */
export const logger = {
  debug(message: string, context?: LogContext) {
    write('debug', message, context);
  },
  info(message: string, context?: LogContext) {
    write('info', message, context);
  },
  warn(message: string, context?: LogContext) {
    write('warn', message, context);
  },
  error(message: string, context?: LogContext) {
    write('error', message, context);
  },
};

export type Logger = typeof logger;
export type { LogLevel };
