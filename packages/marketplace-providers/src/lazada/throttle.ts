/** Pause helper for paced paging / retry backoff. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Lazada's flow-control / "system busy" responses are transient — the same call
 * usually succeeds after a short wait. Covers the listings throttles (E1002 Sentinel,
 * E506 "Get product failed", SellerCallLimit) and the order-API call-limit / "access
 * frequency exceeds the limit" throttles, all of which are intermittent backend
 * throttles rather than bad input. Shared by the listings + orders fetchers.
 */
export function isTransientLazadaError(code: string, message: string | undefined): boolean {
  return (
    code === '1002' ||
    code === '506' ||
    code === 'SellerCallLimit' ||
    /sentinel|system\s*busy|flow\s*control|try\s*again|get product failed|access frequency|frequency exceeds/i.test(
      message ?? '',
    )
  );
}
