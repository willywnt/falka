# Inventory & Multi-Marketplace Stock Sync — MVP Roadmap

> Status: **planning / Phase 0 in progress** · Started 2026-06-03 · Owner: @willywnt
>
> This is the working reference for the next big MVP: an **internal inventory system
> that is the source of truth**, integrating stock across marketplaces (Shopee,
> Tokopedia, TikTok Shop first; more later). Read alongside [`CLAUDE.md`](../../CLAUDE.md).

## 1. Locked decisions

| #   | Decision                | Choice                                     | Implication                                                                                                                                                                             |
| --- | ----------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Tenancy                 | **Internal-first, but per-user-scoped**    | Every new model carries `userId` (like today's schema). No org/tenant/billing yet, but scoping is correct so a multi-seller SaaS later is additive (add `Organization`), not a rewrite. |
| 2   | Marketplace integration | **Adapter-first + stubs**                  | Build & test the whole pipeline with `Dev`/`Unwired` provider adapters. Wire real Shopee/Tokopedia/TikTok APIs only when partner approval lands (TikTok approval is slow).              |
| 3   | UI/UX                   | **Light IA reshell first, redesign later** | Phase 0 reorganizes the sidebar/shell into product sections without touching existing pages. Full visual redesign happens only once the domain is stable.                               |

## 2. Product vision

`Recording` is bound to `noResi` (a shipment tracking number = an order). That means the
existing recording feature is really the **fulfillment-proof step of an order/inventory
product**, not a standalone feature. The unified loop:

> **Multi-channel orders IN → Inventory as source of truth (prevent oversell) →
> pick/pack with barcode scan + packing-video proof → ship.**

Differentiator vs Indonesian incumbents (Jubelio / Ginee / Forstok): **built-in
packing-video evidence per resi** — directly answering ID sellers' pain (buyer-fraud
claims, "barang tidak sesuai", retur).

## 3. Prior art — a reverted design we reuse as blueprint

A full inventory + sync implementation was already built then reverted. The source is
gone, but **compiled artifacts remain** in `packages/queue/dist/marketplace-sync/`:
`sync-engine`, `stock-normalizer`, `stock-provider.registry` (with `Dev`/`Unwired`
stub adapters), `idempotency`, `rate-limit`, `reconciliation.types`, `sync-repository`,
`sync-errors`, plus jobs `propagate-inventory-stock.job` / `sync-marketplace-stock.job`.

**Do not delete these `dist` files yet** — they are the blueprint. Reconstructed models:

