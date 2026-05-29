# Inventory Operational UI Architecture

This document describes the frontend architecture for the internal inventory dashboard. It is **operational tooling** for warehouse/ops teams — not a customer-facing storefront.

## Why operational UX matters

Operators managing thousands of SKUs need:

- Fast search (exact SKU/barcode lookup)
- At-a-glance health (low stock, out of stock)
- Clear mutation previews before committing stock changes
- Audit timelines for accountability

Marketing-style ecommerce UI patterns (hero sections, promotional cards) are intentionally avoided.

## Architecture layers

```
/dashboard/inventory                    → InventoryDashboard (tabs + URL state)
/dashboard/inventory/variants/[id]      → VariantDetailView

hooks/
  use-inventory-filters.ts    → URL-persisted filters (search, pagination, tab)
  use-inventory.ts            → TanStack Query (server state only)

store/
  inventory-ui.store.ts       → Zustand: modals, bulk selection (UI only)

components/
  inventory-overview-panel.tsx
  products-management-table.tsx
  variants-management-table.tsx
  inventory-timeline-panel.tsx
  stock-mutation-modal.tsx
  variant-detail-view.tsx
```

## State boundaries

| Concern                    | Tool             | Rationale                                |
| -------------------------- | ---------------- | ---------------------------------------- |
| Products, variants, stock  | TanStack Query   | Server cache, invalidation on mutation   |
| Search, filters, tab, page | URL query params | Shareable/bookmarkable ops views         |
| Modal open, bulk selection | Zustand          | Ephemeral UI; not duplicated server data |

## Filtering architecture

Filters serialize to URL via `utils/inventory-url.ts`:

- `tab` — overview | products | variants | inventory | timeline
- `search` — debounced 300ms; matches product name, SKU, barcode
- `stockStatus` — ALL | HEALTHY | LOW_STOCK | OUT_OF_STOCK
- `active` — ALL | ACTIVE | INACTIVE
- `page` / `pageSize` — pagination

Changing search resets `page` to 1.

## Table architecture

Products and variants use **paginated API** responses (`{ data, meta }`) matching the recordings library pattern.

Variant rows include:

- `StockStatusBadge` — derived from `availableStock` vs per-variant `lowStockThreshold`
- Bulk checkbox selection (foundation for future bulk adjust / CSV import)

## Mutation UX

`StockMutationModal` shows a **preview** before submit:

```
Current: 12  |  Adjustment: -2  |  Result: 10
```

All mutations go through existing API → `InventoryMutationService`. The UI never mutates stock directly.

## Low stock monitoring

Per-variant fields (schema):

- `lowStockThreshold` — default 5, configurable per SKU
- `alertEnabled` — future notification jobs

`resolveStockHealth()` in `utils/stock-health.ts` centralizes badge logic.

## Future marketplace readiness

Variant detail shows `marketplaceMappingCount` placeholder. Timeline and tables link to `/dashboard/inventory/variants/[id]` for deep inspection before sync features land.

## Performance notes

- Query keys include full filter objects for correct cache segmentation
- `placeholderData: (prev) => prev` on paginated queries reduces flicker
- Client-side stock health filter only when `LOW_STOCK` / `HEALTHY` (per-variant threshold comparison)
