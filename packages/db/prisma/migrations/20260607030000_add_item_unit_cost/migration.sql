-- AlterTable
ALTER TABLE "order_items" ADD COLUMN "unitCost" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "sale_items" ADD COLUMN "unitCost" DECIMAL(12,2);
