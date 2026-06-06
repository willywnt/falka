-- CreateTable
CREATE TABLE "bundle_components" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bundleVariantId" TEXT NOT NULL,
    "componentVariantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bundle_components_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bundle_components_bundleVariantId_idx" ON "bundle_components"("bundleVariantId");

-- CreateIndex
CREATE INDEX "bundle_components_componentVariantId_idx" ON "bundle_components"("componentVariantId");

-- CreateIndex
CREATE INDEX "bundle_components_userId_idx" ON "bundle_components"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "bundle_components_bundleVariantId_componentVariantId_key" ON "bundle_components"("bundleVariantId", "componentVariantId");

-- AddForeignKey
ALTER TABLE "bundle_components" ADD CONSTRAINT "bundle_components_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_components" ADD CONSTRAINT "bundle_components_bundleVariantId_fkey" FOREIGN KEY ("bundleVariantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_components" ADD CONSTRAINT "bundle_components_componentVariantId_fkey" FOREIGN KEY ("componentVariantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
