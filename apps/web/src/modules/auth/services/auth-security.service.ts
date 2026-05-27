import 'server-only';

import { logEvents } from '@olshop/logger/server';
import {
  buildIpRateLimitKey,
  buildUserRateLimitKey,
  getRateLimitStatus,
  incrementRateLimitCounter,
} from '@olshop/rate-limit';

const FAILED_LOGIN_WINDOW_SECONDS = 15 * 60;
const FAILED_LOGIN_ALERT_THRESHOLD = 5;
const ACCOUNT_LOCK_THRESHOLD = 10;

export async function recordFailedLoginAttempt(email: string, ip: string): Promise<void> {
  await incrementRateLimitCounter({
    key: buildIpRateLimitKey('auth:failed-login', ip),
    limit: ACCOUNT_LOCK_THRESHOLD,
    windowSeconds: FAILED_LOGIN_WINDOW_SECONDS,
  });

  await incrementRateLimitCounter({
    key: buildUserRateLimitKey('auth:failed-login', email.toLowerCase()),
    limit: ACCOUNT_LOCK_THRESHOLD,
    windowSeconds: FAILED_LOGIN_WINDOW_SECONDS,
  });

  logEvents.authFailure('invalid_credentials', { email, ip });
}

export async function isLoginBlocked(email: string, ip: string): Promise<boolean> {
  const [ipResult, accountResult] = await Promise.all([
    getRateLimitStatus({
      key: buildIpRateLimitKey('auth:failed-login', ip),
      limit: ACCOUNT_LOCK_THRESHOLD,
      windowSeconds: FAILED_LOGIN_WINDOW_SECONDS,
    }),
    getRateLimitStatus({
      key: buildUserRateLimitKey('auth:failed-login', email.toLowerCase()),
      limit: ACCOUNT_LOCK_THRESHOLD,
      windowSeconds: FAILED_LOGIN_WINDOW_SECONDS,
    }),
  ]);

  return !ipResult.allowed || !accountResult.allowed;
}

export async function isSuspiciousLogin(email: string, ip: string): Promise<boolean> {
  const ipResult = await getRateLimitStatus({
    key: buildIpRateLimitKey('auth:failed-login', ip),
    limit: FAILED_LOGIN_ALERT_THRESHOLD,
    windowSeconds: FAILED_LOGIN_WINDOW_SECONDS,
  });

  return !ipResult.allowed;
}

export function recordSuccessfulLogin(userId: string, ip: string): void {
  logEvents.authSuccess(userId, 'credentials', { ip });
}

/** Reserved for future OAuth provider linking and token refresh flows. */
export type FutureAuthProvider = 'credentials' | 'shopee' | 'tokopedia';

export const SUPPORTED_AUTH_PROVIDERS: FutureAuthProvider[] = ['credentials'];
