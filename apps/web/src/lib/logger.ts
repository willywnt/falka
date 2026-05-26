type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
}

function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

function createConsoleLogger(): Logger {
  return {
    debug(message, context) {
      if (process.env.NODE_ENV !== 'production') {
        console.debug(formatLog('debug', message, context));
      }
    },
    info(message, context) {
      console.info(formatLog('info', message, context));
    },
    warn(message, context) {
      console.warn(formatLog('warn', message, context));
    },
    error(message, context) {
      console.error(formatLog('error', message, context));
    },
  };
}

/** Application logger abstraction. Swap implementation for external providers later. */
export const appLogger: Logger = createConsoleLogger();

export type { Logger, LogContext, LogLevel };
