-- CreateEnum
CREATE TYPE "MarketplaceMappingStatus" AS ENUM ('MAPPED', 'NEEDS_REVIEW');

-- AlterTable
ALTER TABLE "marketplace_connections" ADD COLUMN     "lastImportedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "marketplace_products" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketplaceConnectionId" TEXT NOT NULL,
    "provider" "MarketplaceProvider" NOT NULL,
    "externalProductId" TEXT NOT NULL,
    "externalVariantId" TEXT NOT NULL,
    "externalSku" TEXT,
    "externalProductName" TEXT NOT NULL,
    "externalVariantName" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "rawPayload" JSONB,
    "lastImportedAt" TIMESTAMP(3) NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "marketplace_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_product_mappings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketplaceConnectionId" TEXT NOT NULL,
    "marketplaceProductId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "provider" "MarketplaceProvider" NOT NULL,
    "mappingStatus" "MarketplaceMappingStatus" NOT NULL DEFAULT 'MAPPED',
    "syncEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoMapped" BOOLEAN NOT NULL DEFAULT false,
    "mappingConfidence" DECIMAL(3,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_product_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "marketplace_products_userId_idx" ON "marketplace_products"("userId");

-- CreateIndex
CREATE INDEX "marketplace_products_marketplaceConnectionId_idx" ON "marketplace_products"("marketplaceConnectionId");

-- CreateIndex
CREATE INDEX "marketplace_products_externalSku_idx" ON "marketplace_products"("externalSku");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_products_marketplaceConnectionId_externalProduc_key" ON "marketplace_products"("marketplaceConnectionId", "externalProductId", "externalVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_product_mappings_marketplaceProductId_key" ON "marketplace_product_mappings"("marketplaceProductId");

-- CreateIndex
CREATE INDEX "marketplace_product_mappings_userId_idx" ON "marketplace_product_mappings"("userId");

-- CreateIndex
CREATE INDEX "marketplace_product_mappings_marketplaceConnectionId_idx" ON "marketplace_product_mappings"("marketplaceConnectionId");

-- CreateIndex
CREATE INDEX "marketplace_product_mappings_productVariantId_idx" ON "marketplace_product_mappings"("productVariantId");

-- AddForeignKey
ALTER TABLE "marketplace_products" ADD CONSTRAINT "marketplace_products_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_products" ADD CONSTRAINT "marketplace_products_marketplaceConnectionId_fkey" FOREIGN KEY ("marketplaceConnectionId") REFERENCES "marketplace_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_product_mappings" ADD CONSTRAINT "marketplace_product_mappings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_product_mappings" ADD CONSTRAINT "marketplace_product_mappings_marketplaceConnectionId_fkey" FOREIGN KEY ("marketplaceConnectionId") REFERENCES "marketplace_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_product_mappings" ADD CONSTRAINT "marketplace_product_mappings_marketplaceProductId_fkey" FOREIGN KEY ("marketplaceProductId") REFERENCES "marketplace_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_product_mappings" ADD CONSTRAINT "marketplace_product_mappings_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
