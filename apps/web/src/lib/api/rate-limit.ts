import 'server-only';

import {
  AUTH_RATE_LIMIT_PER_MINUTE,
  LOGIN_RATE_LIMIT_PER_WINDOW,
  LOGIN_RATE_LIMIT_WINDOW_SECONDS,
  RECORDING_RATE_LIMIT_PER_MINUTE,
  UPLOAD_RATE_LIMIT_PER_MINUTE,
} from '@olshop/config/limits';
import {
  buildIpRateLimitKey,
  buildUserRateLimitKey,
  checkRateLimit,
  type RateLimitResult,
} from '@olshop/rate-limit';

import { AppError } from '@/lib/errors';

export type RateLimitScope = 'login' | 'auth' | 'upload' | 'recording';

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
