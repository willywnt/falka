# Worker deployment guide

> **Production = self-hosted Biznet VPS + Coolify — LIVE at `https://app.trypalka.com` (since 2026-06-28).**
> Postgres 16 + Redis 7 self-hosted in Docker (Coolify-managed), Cloudflare R2 for files; web + worker + a
> one-shot migrate service deploy from a CI-built GHCR image. Vercel + Neon are **retired**. Runbook + field
> notes: [coolify-setup.md](./coolify-setup.md).

Palka background jobs run in a **persistent Node.js worker process** (`apps/worker`). They run as a persistent Node process, never a serverless function.

## Architecture

| Component   | Location          | Role                        |
| ----------- | ----------------- | --------------------------- |
| Web app     | Coolify (VPS)     | API + UI                    |
| Redis 7     | Coolify container | BullMQ queue backend        |
| Worker      | Persistent host   | Job processors + schedulers |
| Postgres 16 | Coolify container | Prisma data                 |
| R2          | Cloudflare        | Object storage cleanup      |

## Queues

| Queue                    | Schedule                | Purpose                                                                                                           |
| ------------------------ | ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `recording-cleanup`      | Daily 02:00 UTC         | Retention cleanup + R2 delete                                                                                     |
| `storage-recalculation`  | Daily 03:00 UTC         | Repair `storageUsedBytes`                                                                                         |
| `upload-recovery`        | Every 6 hours           | Stale sessions + failed upload cleanup                                                                            |
| `audit-cleanup`          | Daily 04:00 UTC         | Audit log retention                                                                                               |
| `marketplace-reconcile`  | Daily 05:00 + 06:00 UTC | Token refresh (`refresh-marketplace-tokens`, 05:00) + drift reconciliation (`reconcile-marketplace-drift`, 06:00) |
| `marketplace-propagate`  | Event-driven            | Fan-out a variant's stock change to its mappings (`propagate-inventory-stock`)                                    |
| `marketplace-stock-sync` | Event-driven            | Push one mapping's stock to the provider adapter (`sync-marketplace-stock`)                                       |

## Environment variables

Required for the worker (same as web, plus Redis):

```env
DATABASE_URL=
REDIS_URL=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_RECORDINGS_BUCKET_NAME=
MARKETPLACE_ENCRYPTION_SECRET=
WORKER_HEALTH_PORT=3001
WORKER_ENABLE_SCHEDULERS=true
```

`AUTH_SECRET` is still required by `@palka/config/env.server` validation today.

## Local development

```bash
pnpm infra:up          # Postgres + Redis
pnpm db:migrate:deploy
pnpm dev:worker        # BullMQ worker + /health on :3001
pnpm dev:web           # Next.js app
```

Health check:

```bash
curl http://localhost:3001/health
```

## Deployment (Coolify)

In production the worker is a service in `docker-compose.coolify.yml`, deployed from the CI-built GHCR image alongside web and the one-shot migrate service.

1. Start command: `pnpm --filter @palka/worker start`.
2. Schedulers on (`WORKER_ENABLE_SCHEDULERS=true`) — only one scheduler owner.
3. Health check on `/health` port `3001`; no scale-to-zero (it is an always-on process).
4. Link the Coolify-managed Redis resource and share env with web where appropriate.

## Operational notes

- **Concurrency:** destructive queues run with concurrency `1` to avoid double deletion.
- **Retries:** jobs use exponential backoff (5 attempts by default).
- **Dead letters:** permanently failed jobs are logged as `job.dead_letter` via Pino.
- **Graceful shutdown:** worker handles `SIGTERM` / `SIGINT`, closes BullMQ workers, Redis, and Prisma.
- **Schedulers:** set `WORKER_ENABLE_SCHEDULERS=false` on secondary worker replicas if you run multiple instances (only one scheduler owner recommended).

## Marketplace queues (live)

Marketplace sync runs on the worker today (`packages/queue/src/marketplace-sync/*`):

- **Token refresh** — `refresh-marketplace-tokens` job on the `marketplace-reconcile` queue (daily 05:00 UTC, plus lazy refresh-before-use in the sync engine).
- **Drift reconciliation** — `reconcile-marketplace-drift` job on the `marketplace-reconcile` queue (daily 06:00 UTC, read-only: surfaces drift, never writes back).
- **Stock synchronization** — a source-of-truth stock change enqueues `propagate-inventory-stock` (queue `marketplace-propagate`) → fans out to `sync-marketplace-stock` (queue `marketplace-stock-sync`) → provider adapter.

These need a persistent worker; these run on the always-on Coolify worker in production today.

## Future-ready queues (not implemented)

The `@palka/queue` package reserves architecture for:

- AI processing / thumbnails / OCR

See `FUTURE_QUEUE_CAPABILITIES` in `packages/queue/src/types/index.ts`.
