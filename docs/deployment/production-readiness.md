# Production readiness checklist

> **Production = self-hosted Biznet VPS + Coolify — LIVE at `https://app.trypalka.com` (since 2026-06-28).**
> Postgres 16 + Redis 7 self-hosted in Docker (Coolify-managed), Cloudflare R2 for files; web + worker + a
> one-shot migrate service deploy from a CI-built GHCR image. Vercel + Neon are **retired**. Runbook + field
> notes: [coolify-setup.md](./coolify-setup.md).

Use this checklist before and after every production deployment.

## Deployment

- [ ] `DATABASE_URL` points to the self-hosted Postgres (Coolify), not local Docker
- [ ] `REDIS_URL` points to the self-hosted Redis 7 (Coolify)
- [ ] Worker runs as its own container in the Coolify compose (separate from web)
- [ ] Worker health check configured on `/health` port `3001`
- [ ] Web container/proxy health check configured on `/api/health/live` (dependency-free 200; the deep `/api/health` or `/api/v1/health` snapshot — which probes R2/Redis/DB/worker — is for on-demand readiness/ops, not a high-frequency probe)
- [ ] Prisma migrations apply via the one-shot migrate service in `docker-compose.coolify.yml` (runs `db:migrate:deploy` before web/worker start)
- [ ] `APP_VERSION` or git SHA exposed in health response

## Environment

- [ ] `AUTH_SECRET` ≥ 32 chars, unique per environment
- [ ] `MARKETPLACE_ENCRYPTION_SECRET` ≥ 32 chars
- [ ] `AUTH_URL` / `NEXTAUTH_URL` match production domain (HTTPS)
- [ ] R2 bucket + credentials scoped to production bucket
- [ ] `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` configured
- [ ] `LOG_LEVEL=info` in production
- [ ] `LOG_PRETTY=false` in production

## Security

- [ ] HTTPS enforced (Coolify/Traefik Let's Encrypt + HSTS header)
- [ ] Secure session cookies enabled (`NODE_ENV=production`)
- [ ] Login rate limiting active (Redis required)
- [ ] Upload / recording rate limits active
- [ ] CSP headers do not block webcam / MediaRecorder / R2 uploads
- [ ] Admin ops route `/api/v1/admin/ops` restricted to `ADMIN` role
- [ ] No secrets in client bundle or logs

## Monitoring

- [ ] Sentry receiving frontend + API + worker errors
- [ ] Health endpoint returns dependency status (DB, Redis, R2, worker)
- [ ] Structured JSON logs shipped to log aggregator
- [ ] `x-request-id` present in API responses for support triage
- [ ] BullMQ failed job alerts configured (via logs or Sentry)
- [ ] Redis metrics counters monitored (`metrics:*` keys)

## Operational jobs

- [ ] Worker schedulers enabled (`WORKER_ENABLE_SCHEDULERS=true`)
- [ ] Storage consistency job scheduled (daily 05:00 UTC, dry-run by default)
- [ ] Recording cleanup / upload recovery jobs running
- [ ] Review admin ops report weekly for orphan storage / failed uploads

## Disaster recovery

- [ ] Coolify Postgres backup (`pg_dump` -> R2) retention verified
- [ ] R2 lifecycle + backup strategy documented
- [ ] Redis persistence expectations documented (see disaster-recovery.md)
- [ ] Runbook for worker restart + queue drain tested
