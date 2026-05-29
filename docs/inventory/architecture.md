# Inventory Domain Architecture

This document describes the inventory and product domain foundation for the Olshop commerce platform. It is **not** a full ecommerce system — orders, checkout, payment, and shipping are out of scope.

## Core principle: internal inventory as source of truth

```
┌─────────────────────┐     reads state      ┌──────────────────────┐
│  Internal Inventory │ ───────────────────► │  Marketplaces        │
│  (source of truth)  │                      │  (consumers only)    │
└─────────────────────┘                      └──────────────────────┘
         │
         │ events + audit
         ▼
┌─────────────────────┐
│  InventoryEvent     │
│  AuditLog           │
└─────────────────────┘
```

Marketplaces never own stock. Future sync jobs **push** internal state outward and may **pull** for reconciliation, but mutations always originate from internal domain services.

## Domain model

### Product (logical catalog item)

Represents a merchandising concept: e.g. _iPhone 15_. Products do **not** sync to marketplaces directly.

| Field       | Purpose                              |
| ----------- | ------------------------------------ |
| `userId`    | Ownership boundary (multi-tenant)    |
| `slug`      | Unique per user, URL-safe identifier |
| `deletedAt` | Soft delete                          |

### ProductVariant (sellable SKU)

The **sync unit** for future marketplace integrations. Each variant has a globally unique SKU per user (`@@unique([userId, sku])`).

Variant metadata (price, weight, dimensions) is stored here. **Stock is not** — it lives in `Inventory`.

### Inventory (stock state)

Separated from variant metadata to support:

- Reservation / allocation (future orders)
- Multiple stock buckets without polluting SKU records
- Warehouse expansion later

| Bucket           | Purpose                 |
| ---------------- | ----------------------- |
| `availableStock` | Sellable units          |
| `reservedStock`  | Held for pending orders |
| `damagedStock`   | Unsellable              |
| `incomingStock`  | Expected receipts       |

### InventoryEvent (audit trail)

Every stock change creates an immutable event. Used for:

- Operational debugging
- Sync traceability (`SYNC` type)
- Future analytics and rollback support

Event types: `INCREASE`, `DECREASE`, `ADJUSTMENT`, `RESERVE`, `RELEASE`, `SYNC`.

`previousStock` / `newStock` track **available** stock for most operations.

## Mutation flow

All stock mutations flow through `InventoryMutationService`. See [mutation-architecture.md](./mutation-architecture.md) for transactional guarantees, idempotency, and sync hooks.

```
API / Worker / Admin UI
        │
        ▼
InventoryServerService  (orchestration, CRUD)
        │
        ▼
InventoryMutationService  (single mutation entry point)
        │
        ├── validate business rules
        ├── prisma.$transaction
        │     ├── read Inventory row
        │     ├── apply bucket changes
        │     ├── create InventoryEvent
        │     └── create AuditLog
        └── return DTO
```

### Available methods

| Method            | Event type          | Behavior                                        |
| ----------------- | ------------------- | ----------------------------------------------- |
| `increaseStock()` | `INCREASE` / `SYNC` | Add to available                                |
| `decreaseStock()` | `DECREASE`          | Subtract from available (fails if insufficient) |
| `adjustStock()`   | `ADJUSTMENT`        | Set available to target value                   |
| `reserveStock()`  | `RESERVE`           | Move available → reserved                       |
| `releaseStock()`  | `RELEASE`           | Move reserved → available                       |

All methods enforce non-negative buckets inside a transaction.

## Module structure

```
apps/web/src/modules/inventory/
  domain/           # Business rules, slug helpers
  dto/              # API mappers
  errors/           # InventoryError
  repositories/     # Prisma access (no business logic)
  services/
    inventory-mutation.service.ts   # Stock mutations ONLY
    inventory-server.service.ts       # API-facing orchestration
  validators/       # Zod schemas
  types/            # DTO type re-exports
  hooks/            # React Query
  components/       # Operational dashboard UI
```

Prisma models live in `packages/db/prisma/schema.prisma`.

## API endpoints

| Method | Path                                       | Description                    |
| ------ | ------------------------------------------ | ------------------------------ |
| `GET`  | `/api/v1/inventory/products`               | List products                  |
| `POST` | `/api/v1/inventory/products`               | Create product                 |
| `GET`  | `/api/v1/inventory/variants`               | List variants                  |
| `POST` | `/api/v1/inventory/variants`               | Create variant + inventory row |
| `GET`  | `/api/v1/inventory`                        | Inventory table (all SKUs)     |
| `GET`  | `/api/v1/inventory/variants/:id/inventory` | Single variant inventory       |
| `POST` | `/api/v1/inventory/variants/:id/adjust`    | Adjust available stock         |
| `GET`  | `/api/v1/inventory/variants/:id/events`    | Event timeline                 |

All routes require Auth.js session; data is scoped by `userId`.

## Future marketplace preparation

Schema includes (not yet implemented):

- **`MarketplaceVariantMapping`** — links internal variant → external listing per connection
- **`MarketplaceSyncLog`** — per-sync audit for reconciliation jobs

These tables are intentionally minimal. Sync workers will use `InventoryMutationService.increaseStock/decreaseStock` with `eventType: 'SYNC'` and write to `MarketplaceSyncLog`.

## Schema rationale

1. **SKU uniqueness per user** — fast lookup for barcode scanners and sync jobs
2. **Denormalized `userId` on variants** — ownership checks without joining through Product
3. **1:1 Inventory ↔ Variant** — simple now; warehouse tables can split this later
4. **Indexed event queries** — `(variantId, createdAt)` for timeline; `(userId, type)` for ops dashboards
5. **Soft delete on Product/Variant** — preserve event history integrity

## Inventory lifecycle

1. **Create product** → logical catalog entry
2. **Create variant** → SKU + empty `Inventory` row (+ optional initial stock event)
3. **Operational adjustments** → `adjustStock` via dashboard or API
4. **Future: order placed** → `reserveStock`
5. **Future: order cancelled** → `releaseStock`
6. **Future: marketplace sync** → read internal state, push to provider, log `SYNC` events

## Running migrations

```bash
pnpm --filter @olshop/db db:migrate:dev
```

Or for production:

```bash
pnpm --filter @olshop/db db:migrate:deploy
```
