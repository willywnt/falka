/** One sync job per (mapping, stock-change event) — re-running the propagate is a no-op. */
export function buildStockSyncIdempotencyKey(mappingId: string, eventId: string): string {
  return `stock-sync:${mappingId}:${eventId}`;
}

// BullMQ rejects a ':' in a custom job id, so these use '-' (the DB idempotency
// key above keeps ':' — it is a plain column, not a BullMQ id).
export function buildPropagateJobId(eventId: string): string {
  return `propagate-${eventId}`;
}

/**
 * Stable per-(org, variant) job id for COALESCED auto-propagation: while a delayed propagate
 * for this variant is pending, further auto stock-changes dedupe onto it (BullMQ ignores a
 * duplicate job id) instead of each firing its own marketplace call. org + variant are cuids,
 * so '-' stays a safe separator. Manual syncs keep {@link buildPropagateJobId} (immediate).
 */
export function buildCoalescedPropagateJobId(organizationId: string, variantId: string): string {
  return `coalesce-prop-${organizationId}-${variantId}`;
}

export function buildSyncJobId(syncJobId: string): string {
  return `sync-${syncJobId}`;
}

export function buildManualRetryEventId(mappingId: string, timestampMs: number): string {
  return `manual-${mappingId}-${timestampMs}`;
}
