# Inventory Mutation Architecture

This document describes the centralized inventory mutation system. **All stock changes must flow through `InventoryMutationService`** — no direct Prisma updates to `inventory` rows elsewhere in the codebase.

## Why centralization matters

Without a single mutation entry point:

- Business rules get duplicated across API routes, workers, and UI
- Audit events are skipped or inconsistent
- Race conditions cause negative stock
- Marketplace sync cannot reliably observe changes

Centralization guarantees **atomicity**, **auditability**, and **future sync hooks** in one place.

## Mutation flow

```
Client (Dashboard / API / Future Worker)
        │
        ▼
InventoryServerService        ← orchestration, auth scoping, DTO mapping
        │
        ▼
InventoryMutationService    ← ONLY valid stock mutation path
        │
        ├── validate rules (domain/inventory-rules.ts)
        ├── check idempotencyKey (optional replay)
        ├── prisma.$transaction
        │     ├── SELECT … FOR UPDATE (row lock)
        │     ├── apply bucket changes
        │     ├── INSERT InventoryEvent
        │     └── INSERT AuditLog
        └── post-commit hook → sync enqueue foundation
```

## Available mutations

| Method            | Event               | Rules enforced                              |
| ----------------- | ------------------- | ------------------------------------------- |
| `increaseStock()` | `INCREASE` / `SYNC` | Positive quantity, non-negative result      |
| `decreaseStock()` | `DECREASE`          | Available ≥ quantity                        |
| `adjustStock()`   | `ADJUSTMENT`        | Target ≠ current, non-negative target       |
| `reserveStock()`  | `RESERVE`           | Available ≥ quantity (reservation overflow) |
| `releaseStock()`  | `RELEASE`           | Reserved ≥ quantity                         |

Variant bootstrap uses `bootstrapEmptyInventory()` + `applyInitialStock()` inside the variant creation transaction — still routed through the mutation pipeline.

## Transactional guarantees

1. **Row-level lock** — `InventoryRepository.findByVariantIdForUpdate()` uses `SELECT … FOR UPDATE` inside the transaction
2. **Atomic triple-write** — inventory buckets, event, and audit log in one transaction
3. **No partial mutations** — failure rolls back all changes
4. **Post-commit hooks** — sync enqueue runs after successful commit (never inside the transaction)

## Event lifecycle

Every mutation creates an `InventoryEvent` with:

- `previousStock` / `newStock` — available stock before/after
- `quantity` — magnitude of change
- `type` — mutation category
- `reason` — human-readable justification (required for adjust/reserve/release via API)
- `metadata` — structured envelope including `idempotencyKey`, `source`, `operationRef`
- `actorId` — user who performed the mutation

Events are the **audit source of truth** for operational debugging and future analytics.

## Idempotency foundation

Pass `idempotencyKey` in mutation requests (min 8 chars). The service:

1. Queries existing events by `metadata.idempotencyKey`
2. If found → returns prior result with `idempotentReplay: true` (no double mutation)
3. If not found → proceeds normally and stores key in event metadata

Prepares for async worker retries without duplicate stock changes.

## Repository responsibilities

| Repository                 | Role                                                    |
| -------------------------- | ------------------------------------------------------- |
| `InventoryRepository`      | CRUD + `FOR UPDATE` locking                             |
| `InventoryEventRepository` | Event persistence, timeline queries, idempotency lookup |
| `ProductVariantRepository` | Ownership-scoped variant access                         |
| `ProductRepository`        | Catalog CRUD (no stock)                                 |

Repositories contain **no business rules** — only data access.

## API endpoints

| Method | Path                                     | Mutation       |
| ------ | ---------------------------------------- | -------------- |
| `POST` | `/api/v1/inventory/variants/:id/adjust`  | `adjustStock`  |
| `POST` | `/api/v1/inventory/variants/:id/reserve` | `reserveStock` |
| `POST` | `/api/v1/inventory/variants/:id/release` | `releaseStock` |
| `GET`  | `/api/v1/inventory/variants/:id/history` | Timeline query |

All routes delegate to `InventoryServerService` → `InventoryMutationService`.

## Future sync readiness

After each successful mutation, `onInventoryMutated()` hook:

1. Emits structured log (`inventory.mutation.completed`)
2. Prepares `PropagateInventoryStockJobPayload` for BullMQ queue `inventory-sync`

Worker implementation is deferred — payload schema lives in `@olshop/queue`.

## Domain errors

| Code                    | When                                   |
| ----------------------- | -------------------------------------- |
| `INSUFFICIENT_STOCK`    | Decrease exceeds available             |
| `RESERVATION_OVERFLOW`  | Reserve exceeds available              |
| `INSUFFICIENT_RESERVED` | Release exceeds reserved               |
| `INVALID_ADJUSTMENT`    | Target equals current stock            |
| `NEGATIVE_STOCK`        | Post-mutation bucket validation failed |

Mapped to HTTP responses via `InventoryError` in `handleApiError()`.

## Boundaries

- **UI** — React Query hooks call API only; no business logic
- **API routes** — validate with Zod, call server service
- **Server service** — orchestration + auth scope
- **Mutation service** — rules + transactions + events
- **Repositories** — Prisma access only
