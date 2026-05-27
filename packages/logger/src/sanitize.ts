const SENSITIVE_KEY_PATTERN =
  /(password|secret|token|authorization|cookie|api[_-]?key|access[_-]?key|private[_-]?key|credential|session)/i;

const REDACTED = '[REDACTED]';
const MAX_DEPTH = 6;
const MAX_STRING_LENGTH = 500;

function truncate(value: string): string {
  if (value.length <= MAX_STRING_LENGTH) return value;
  return `${value.slice(0, MAX_STRING_LENGTH)}…`;
}

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERN.test(key);
}

export function sanitizeForLogging(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (depth >= MAX_DEPTH) return '[Truncated]';

  if (typeof value === 'string') {
    return truncate(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: truncate(value.message),
      stack: process.env.NODE_ENV === 'production' ? undefined : truncate(value.stack ?? ''),
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForLogging(item, depth + 1));
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      result[key] = isSensitiveKey(key) ? REDACTED : sanitizeForLogging(nestedValue, depth + 1);
    }

    return result;
  }

  return truncate(String(value));
}

export function sanitizeError(error: unknown): Error {
  if (error instanceof Error) {
    const sanitized = new Error(truncate(error.message));
    sanitized.name = error.name;
    if (process.env.NODE_ENV !== 'production' && error.stack) {
      sanitized.stack = error.stack;
    }
    return sanitized;
  }

  return new Error(truncate(String(error)));
}
