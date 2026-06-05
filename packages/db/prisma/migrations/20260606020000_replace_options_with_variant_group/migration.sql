-- AlterTable
ALTER TABLE "product_variants" DROP COLUMN "options",
ADD COLUMN     "variantGroup" TEXT;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "optionTypes";
