/** Default per-request timeout for a marketplace HTTP call (ms). */
export const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

/**
 * Send a request through the injected fetch and parse its JSON envelope, bounded
 * by a timeout.
 *
 * Marketplace clients run inside the stock-sync worker at a small fixed
 * concurrency. Without a timeout a single hung provider connection (a provider
 * incident, a black-holed TCP connection) holds a worker slot until the OS socket
 * timeout — minutes — and a few of them stall sync for EVERY tenant, not just the
 * affected store. An aborted/timed-out request and a non-JSON body (e.g. an HTML
 * 5xx gateway page, which would otherwise surface as a raw JSON.parse error) both
 * throw a clear Error here. The sync engine maps any thrown error to a retryable
 * failure, so BullMQ backs off and retries instead of hanging or leaking an opaque
 * parse error.
 */
export async function requestJson(
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit,
  timeoutMs: number = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetchImpl(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`Marketplace request timed out after ${timeoutMs}ms: ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }

  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    throw new Error(
      `Marketplace request returned a non-JSON body (HTTP ${response.status}): ${url}`,
    );
  }
}
