-- Composite indexes for the heavy org-scoped report/list/board queries.
-- Order is filtered by org+status+placedAt (reporting) and org+status (packing board);
-- Sale by org+createdAt (reporting + the sales list). Without these the planner scans
-- the org index and filters/sorts the range in the heap. Mirrors the StockLedger
-- [organizationId, createdAt] precedent. Index-only — no data change.

-- CreateIndex
CREATE INDEX "orders_organizationId_status_idx" ON "orders"("organizationId", "status");

-- CreateIndex
CREATE INDEX "orders_organizationId_placedAt_idx" ON "orders"("organizationId", "placedAt");

-- CreateIndex
CREATE INDEX "sales_organizationId_createdAt_idx" ON "sales"("organizationId", "createdAt");
