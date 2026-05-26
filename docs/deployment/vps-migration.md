# VPS / Coolify Migration Strategy

The current stack (Vercel + Neon + R2) is designed to be **vendor-portable**. This document outlines migration to self-hosted infrastructure when scale or cost requires it.

## Current vs future architecture

| Component | Current                | Future VPS option                   |
| --------- | ---------------------- | ----------------------------------- |
| App       | Vercel serverless      | Docker + Coolify / Caddy            |
| Database  | Neon PostgreSQL        | Self-hosted PostgreSQL 16           |
| Redis     | Docker local / Upstash | Self-hosted Redis 7                 |
| Storage   | Cloudflare R2          | MinIO (S3-compatible)               |
| Jobs      | Not yet                | BullMQ workers (separate container) |

## Portability design decisions

These choices make migration straightforward:

1. **Modular monolith** — all business logic in `apps/web/src/modules/`, no Vercel-specific APIs
2. **StorageProvider abstraction** — swap R2 for MinIO without changing upload flow
3. **Prisma ORM** — works with any PostgreSQL host
4. **Standard env vars** — no Vercel-only configuration required at runtime
5. **Docker Compose for infra** — already used locally for Postgres + Redis

## Migration phases

### Phase 1 — Keep managed services, move app

Deploy Next.js as a standalone Node.js app:

```bash
pnpm turbo build --filter=@olshop/web
node apps/web/.next/standalone/server.js  # if standalone output enabled
```

Or use Coolify with:

- Build: `pnpm turbo build --filter=@olshop/web`
- Start: `pnpm --filter @olshop/web start`
- Keep Neon + R2

### Phase 2 — Self-host database and Redis

1. Provision VPS (minimum 2 vCPU, 4 GB RAM)
2. Run `docker-compose.yml` (Postgres + Redis) on VPS
3. Migrate data from Neon via `pg_dump` / `pg_restore`
4. Update `DATABASE_URL` and `REDIS_URL`
5. Run `pnpm db:migrate:deploy`

### Phase 3 — Self-host storage

1. Deploy MinIO on VPS or separate storage node
2. Implement or configure `MinioStorageProvider` (same S3 SDK)
3. Migrate objects from R2 via `rclone` or AWS CLI
4. Update `R2_*` env vars to MinIO endpoint
5. Apply equivalent CORS rules on MinIO

### Phase 4 — Background workers

1. Add `apps/worker` package (future)
2. Connect to same `REDIS_URL` and `DATABASE_URL`
3. Run BullMQ consumers in separate Docker container
4. Scale workers independently of web app

## Coolify deployment sketch

```yaml
# docker-compose.production.yml (future — not implemented yet)
services:
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    ports:
      - '3000:3000'
    depends_on:
      - postgres
      - redis

  worker:
    build:
      context: .
      dockerfile: apps/worker/Dockerfile
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - redis

  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
```

## What not to change during migration

- Prisma schema and migrations workflow
- Auth.js JWT configuration (update `AUTH_URL` only)
- API route structure (`/api/v1/*`)
- Encryption secrets (or plan token re-encryption)
- R2 key structure (keep same paths in MinIO)

## Rollback plan

Keep Vercel project active during VPS migration. DNS cutover via low TTL:

1. Deploy to VPS, verify with hosts file override
2. Switch DNS A/CNAME record
3. Keep Vercel as fallback for 48 hours

## Monitoring on VPS

Replace Vercel Logs with:

- Pino → stdout → Docker logs or Loki
- Uptime monitoring (Uptime Kuma, Better Stack)
- Future: Sentry for errors

## Cost trigger points

Consider VPS when:

- Vercel serverless costs exceed dedicated VPS
- BullMQ workers need persistent processes
- Recording processing requires long-running jobs
- Data residency requirements mandate self-hosting

Until then, Vercel + Neon + R2 is the recommended production stack.
