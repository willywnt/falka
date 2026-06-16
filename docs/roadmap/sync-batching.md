# Outbound stock-sync batching — strategy & Approach B

> Status: **Approach A SHIPPED 2026-06-16** · Approach B **scoped, not started** (preventive
> design for when it's needed). Context: marketplace stock sync was one API call per stock
> change; we want fewer calls. See `.cursor/rules/40-inventory-marketplace.mdc` (Outbound sync) +
> [olshop-lazada-integration] memory.

## The two levers

Stock sync is an **absolute set** (push the variant's current `available`), idempotent,
last-write-wins — so only the **final value per variant** ever needs to reach the marketplace.
Two independent ways to cut calls:

1. **Coalesce (de-dupe over time)** — collapse repeated changes to the _same_ variant into one
   push per time window. ✅ **Shipped (Approach A).**
2. **Batch (multi-SKU per call)** — combine _different_ variants' pushes into one API call.
   **Approach B (this doc).**

They compose: B can also coalesce.

## Approach A — coalesce per variant (SHIPPED 2026-06-16)

Every AUTO stock change (POS sale, order reserve/release, PO receive, return restock, opname
reconcile, manual adjust) enqueues the propagate job with a **stable per-(org, variant) jobId**
(`buildCoalescedPropagateJobId`) + a **60s delay** (`MARKETPLACE_SYNC_COALESCE_WINDOW_MS` in
`packages/queue/src/queues/marketplace-sync-producer.ts`). BullMQ ignores a duplicate jobId, so
a burst on one variant dedupes onto the single pending job; when it fires it re-reads the LATEST
`available` and pushes once. `removeOnComplete/Fail: true` frees the jobId for the next window.
**Manual syncs stay immediate** (unique event jobId, no delay). The worker token-bucket rate
limiter (LAZADA 500/min, burst 20) still paces calls on top.

- **Win:** a variant changed N times in a window → **1 call** instead of N.
- **Limit:** N _distinct_ variants changing still = **N calls** (one per variant). That's what B fixes.
- **Cost:** marketplace stock lags up to the window (~60s) → a small oversell window for fast-movers.

## When to escalate to Approach B

Build B when **many DISTINCT SKUs change at once** routinely makes the per-variant call count too
high, e.g.:

- a **large stock opname** posts variance across dozens/hundreds of SKUs;
- a **multi-line PO receive** lands many SKUs at once;
- a **bulk price/stock edit** or a big import-driven reconcile;
- a seller scales past the point where A's per-variant calls approach the rate-limit ceiling.

If the seller's day is mostly single-SKU sales, **A is enough** — don't build B pre-emptively.

## Approach B — dirty-set + scheduled flush + multi-SKU-per-call

**Key enabler:** Lazada `/product/stock/sellable/update` accepts **multiple `<Sku>` in one
`<Request>`** (`<Skus><Sku>…</Sku><Sku>…</Sku></Skus>`). Today's builder emits one SKU per call;
batching N SKUs → `ceil(N / chunk)` calls.

### Design

1. **Dirty tracking** — instead of enqueuing a per-variant delayed job, mark the variant's
   sync-enabled mappings dirty. Options:
   - a `pendingSyncAt DateTime?` (+ optional `pendingAvailable`) column on
     `MarketplaceProductMapping` (set on a stock change, cleared on successful push); OR
   - a dedicated `MarketplaceSyncOutbox` table (mappingId, queuedAt, attempts) — cleaner audit,
     one row per pending mapping.
     The value to push is re-read at flush time (latest `available`), so storing it is optional.
2. **Scheduled flush worker** — a repeatable job (every ~30–60s, `register-schedulers.ts`) per
   active connection: load dirty mappings, group by connection, **chunk** into multi-SKU payloads
   (start ~20–50 SKUs/call — verify Lazada's real max), call once per chunk.
3. **Multi-SKU payload builder** — generalize `buildLazadaSellableStockPayload` to take an array
   of `{ itemId, skuId, sellerSku?, syncWarehouseCode? , quantity }` and emit several `<Sku>`
   blocks (each keeps the non-destructive single-entry `<MultiWarehouseInventories>` from the
   multi-warehouse work).
4. **Per-SKU error handling** — Lazada returns per-SKU failures in `detail[]` even when the
   envelope is `code:0`. The flush must map each `detail[]` entry back to its SKU/mapping, mark
   only the failed ones for retry (or FAILED), and clear the succeeded ones. (The single-SKU path
   already parses `detail[]` — extend it to attribute errors per SKU.)
5. **Status model** — `MarketplaceSyncJob` is per-mapping today. A batch touches many mappings;
   either keep one sync-job row per mapping (created at flush, linked to a batch id) or add a
   `MarketplaceSyncBatch` parent. Keep per-mapping rows so the existing in-flight indicator +
   per-listing status keep working.
6. **Manual syncs** — "Sinkron semua" naturally becomes a batched flush (mark all sync-enabled
   dirty + flush now); per-listing "Kirim stok sekarang" can stay single-SKU or join the next flush.

### Trade-offs vs A

- ➕ Real call-count reduction when many distinct SKUs change (N → ceil(N/chunk)).
- ➕ Forward-compatible with the WMS/multi-location work (`docs/roadmap/wms-scoping.md`): the flush
  computes the per-channel rollup once and pushes the mapped warehouse.
- ➖ More infra: a dirty column/table + a flush worker + per-SKU error attribution + chunking.
- ➖ Coarser latency (flush cadence) unless paired with an immediate-flush trigger for urgent
  decrements.
- ⚠️ **Oversell** still bounded by the flush cadence; pair with a per-channel **safety buffer**
  (push `available − buffer`, deferred — see WMS scoping) if fast-movers oversell.

### Migration from A

A's coalescing is a clean stepping stone: replace the per-variant delayed propagate with
"mark dirty"; the flush worker subsumes the propagate fan-out. The `syncWarehouseCode` /
non-destructive payload + the per-mapping sync-job + in-flight indicator all carry over. Effort:
**M–L** (schema migration for the dirty column/outbox + flush worker + multi-SKU builder + per-SKU
error mapping + tests). Validate the multi-SKU payload + `detail[]` attribution **live** against a
real Lazada shop (like the single-SKU validation 2026-06-15) before shipping.

## Open decisions (when B is picked up)

1. Dirty column on the mapping vs a dedicated outbox table (audit + retry granularity).
2. Flush cadence + whether urgent **decrements** get an immediate-flush trigger (oversell vs calls).
3. Lazada's real **max SKUs per `<Skus>` call** (live-verify) → chunk size.
4. Batch status model: per-mapping rows + a batch id vs a `MarketplaceSyncBatch` parent.
5. Safety buffer to absorb the flush-window oversell for fast-movers.
6. Whether the coalesce window (`MARKETPLACE_SYNC_COALESCE_WINDOW_MS`) and flush cadence become a
   per-connection or env config (today: a code constant, 60s).
