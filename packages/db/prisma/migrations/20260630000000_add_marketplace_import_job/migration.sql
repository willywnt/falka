-- CreateEnum
CREATE TYPE "MarketplaceImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED');

-- CreateTable
CREATE TABLE "marketplace_import_jobs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "provider" "MarketplaceProvider" NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "status" "MarketplaceImportStatus" NOT NULL DEFAULT 'PENDING',
    "totalProducts" INTEGER,
    "processedProducts" INTEGER NOT NULL DEFAULT 0,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "autoMappedCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "offsetCheckpoint" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "marketplace_import_jobs_organizationId_idx" ON "marketplace_import_jobs"("organizationId");

-- CreateIndex
CREATE INDEX "marketplace_import_jobs_connectionId_status_idx" ON "marketplace_import_jobs"("connectionId", "status");

-- AddForeignKey
ALTER TABLE "marketplace_import_jobs" ADD CONSTRAINT "marketplace_import_jobs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_import_jobs" ADD CONSTRAINT "marketplace_import_jobs_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "marketplace_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_import_jobs" ADD CONSTRAINT "marketplace_import_jobs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
