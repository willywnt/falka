import { isDevHttpsEnabled } from '@/lib/dev-https';

/** Whether session cookies use the Secure flag (HTTPS dev or production). */
export function usesSecureAuthCookies(): boolean {
  return process.env.NODE_ENV === 'production' || isDevHttpsEnabled();
}

/** Must match Auth.js `getToken({ secureCookie })` and `authConfig.cookies.sessionToken.name`. */
export function getAuthSessionCookieName(): string {
  return usesSecureAuthCookies() ? '__Secure-authjs.session-token' : 'authjs.session-token';
}
