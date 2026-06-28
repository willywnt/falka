-- Rename the `noResi` column to `trackingNumber` on the three models that carry a
-- shipment tracking number (Recording, Order, Return). A column RENAME preserves all
-- data — Prisma's own field-rename would emit DROP + ADD and lose it — so this
-- migration is hand-authored. Behaviour is unchanged; only the identifier is anglicized.
-- (The Indonesian UI copy stays "Resi"; the case-insensitive match stays `mode: 'insensitive'`.)

ALTER TABLE "recordings" RENAME COLUMN "noResi" TO "trackingNumber";
ALTER TABLE "orders" RENAME COLUMN "noResi" TO "trackingNumber";
ALTER TABLE "returns" RENAME COLUMN "noResi" TO "trackingNumber";

-- The composite index on recordings follows the column name Prisma now derives.
ALTER INDEX "recordings_organizationId_noResi_idx" RENAME TO "recordings_organizationId_trackingNumber_idx";
