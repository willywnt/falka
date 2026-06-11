-- AlterEnum
ALTER TYPE "SaleStatus" ADD VALUE 'PARTIALLY_REFUNDED';

-- CreateTable
CREATE TABLE "sale_refunds" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_refund_items" (
    "id" TEXT NOT NULL,
    "refundId" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "sale_refund_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sale_refunds_userId_idx" ON "sale_refunds"("userId");

-- CreateIndex
CREATE INDEX "sale_refunds_saleId_idx" ON "sale_refunds"("saleId");

-- CreateIndex
CREATE INDEX "sale_refund_items_refundId_idx" ON "sale_refund_items"("refundId");

-- CreateIndex
CREATE INDEX "sale_refund_items_productVariantId_idx" ON "sale_refund_items"("productVariantId");

-- AddForeignKey
ALTER TABLE "sale_refunds" ADD CONSTRAINT "sale_refunds_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_refunds" ADD CONSTRAINT "sale_refunds_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_refund_items" ADD CONSTRAINT "sale_refund_items_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "sale_refunds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_refund_items" ADD CONSTRAINT "sale_refund_items_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "sale_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_refund_items" ADD CONSTRAINT "sale_refund_items_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
