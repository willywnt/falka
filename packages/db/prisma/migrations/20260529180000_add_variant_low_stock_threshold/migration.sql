-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN "lowStockThreshold" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "product_variants" ADD COLUMN "alertEnabled" BOOLEAN NOT NULL DEFAULT true;
