/**
 * Default parameters for the reorder report. Every value is overridable per
 * request via the reorder API query (see `validators/reorder-report`). Kept as
 * plain constants on purpose — per-variant lead time / MOQ / supplier would need
 * new schema columns and is deferred to a later iteration.
 */
export const REORDER_DEFAULTS = {
  /** Trailing window (days) used to measure sales velocity. */
  windowDays: 30,
  /** Supplier lead time (days) before a restock arrives. */
  leadTimeDays: 7,
  /** Days of cover to reorder up to (the buffer you want on hand). */
  targetCoverDays: 30,
  /** A variant holding stock with no sales for this many days is "dead stock". */
  deadStockDays: 60,
} as const;

/**
 * Sales velocity is a recency-weighted average: the window is split into
 * `buckets` equal sub-windows and each older bucket's weight is multiplied by
 * `decay` (0 < decay ≤ 1). decay = 1 would be a plain moving average; lower
 * reacts faster to recent demand. With 4 buckets at decay 0.6 the most recent
 * sub-window carries ~46% of the weight.
 */
export const VELOCITY = {
  buckets: 4,
  decay: 0.6,
} as const;

/** Inclusive bounds the reorder query accepts for each tunable parameter. */
export const REORDER_BOUNDS = {
  windowDays: { min: 7, max: 365 },
  leadTimeDays: { min: 0, max: 180 },
  targetCoverDays: { min: 1, max: 365 },
} as const;
