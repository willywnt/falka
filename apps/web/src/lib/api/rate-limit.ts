import 'server-only';

import {
  API_RATE_LIMIT_PER_MINUTE,
  AUTH_RATE_LIMIT_PER_MINUTE,
  LOGIN_RATE_LIMIT_PER_WINDOW,
  LOGIN_RATE_LIMIT_WINDOW_SECONDS,
  RECORDING_RATE_LIMIT_PER_MINUTE,
  UPLOAD_RATE_LIMIT_PER_MINUTE,
} from '@falka/config/limits';
import {
  buildIpRateLimitKey,
  buildUserRateLimitKey,
  checkRateLimit,
  type RateLimitResult,
} from '@falka/rate-limit';

import { AppError } from '@/lib/errors';

export type RateLimitScope = 'login' | 'auth' | 'upload' | 'recording' | 'write';

export async function enforceRateLimit(
  scope: RateLimitScope,
  identifiers: { ip: string; userId?: string },
): Promise<RateLimitResult> {
  switch (scope) {
    case 'login':
      return checkRateLimit({
        key: buildIpRateLimitKey('login', identifiers.ip),
        limit: LOGIN_RATE_LIMIT_PER_WINDOW,
        windowSeconds: LOGIN_RATE_LIMIT_WINDOW_SECONDS,
      });
    case 'auth':
      return checkRateLimit({
        key: buildIpRateLimitKey('auth', identifiers.ip),
        limit: AUTH_RATE_LIMIT_PER_MINUTE,
        windowSeconds: 60,
      });
    case 'upload':
      if (!identifiers.userId) {
        return {
          allowed: true,
          limit: UPLOAD_RATE_LIMIT_PER_MINUTE,
          remaining: UPLOAD_RATE_LIMIT_PER_MINUTE,
          retryAfterSeconds: 0,
        };
      }
      return checkRateLimit({
        key: buildUserRateLimitKey('upload', identifiers.userId),
        limit: UPLOAD_RATE_LIMIT_PER_MINUTE,
        windowSeconds: 60,
      });
    case 'recording':
      if (!identifiers.userId) {
        return {
          allowed: true,
          limit: RECORDING_RATE_LIMIT_PER_MINUTE,
          remaining: RECORDING_RATE_LIMIT_PER_MINUTE,
          retryAfterSeconds: 0,
        };
      }
      return checkRateLimit({
        key: buildUserRateLimitKey('recording', identifiers.userId),
        limit: RECORDING_RATE_LIMIT_PER_MINUTE,
        windowSeconds: 60,
      });
    case 'write':
      // Generic abuse/runaway ceiling for authenticated write mutations
      // (POS sale/refund, PO receive/cancel, opname post, marketplace sync).
      // Per-user; correctness (double-submit) is owned by the per-entity
      // advisory locks, this is only a safety net.
      if (!identifiers.userId) {
        return {
          allowed: true,
          limit: API_RATE_LIMIT_PER_MINUTE,
          remaining: API_RATE_LIMIT_PER_MINUTE,
          retryAfterSeconds: 0,
        };
      }
      return checkRateLimit({
        key: buildUserRateLimitKey('write', identifiers.userId),
        limit: API_RATE_LIMIT_PER_MINUTE,
        windowSeconds: 60,
      });
    default:
      return { allowed: true, limit: 0, remaining: 0, retryAfterSeconds: 0 };
  }
}

export function assertRateLimitAllowed(result: RateLimitResult): void {
  if (result.allowed) return;

  throw new AppError('Too many requests. Please try again later.', 'RATE_LIMITED', 429, {
    retryAfterSeconds: result.retryAfterSeconds,
  });
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    ...(result.retryAfterSeconds > 0 ? { 'Retry-After': String(result.retryAfterSeconds) } : {}),
  };
}
