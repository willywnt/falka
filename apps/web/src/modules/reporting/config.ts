/**
 * Bounds for the read-only reporting module. Kept as plain constants (mirrors
 * `inventory/config.ts`): the report queries are server-driven and these guard
 * against an unbounded date range or CSV pulling the whole sales history into
 * memory. The on-screen reports slice their own top/bottom rows — these caps
 * only bound the raw range and the full-row CSV exports.
 */

/**
 * Largest inclusive span (days) a profit/ABC/channel report query may cover.
 * `loadSoldLines` pulls every matching SaleItem/OrderItem/Return into JS, so an
 * unbounded range is a memory/latency footgun. ~one leap year of cover.
 */
export const MAX_REPORT_RANGE_DAYS = 366;

/** Upper bound on rows a reporting CSV export emits; logged when exceeded. */
export const REPORT_EXPORT_CAP = 10_000;