- `MarketplaceAccount` (evolves today's `MarketplaceConnection`): `status`, `storeName`,
  `externalStoreId`, `lastConnectedAt`, `lastSyncAt`, encrypted tokens, `metadata`.
- `Product` → `ProductVariant`: `sku`, `barcode`, `price`/`cost`/`weight` (Decimal),
  `dimensions` (Json), `lowStockThreshold`, `alertEnabled`.
- `Inventory` (1:1 variant): `availableStock`, `reservedStock`, `damagedStock`, `incomingStock`.
- `MarketplaceProduct`: external listing snapshot (`externalProductId/VariantId/Sku`,
  `stock`, `rawPayload`, `status`, `lastImportedAt`, `lastSyncedAt`).
- `MarketplaceProductMapping`: variant ↔ external listing (`syncEnabled`, `autoMapped`,
  `mappingConfidence`).
- `MarketplaceSyncJob`: `idempotencyKey`, `syncType`, `syncStatus`, `attempts`, `providerResponse`.
- `ProviderHealth` + `SyncLog`: per-account observability + per-sync audit.

Sync flow: internal stock change → `propagate-inventory-stock.job` (find all sync-ready
mappings for the variant, create sync jobs) → `sync-marketplace-stock.job` (push to each
marketplace via adapter; idempotent, rate-limited, retried) + reconciliation (drift detection).

## 4. Phased roadmap

Each phase follows the `CLAUDE.md` workflow: incremental, per-module, one logical commit
per change, all gates green (`typecheck`/`lint`/`build`/`test`).

- **Phase 0 — IA reshell** _(no schema)_ — Group the sidebar into product sections
  (Catalog, Channels, Fulfillment, System), add placeholder Products/Inventory pages.
  Existing pages and routes untouched.
- **Phase 1 — Inventory foundation** _(internal SoT, no marketplace)_ — `Product`,
  `ProductVariant`, `Inventory`, and an **append-only `StockLedger`** as the real SoT.
  New modules `catalog` + `inventory`: catalog CRUD, manual stock adjustments, ledger,
  low-stock alerts. Usable on its own as an internal stock manager. **Needs schema approval.**
- **Phase 2 — Catalog ↔ marketplace mapping** _(read-only import)_ — Evolve
  `MarketplaceConnection` → `MarketplaceAccount`; add `MarketplaceProduct` + import job
  (via stub adapter); `MarketplaceProductMapping` (auto-map by SKU/barcode + confidence,
  manual override). No writes to marketplaces yet.
- **Phase 3 — Outbound stock sync** _(SoT → marketplaces)_ — Port the reverted engine:
  `propagate-inventory-stock` + `sync-marketplace-stock`, idempotency, rate-limit,
  provider health, sync log/status. `Dev`/`Unwired` adapters → first real Shopee adapter.
  Per-account toggle, dry-run, manual retry; read-only reconciliation preview.
- **Phase 4 — Inbound orders** _(close the loop, anti-oversell)_ — `Order` + `OrderItem`;
  pull/webhook orders per marketplace. Paid order → reserve/decrement internal SoT →
  propagate updated available to the **other** channels. Idempotent (webhooks retry).
- **Phase 5 — Fulfillment unification** — Link `Recording` ↔ `Order` via `noResi`. Scan
  resi → resolve order → show what to pack → record packing video → mark fulfilled.
- **Phase 6 — Automation & reporting** — Scheduled reconciliation (auto-correct/alert on
  drift), provider health dashboard, token auto-refresh worker, sales-velocity / dead-stock
  / channel-performance reports.
- **Then** — full visual UI/UX redesign, once the domain is stable.

## 5. Phase 1 schema draft — **REVIEW BEFORE IMPLEMENTING**

Prisma schema is `CLAUDE.md` HARD CONSTRAINT #1. This is a proposal; it is **not** applied
until approved.

```prisma
model Product {            // catalog master
  id, userId, name, description?, category?, isActive, createdAt, updatedAt, deletedAt
}

model ProductVariant {     // the sellable unit
  id, userId, productId, sku, name, barcode?,
  price Decimal, cost Decimal?, weight Decimal?, dimensions Json?,
  isActive, lowStockThreshold Int, alertEnabled, createdAt, updatedAt, deletedAt
}

model Inventory {          // 1:1 with variant — fast-read cached numbers
  id, variantId @unique, availableStock, reservedStock, damagedStock, incomingStock, lastAdjustedAt
}

model StockLedger {        // APPEND-ONLY — the real source of truth for every mutation
  id, userId, variantId, delta Int, balanceAfter Int,
  reason  (MANUAL_ADJUST | RESTOCK | DAMAGE | ORDER_RESERVE | ORDER_SHIP | MARKETPLACE_SYNC | RECONCILE),
  source  (MANUAL | MARKETPLACE | SYSTEM),
  referenceId?, note?, createdAt
}
```

`Inventory` is a fast-read cache for the UI; `StockLedger` is the undeniable truth. Every
stock change = one ledger row + one `Inventory` update inside a single transaction.

## 6. Architecture principles (industry-fit, hold these)

- **Append-only `StockLedger` is the SoT** — never rely on a mutable counter alone. Every
  mutation records `reason` + `source` + `referenceId`. This keeps the system correct and
  auditable when syncs fail or fire twice.
- **`reserved` vs `available`** — the anti-oversell distinction.
- **Idempotency everywhere** — orders and webhooks can be delivered more than once.
- **Outbound sync is async + retried** — show per-listing sync status; never promise hard real-time.
- **Adapter-first with stubs** — build/test the full pipeline before official API approval.

## 7. Module & layout placement (per `CLAUDE.md` §3–4)

- `apps/web/src/modules/catalog` — `Product` / `ProductVariant` (catalog master).
- `apps/web/src/modules/inventory` — stock levels, `StockLedger`, adjustments, alerts.
- `apps/web/src/modules/marketplace` _(existing)_ — extend with accounts, external
  products, mappings, sync orchestration UI.
- `apps/web/src/modules/orders` — Phase 4.
- `apps/web/src/modules/recordings` _(existing)_ — becomes order-aware in Phase 5.
- `packages/queue/src/marketplace-sync` — the sync engine (worker-side), ported from `dist`.
- **Boundary watch:** token decryption currently lives in the web `marketplace` module, but
  the worker needs it for sync. Lift the token-crypto into a shared `@olshop/*` package
  rather than cross-importing web internals into the worker (the reverted design kept a
  queue-local copy — prefer a shared package). Flag as its own change.

## 8. Parked ideas for later MVPs

- Export packing-video as **dispute evidence** (shareable link to buyer/marketplace).
- **AI mismatch detection** in packing video (vision/OCR) — `aiProcessing`/`ocrProcessing`
  placeholders already reserved in `packages/queue` types.
- Purchasing / restock + suppliers (`incomingStock` already modeled).
- Bundles / kits (one listing = many SKUs) — a classic oversell trap.
- Multi-warehouse / location stock.
- Returns (retur) tied to recordings.
- Analytics / reporting.
- Recording thumbnail generation (`thumbnailGeneration` placeholder reserved).

## 9. Approval gates

- [ ] Phase 1 schema (§5) approved before touching `schema.prisma` + migration.
- [ ] Real marketplace API wiring (Phase 3+) gated on partner/developer approvals.
