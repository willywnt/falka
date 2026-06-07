# Olshop — Product Backlog

> Companion to [`inventory-mvp.md`](./inventory-mvp.md). The MVP loop (inventory SoT · multi-channel
> orders · POS · purchasing · packing-video evidence · finance foundation) is shipped. This file tracks
> what's **not yet built**, prioritized, with effort + gating so the next pick is a quick decision.
>
> Legend — **Effort**: S (<½ day) · M (1 session) · L (multi-session) · XL (epic). **Gate**: 🟢 none ·
> 🟡 needs a schema migration (HARD CONSTRAINT #1 — confirm first) · 🔴 external dependency (partner /
> API key / WhatsApp approval / strategic decision).

## ✅ Shipped this session (2026-06-07, on `main`)

Correctness pack (orders/returns pagination, marketplace token-expiry guard, returns-netting in the
profit report) · inventory-valuation report · share-evidence on order/return dispute panels · manual
order actions (mark-shipped / edit resi / cancel-with-reason) · DAMAGE write-off. Detail in
`inventory-mvp.md` (§13 hardening bullet) + `CLAUDE.md §12`.

## 🚧 In progress

- **UI/UX redesign** — a fresh, non-generic visual system (keep the teal "Ombak" accent, add harmonizing
  complementary colors), redesigned shell + landing → all feature pages, global-component dedup, friendlier
  wording, and structural affordances reserved for the backlog below. Direction + phased plan being
  established; foundation + shell + landing first, then per-page polish. See `.cursor/rules/50-ui-design-system.mdc`.

## 🎯 Mid-size features (1 session each)

| #   | Item                                                              | Module              | Effort | Gate | Notes                                                                                                                                                                                                   |
| --- | ----------------------------------------------------------------- | ------------------- | ------ | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Discount + PPN/tax at POS checkout**                            | sales               | M      | 🟡   | Per-cart discount (% / fixed) + tax rate (inclusive/exclusive); `Sale`/`SaleItem` gain discount/tax/net fields. Required for ID compliance. Profit report must read net.                                |
| 2   | **Partial / per-item POS refund**                                 | sales               | M      | 🟡   | `voidSale` is all-or-nothing today. Add `SaleRefund`/`SaleRefundItem` + `PARTIALLY_REFUNDED`; reuse `applyOfflineSaleReversalTx` per refunded qty; net the profit report (after #1's netting approach). |
| 3   | **Stock opname / cycle count**                                    | inventory           | L      | 🟡   | `StockOpname`/`StockOpnameItem` (system vs counted vs variance); count by SKU/barcode via the existing scanner; variance posts a RECONCILE/MANUAL_ADJUST ledger row. Variance report.                   |
| 4   | **Per-channel performance report**                                | reporting           | M      | 🟢   | Beyond profit-by-channel: payment-method mix, return rate by channel, fulfillment time, turnover. Charts (see redesign).                                                                                |
| 5   | **Dead-stock & ABC analysis**                                     | inventory/reporting | M      | 🟢   | No-sales-in-N-days report + ABC classification; complements the reorder report + valuation.                                                                                                             |
| 6   | **Phase 6: scheduled reconciliation + provider-health dashboard** | queue/marketplace   | L      | 🟢   | Daily per-connection drift detect (pull external → compare → log); connection test endpoint (Lazada `validateStockSync` exists, unused) + health widget. High-value once real adapters live.            |
| 7   | **Supplier entity + per-supplier lead time**                      | purchasing          | L      | 🟡   | `Supplier` + `PurchaseOrder.supplierId`; per-supplier `leadTimeDays`/MOQ the reorder report prefers over the variant default. (Free-text `supplierName` today.) Precursor to AP.                        |

## 🛰️ Big bets (multi-session / gated, sequenced later)

| #   | Item                                                                        | Effort   | Gate | Notes                                                                                                                                                                                                                                                                                   |
| --- | --------------------------------------------------------------------------- | -------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | **Notification engine** (in-app tray + WhatsApp)                            | L        | 🔴   | Low-stock / new-order / return / below-cost / dead-connection alerts + preferences. `Notification`/`NotificationPreference` + a send worker + a topbar tray. In-app tray can ship un-gated; **WhatsApp Business approval (Meta, slow in ID)** gates the WA channel. The retention hook. |
| B   | **Marketplace token auto-refresh + OAuth callback**                         | L        | 🔴   | `encryptedRefreshToken` is stored but unused; real connections die on expiry. Scheduled refresh worker + per-provider OAuth callback routes. Pairs with the shipped token-expiry guard.                                                                                                 |
| C   | **Real Shopee / Tokopedia / TikTok adapters**                               | L (each) | 🔴   | Only Lazada is real (sandbox). Each needs OAuth + signed client + import + stock-sync + webhook/poll. **Start Shopee partner paperwork now — 6–12 wk lead time.** Lift token-crypto already done (`@olshop/utils/crypto`).                                                              |
| D   | **Courier aggregator (Biteship / RajaOngkir) + AWB at the packing station** | L        | 🔴   | Rate lookup, courier select, print AWB where `noResi` appears. `CourierProvider` + `ShippingLabel`. Needs API key/sandbox.                                                                                                                                                              |
| E   | **Multi-location / warehouse stock + transfers**                            | L        | 🟡   | Scope stock to `(variantId, locationId)`, `StockTransfer` ledger reason, location-aware pickers, per-location available summed to each channel. Foundational — rewrites inventory queries; sequence after Phase 6.                                                                      |
| F   | **Supplier accounts-payable** (3-way match, terms, aging)                   | L        | 🟡   | Builds on #7 Supplier. PO→invoice→payment, due dates, AP ledger, aging. Month-end reconciliation.                                                                                                                                                                                       |
| G   | **Organization + team RBAC → public API → SaaS billing**                    | XL       | 🔴   | Strictly single-user (`userId` everywhere). `Organization`/`TeamMember`/role, org-scoped queries, API-key auth, usage/tier gating. Biggest refactor; gated on the decision to go multi-tenant (locked internal-first today).                                                            |
| H   | **AI mismatch detection on packing video**                                  | XL       | 🔴   | CV/OCR auto-flag item/qty mismatches vs the order → automated dispute defense. `aiProcessing`/`ocrProcessing` placeholders reserved. Needs a CV API + review-queue UX.                                                                                                                  |

## ⚡ Quick wins (sub-hour)

- `@@index([userId, createdAt])` on `StockLedger` (activity-log scans) — index-only migration 🟡.
- Connection-level sync-health summary badge on the marketplace dashboard (read-only) 🟢.
- Standing below-cost alert at sale-create (log/flag when `unitPrice < unitCost`) 🟢.
- Show the "group · subvariant" label in POS / PO / inventory pickers (UI-only, reuse `formatVariantLabel`) 🟢.
- Archived-variant view + restore on product detail 🟢.

## Locked decisions (don't relitigate without a reason)

Internal-first / per-user-scoped (no org yet) · adapter-first + stubs until partner approval · append-only
`StockLedger` is the SoT, `Inventory` is the fast-read cache · returns net the profit report by
`processedAt` on still-shipped/completed orders · post-ship cancel = a return, not a release.
