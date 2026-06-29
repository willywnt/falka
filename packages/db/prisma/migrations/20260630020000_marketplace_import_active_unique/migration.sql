-- At most ONE non-terminal (active) import per connection — the atomic guard against the
-- check-then-create race in marketplaceImportJobService.startImport (Prisma can't model a partial
-- unique index, so it lives as raw SQL like the finance auto-gen indexes).
CREATE UNIQUE INDEX "marketplace_import_jobs_active_uq"
  ON "marketplace_import_jobs" ("connectionId")
  WHERE "status" IN ('PENDING', 'PROCESSING');
