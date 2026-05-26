# Deployment Guide

Production stack:

| Service        | Provider               |
| -------------- | ---------------------- |
| Hosting        | Vercel                 |
| Database       | Neon PostgreSQL        |
| Object storage | Cloudflare R2          |
| Auth           | Auth.js (Credentials)  |
| Redis (future) | Upstash or self-hosted |

## Quick checklist

- [ ] Neon production database created
- [ ] Vercel project linked (`apps/web` as root directory)
- [ ] All env vars set in Vercel (see `.env.production.example`)
- [ ] `pnpm db:migrate:deploy` run against production DB
- [ ] R2 production bucket + CORS configured
- [ ] Custom domain + SSL on Vercel
- [ ] `AUTH_SECRET` generated with `openssl rand -base64 32`

## Git branch strategy

| Branch      | Deployment            | Database                |
| ----------- | --------------------- | ----------------------- |
| `main`      | Vercel **Production** | Neon production         |
| `develop`   | Vercel **Preview**    | Neon dev/preview branch |
| `feature/*` | Vercel **Preview**    | Neon dev/preview branch |

## Deployment flow

```
feature/* → PR → develop (preview) → PR → main (production)
```

### First production deploy

1. Create Neon project and copy pooled connection string
2. Import repo in Vercel → set **Root Directory** to `apps/web`
3. Configure environment variables (Production scope)
4. Run migrations against production:

```bash
DATABASE_URL="postgresql://..." pnpm db:migrate:deploy
```

5. Deploy `main` branch (or trigger redeploy after env setup)
6. Apply R2 production CORS (see [r2.md](./r2.md))
7. Verify `/api/v1/health`, login, recording upload

### Subsequent deploys

Vercel auto-deploys on push. Run `db:migrate:deploy` when schema changes — before or immediately after deploy.

**Never use `prisma db push` in production.**

## Vercel settings

| Setting         | Value                                               |
| --------------- | --------------------------------------------------- |
| Root Directory  | `apps/web`                                          |
| Framework       | Next.js                                             |
| Install Command | `cd ../.. && pnpm install`                          |
| Build Command   | `cd ../.. && pnpm turbo build --filter=@olshop/web` |
| Node.js Version | 20.x                                                |

These are configured in `apps/web/vercel.json`.

### Include monorepo files

In Vercel project settings, ensure **Root Directory** is `apps/web` and **Include source files outside of the Root Directory** is enabled (default for Turborepo).

## Prisma in production

```bash
# Apply pending migrations (CI, local, or Neon SQL editor alternative)
pnpm db:migrate:deploy

# Generate client (runs automatically via @olshop/db postinstall)
pnpm db:generate
```

Migration files live in `packages/db/prisma/migrations/`. Commit all migration SQL to git.

## Logging

Production logs use **Pino** (structured JSON). View in Vercel → Logs.

Set `LOG_LEVEL=info` in production, `debug` in preview if needed.

Future: pipe Pino output to Sentry, Datadog, or Axiom.

## Related guides

- [Neon PostgreSQL](./neon.md)
- [Cloudflare R2](./r2.md)
- [Auth.js production](./auth.md)
- [Security](./security.md)
- [VPS migration](./vps-migration.md)
