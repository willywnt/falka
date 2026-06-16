import {
  buildCoalescedPropagateJobId,
  buildPropagateJobId,
} from '../marketplace-sync/idempotency.js';
import { JOB_NAMES, QUEUE_NAMES, type PropagateInventoryStockJobPayload } from '../types/index.js';
import { createQueue } from './create-queue.js';

/**
 * Window over which repeated AUTO stock changes to the same variant are batched into a single
 * marketplace push (the marketplace stock API is an absolute set, so only the final value
 * matters). Bounded latency = at most this long before a change reaches the marketplace.
 */
export const MARKETPLACE_SYNC_COALESCE_WINDOW_MS = 60_000;

export type EnqueuePropagateOptions = {
  /**
   * Coalesce auto-propagation: schedule one delayed propagate per (org, variant) so a burst of
   * stock changes (sales, receives, opname, …) collapses into a single push of the latest
   * available — cuts redundant marketplace calls. Manual syncs omit this and fire immediately.
   */
  coalesce?: boolean;
};

/**
 * Enqueues an outbound stock propagation for a variant. Without `coalesce`, the job id is the
 * stock-event id so the same event never enqueues twice (immediate — used by manual syncs).
 * With `coalesce`, a stable per-(org, variant) job id + a delay debounces a burst into one push
 * (the propagate job re-reads the LATEST available at run time). Best-effort: callers must not
 * fail the underlying stock change if this throws.
 */
export async function enqueuePropagateInventoryStock(
  payload: PropagateInventoryStockJobPayload,
  options: EnqueuePropagateOptions = {},
): Promise<void> {
  const queue = createQueue(QUEUE_NAMES.MARKETPLACE_PROPAGATE);

  if (options.coalesce) {
    await queue.add(JOB_NAMES.PROPAGATE_INVENTORY_STOCK, payload, {
      jobId: buildCoalescedPropagateJobId(payload.organizationId, payload.variantId),
      delay: MARKETPLACE_SYNC_COALESCE_WINDOW_MS,
      // The stable job id MUST free up after the window fires (or fails) so the next burst can
      // re-schedule — the queue default keeps completed jobs 24h, which would block coalescing.
      removeOnComplete: true,
      removeOnFail: true,
    });
    return;
  }

  await queue.add(JOB_NAMES.PROPAGATE_INVENTORY_STOCK, payload, {
    jobId: buildPropagateJobId(payload.eventId),
  });
}
