/** Prevent open redirects; allow only same-app relative paths. */
export function resolveSafeCallbackUrl(
  candidate: string | null | undefined,
  fallback = '/dashboard',
): string {
  if (!candidate) return fallback;

  const trimmed = candidate.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback;
  }

  return trimmed;
}
