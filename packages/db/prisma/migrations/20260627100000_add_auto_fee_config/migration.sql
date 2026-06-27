-- Auto-derived fees: ESTIMATE a QRIS payment fee (per org) + marketplace commission (per
-- connection) from configurable percent rates, materialized monthly as Expense rows via
-- "Hitung fee bulan ini". Idempotent (upsert) per (org, autoSourceKey).

-- AlterTable: org-level QRIS payment-fee rate (percent).
ALTER TABLE "organizations" ADD COLUMN "qrisFeeRate" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- AlterTable: per-connection commission rate (percent).
ALTER TABLE "marketplace_connections" ADD COLUMN "commissionRate" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- AlterTable: idempotency key for auto-derived-fee expense rows.
ALTER TABLE "expenses" ADD COLUMN "autoSourceKey" TEXT;

-- CreateIndex: one LIVE derived-fee expense per (org, key) so re-running "Hitung fee bulan ini"
-- UPSERTS the month's estimate (manual + recurring rows, with a null autoSourceKey, are excluded).
CREATE UNIQUE INDEX "expenses_organizationId_autoSourceKey_key" ON "expenses"("organizationId", "autoSourceKey")
WHERE "autoSourceKey" IS NOT NULL AND "deletedAt" IS NULL;
