-- Order's marketplace-reported last-update time (recency sort + incremental pull cursor)
-- and the per-connection order-sync watermark (decoupled from the pull cooldown).
ALTER TABLE "orders" ADD COLUMN "externalUpdatedAt" TIMESTAMP(3);
ALTER TABLE "marketplace_connections" ADD COLUMN "ordersSyncedThrough" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "orders_organizationId_externalUpdatedAt_idx" ON "orders"("organizationId", "externalUpdatedAt");
