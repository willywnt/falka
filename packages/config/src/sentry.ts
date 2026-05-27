/** Sentry is production-only — leave DSN unset locally. */
export function isServerSentryEnabled(): boolean {
  return process.env.NODE_ENV === 'production' && Boolean(process.env.SENTRY_DSN?.trim());
}

export function isClientSentryEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'production' && Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN?.trim())
  );
}
