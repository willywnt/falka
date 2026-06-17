-- AlterTable: TikTok Shop (Tokopedia channel) requires an opaque shop_cipher alongside shop_id
-- on every shop-scoped call. Nullable; unused by Lazada/Shopee.
ALTER TABLE "marketplace_connections" ADD COLUMN "externalShopCipher" TEXT;
