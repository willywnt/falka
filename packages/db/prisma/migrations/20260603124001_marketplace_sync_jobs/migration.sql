-- CreateEnum
CREATE TYPE "MarketplaceSyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED');

-- CreateEnum
CREATE TYPE "MarketplaceSyncJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'DISABLED', 'SKIPPED');

-- AlterTable
ALTER TABLE "marketplace_product_mappings" ADD COLUMN     "lastSyncError" TEXT,
ADD COLUMN     "lastSyncStatus" "MarketplaceSyncStatus",
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "marketplace_sync_jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketplaceConnectionId" TEXT NOT NULL,
    "marketplaceProductMappingId" TEXT NOT NULL,
    "provider" "MarketplaceProvider" NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "syncStatus" "MarketplaceSyncJobStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "providerResponse" JSONB,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "lastAttemptAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_sync_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_sync_jobs_idempotencyKey_key" ON "marketplace_sync_jobs"("idempotencyKey");

-- CreateIndex
CREATE INDEX "marketplace_sync_jobs_userId_idx" ON "marketplace_sync_jobs"("userId");

-- CreateIndex
CREATE INDEX "marketplace_sync_jobs_marketplaceProductMappingId_idx" ON "marketplace_sync_jobs"("marketplaceProductMappingId");

-- CreateIndex
CREATE INDEX "marketplace_sync_jobs_syncStatus_idx" ON "marketplace_sync_jobs"("syncStatus");

-- AddForeignKey
ALTER TABLE "marketplace_sync_jobs" ADD CONSTRAINT "marketplace_sync_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_sync_jobs" ADD CONSTRAINT "marketplace_sync_jobs_marketplaceConnectionId_fkey" FOREIGN KEY ("marketplaceConnectionId") REFERENCES "marketplace_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_sync_jobs" ADD CONSTRAINT "marketplace_sync_jobs_marketplaceProductMappingId_fkey" FOREIGN KEY ("marketplaceProductMappingId") REFERENCES "marketplace_product_mappings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
