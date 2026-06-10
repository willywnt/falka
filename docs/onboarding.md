# Onboarding

Get Falka running locally in under 10 minutes.

## Prerequisites

| Tool           | Version | Notes                                                        |
| -------------- | ------- | ------------------------------------------------------------ |
| Node.js        | >= 20   | `node -v`                                                    |
| pnpm           | >= 9    | `corepack enable && corepack prepare pnpm@9.15.9 --activate` |
| Docker Desktop | Latest  | PostgreSQL + Redis via Compose                               |
| Git            | Latest  | Clone the repository                                         |

Optional: [Make](https://gnuwin32.sourceforge.net/packages/make.htm) for `make setup` shortcuts on Windows.

## First-time setup

```bash
# 1. Clone and install
git clone <repo-url> falka
cd falka
pnpm install

# 2. Environment files
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local

# Copy server vars from .env into apps/web/.env.local (Next.js reads both,
# but .env.local takes precedence — keep them in sync during local dev).
# At minimum sync: DATABASE_URL, AUTH_SECRET, R2_*, MARKETPLACE_ENCRYPTION_SECRET

# 3. Start infrastructure + database
pnpm setup
# Equivalent to: pnpm infra:up && pnpm infra:wait && pnpm db:setup

# 4. Start development
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Default seed accounts (after `pnpm db:seed`):

| Email               | Password    |
| ------------------- | ----------- |
| `admin@falka.local` | `Admin123!` |
| `demo@falka.local`  | `Demo123!`  |

## Daily workflow

```bash
pnpm infra:up      # Start PostgreSQL + Redis (if not running)
pnpm dev           # Start Next.js + package watchers
pnpm infra:down    # Stop containers when done
```

## Infrastructure commands

| Command                     | Description                              |
| --------------------------- | ---------------------------------------- |
| `pnpm infra:up`             | Start PostgreSQL + Redis                 |
| `pnpm infra:down`           | Stop containers (keeps data)             |
| `pnpm infra:wait`           | Wait until healthchecks pass             |
| `pnpm infra:status`         | Show container status                    |
| `pnpm infra:reset -- --yes` | Destroy volumes, recreate, migrate, seed |

## Database commands

| Command                  | Description                        |
| ------------------------ | ---------------------------------- |
| `pnpm db:migrate:dev`    | Create/apply dev migrations        |
| `pnpm db:migrate:deploy` | Apply migrations (production-safe) |
| `pnpm db:seed`           | Seed sample data                   |
| `pnpm db:studio`         | Open Prisma Studio                 |
| `pnpm db:generate`       | Regenerate Prisma client           |

## Cloudflare R2 (local uploads)

1. Create an R2 bucket in Cloudflare dashboard
2. Create API token with Object Read & Write
3. Set `R2_*` variables in `.env` and `apps/web/.env.local`
4. Apply CORS for browser uploads:

```bash
node scripts/apply-r2-cors.mjs
```

See [deployment/r2.md](./deployment/r2.md) for production setup.

## Troubleshooting

**Port 5432 already in use**

- Stop local PostgreSQL service, or change `POSTGRES_PORT` in `.env`

**Next.js 500 / stale cache**

```bash
pnpm --filter @falka/web clean
pnpm dev
```

**Invalid server environment variables**

- Ensure `AUTH_SECRET` and `MARKETPLACE_ENCRYPTION_SECRET` are at least 32 characters
- Sync root `.env` with `apps/web/.env.local`

## Next steps

- [Environment variables](./environment.md)
- [Deployment guide](./deployment/README.md)
- [VPS migration strategy](./deployment/vps-migration.md)
