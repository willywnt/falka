# Security Recommendations

> **Production = self-hosted Biznet VPS + Coolify — LIVE at `https://app.trypalka.com` (since 2026-06-28).**
> Postgres 16 + Redis 7 self-hosted in Docker (Coolify-managed), Cloudflare R2 for files; web + worker + a
> one-shot migrate service deploy from a CI-built GHCR image. Vercel + Neon are **retired**. Runbook + field
> notes: [coolify-setup.md](./coolify-setup.md).

## Secrets management

| Secret                          | Storage              | Rotation               |
| ------------------------------- | -------------------- | ---------------------- |
| `AUTH_SECRET`                   | Coolify env (Secret) | Quarterly              |
| `MARKETPLACE_ENCRYPTION_SECRET` | Coolify env (Secret) | On compromise only\*   |
| `R2_SECRET_ACCESS_KEY`          | Coolify env (Secret) | Quarterly              |
| `DATABASE_URL`                  | Coolify env (Secret) | On credential rotation |

\*Rotating marketplace encryption secret invalidates stored tokens — plan a re-connect flow.

Never commit `.env`, `.env.local`, or production credentials to git. `.gitignore` already excludes them.

## Database access

- Restrict Postgres to the Coolify internal Docker network
- Application uses pooled connection with least-privilege DB user
- Separate databases per environment
- Enable Coolify's scheduled Postgres backups (`pg_dump` -> R2)

## Upload validation

Already implemented:

- Server-side MIME type validation (`video/webm`)
- Max file size (500 MB)
- Presigned URL expiry (5 minutes)
- Storage key ownership check (`{env}/{userId}/...`, env = `production`|`dev`; legacy `recordings/{userId}/...` still accepted)
- User storage quota enforcement

## API security

- Auth required on all `/api/v1/*` routes (except health)
- Ownership validation on recordings and marketplace connections
- Zod validation on all inputs
- No decrypted tokens in API responses

## HTTP headers

`apps/web/next.config.ts` (`headers()`) sets on all routes:

- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(self), microphone=(self), geolocation=()`
- `Strict-Transport-Security` (HSTS, preload)
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-site`

`/api/*` routes additionally get `Cache-Control: no-store`.

## CORS

R2 CORS is scoped to known origins only. Do not use `*` in production.

## Logging

- Structured Pino logs — no tokens, passwords, or encrypted secrets logged
- Audit log table for recording/marketplace actions
- Future: Sentry for error tracking with PII scrubbing

## Dependency hygiene

```bash
pnpm audit
```

Run periodically. Keep Next.js, Auth.js, and Prisma updated.

## Production hardening (future)

- Rate limiting on auth and upload endpoints
- WAF via Cloudflare
- CSP headers
- RBAC enforcement beyond route-level auth
