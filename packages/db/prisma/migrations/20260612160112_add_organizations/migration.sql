-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('OWNER', 'ADMIN', 'STAFF');

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "resourceId" TEXT;

-- AlterTable
ALTER TABLE "bundles" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "marketplace_connections" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "marketplace_product_mappings" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "marketplace_products" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "marketplace_sync_jobs" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "pairing_sessions" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "recording_share_links" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "recordings" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "returns" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "sale_refunds" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "stock_ledger_entries" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "stock_opnames" ADD COLUMN     "organizationId" TEXT;

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "storageQuotaBytes" BIGINT NOT NULL DEFAULT 524288000,
    "storageUsedBytes" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_invites" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "usedByUserId" TEXT,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_userId_key" ON "organization_members"("userId");

-- CreateIndex
CREATE INDEX "organization_members_organizationId_idx" ON "organization_members"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organizationId_userId_key" ON "organization_members"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_invites_code_key" ON "organization_invites"("code");

-- CreateIndex
CREATE INDEX "organization_invites_organizationId_idx" ON "organization_invites"("organizationId");

-- CreateIndex
CREATE INDEX "audit_logs_organizationId_createdAt_idx" ON "audit_logs"("organizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_usedByUserId_fkey" FOREIGN KEY ("usedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pairing_sessions" ADD CONSTRAINT "pairing_sessions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recording_share_links" ADD CONSTRAINT "recording_share_links_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_connections" ADD CONSTRAINT "marketplace_connections_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundles" ADD CONSTRAINT "bundles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_ledger_entries" ADD CONSTRAINT "stock_ledger_entries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_products" ADD CONSTRAINT "marketplace_products_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_product_mappings" ADD CONSTRAINT "marketplace_product_mappings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_sync_jobs" ADD CONSTRAINT "marketplace_sync_jobs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_refunds" ADD CONSTRAINT "sale_refunds_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_opnames" ADD CONSTRAINT "stock_opnames_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- Backfill (hand-written): one organization per existing user, id := user.id.
-- That identity keeps R2 storage-key prefixes (`${userId}/...`) and per-scope
-- code sequences (S/PO/OP/RF counts) valid verbatim. Every existing user
-- becomes the OWNER of their own organization; storage quota copies over.
-- ============================================================================

INSERT INTO "organizations" ("id", "name", "storageQuotaBytes", "storageUsedBytes", "createdAt", "updatedAt")
SELECT
    u."id",
    COALESCE(NULLIF(u."displayName", ''), split_part(u."email", '@', 1)),
    u."storageQuotaBytes",
    u."storageUsedBytes",
    u."createdAt",
    NOW()
FROM "users" u;

INSERT INTO "organization_members" ("id", "organizationId", "userId", "role", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, u."id", u."id", 'OWNER', NOW(), NOW()
FROM "users" u;

-- Domain rows: the old per-user scope IS the new per-org scope.
UPDATE "pairing_sessions"             SET "organizationId" = "userId";
UPDATE "recordings"                   SET "organizationId" = "userId";
UPDATE "recording_share_links"        SET "organizationId" = "userId";
UPDATE "marketplace_connections"      SET "organizationId" = "userId";
UPDATE "products"                     SET "organizationId" = "userId";
UPDATE "product_variants"             SET "organizationId" = "userId";
UPDATE "bundles"                      SET "organizationId" = "userId";
UPDATE "stock_ledger_entries"         SET "organizationId" = "userId";
UPDATE "marketplace_products"         SET "organizationId" = "userId";
UPDATE "marketplace_product_mappings" SET "organizationId" = "userId";
UPDATE "marketplace_sync_jobs"        SET "organizationId" = "userId";
UPDATE "orders"                       SET "organizationId" = "userId";
UPDATE "returns"                      SET "organizationId" = "userId";
UPDATE "sales"                        SET "organizationId" = "userId";
UPDATE "sale_refunds"                 SET "organizationId" = "userId";
UPDATE "purchase_orders"              SET "organizationId" = "userId";
UPDATE "stock_opnames"                SET "organizationId" = "userId";
UPDATE "audit_logs"                   SET "organizationId" = "userId" WHERE "userId" IS NOT NULL;
