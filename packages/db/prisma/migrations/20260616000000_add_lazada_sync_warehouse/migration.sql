-- AlterTable
-- Lazada multi-warehouse: per-connection designated sync warehouse (Falka owns one warehouse;
-- stock push writes `available` to ONLY this warehouseCode, leaving others untouched) + the
-- distinct warehouseCodes seen at import (populates the sync-warehouse picker). Both additive
-- and backward-compatible (null / empty = legacy single-warehouse bare path).
ALTER TABLE "marketplace_connections" ADD COLUMN     "knownWarehouseCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "syncWarehouseCode" TEXT;
