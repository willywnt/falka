# Disaster recovery strategy

> **Production = self-hosted Biznet VPS + Coolify — LIVE at `https://app.trypalka.com` (since 2026-06-28).**
> Postgres 16 + Redis 7 self-hosted in Docker (Coolify-managed), Cloudflare R2 for files; web + worker + a
> one-shot migrate service deploy from a CI-built GHCR image. Vercel + Neon are **retired**. Runbook + field
> notes: [coolify-setup.md](./coolify-setup.md).

Palka is a modular monolith. Recovery focuses on PostgreSQL, R2 object storage, and Redis queue state.

## Recovery priorities

| Priority | Component                   | Impact if lost                       | Recovery approach                                              |
| -------- | --------------------------- | ------------------------------------ | -------------------------------------------------------------- |
| P0       | PostgreSQL 16 (self-hosted) | Users, recordings metadata, auth     | Restore from the latest Coolify Postgres backup (pg_dump → R2) |
| P1       | Cloudflare R2               | Recording video files                | R2 versioning / bucket replication                             |
| P2       | Redis 7 (self-hosted)       | In-flight jobs, rate limits, metrics | Rebuild queues; jobs are retryable                             |
| P3       | Web container (Coolify)     | UI + API unavailable                 | Redeploy from git                                              |
| P3       | Worker host                 | Background jobs pause                | Restart worker; schedulers re-register                         |

## PostgreSQL

**Recommendation:** Enable Coolify's scheduled Postgres backups, shipped to R2.

- **RTO:** 15–60 minutes depending on database size
- **Procedure:**
  1. Identify incident timestamp
  2. Restore the latest good dump into the Postgres container
  3. Update `DATABASE_URL` in the Coolify resource env
  4. Run `pnpm db:migrate:deploy` to verify schema
  5. Smoke test auth + recordings list

## Cloudflare R2

**Recommendation:**

- Enable object versioning or periodic bucket sync to secondary bucket/account
- Document bucket name per environment (`palka-recordings` vs `palka-recordings-prod`)
- Use lifecycle rules for incomplete multipart uploads

**Orphan handling:**

- Run storage consistency verification job (dry-run) before manual cleanup
- Use admin ops endpoint `/api/v1/admin/ops` to review mismatches
- Do **not** auto-delete orphan objects without operator review

## Redis

Redis holds BullMQ queues, rate-limit counters, and lightweight metrics.

**Persistence expectations:**

- Self-hosted Redis 7 (Coolify-managed): treat as recoverable but not authoritative
- Local Docker Redis: ephemeral; acceptable for development only

**Recovery:**

1. Restart the Redis instance
2. Restart worker (`pnpm --filter @palka/worker start`)
3. Schedulers re-register repeat jobs on boot
4. Failed jobs remain in BullMQ failed set if persistence enabled
5. Rate limits and metrics counters reset (acceptable)

## Worker process

Worker supports graceful shutdown on `SIGTERM` / `SIGINT`:

1. Stop accepting health traffic
2. Close BullMQ workers (finishes active jobs)
3. Close Redis + Prisma connections
4. Flush Sentry buffer

Set `WORKER_SHUTDOWN_TIMEOUT_MS=30000` on container platforms.

## Web + worker (Coolify)

- Redeploy the GHCR image from Coolify (or re-trigger the CI build)
- Verify env vars in the Coolify resource
- Confirm `/api/health` returns `ok`

## Testing recovery

Quarterly drill:

1. Restore a backup to staging
2. Verify worker connects to staging Redis + DB
3. Confirm recording upload + playback against R2 staging bucket
4. Review Sentry + logs for errors during drill

## Future architecture notes

When adding marketplace OAuth, AI/OCR workers, or external processors:

- Store OAuth tokens encrypted (`MARKETPLACE_ENCRYPTION_SECRET`)
- Use separate BullMQ queues per domain
- Propagate `requestId` into all new job payloads
- Add health checks for each external dependency

See `FUTURE_QUEUE_CAPABILITIES` in `packages/queue/src/types/index.ts`.
