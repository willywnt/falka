# Olshop Monorepo

Production-ready Turborepo foundation for a browser-based operational recording and marketplace integration SaaS platform.

## Stack

| Layer | Technology |
| --- | --- |
| Monorepo | Turborepo + pnpm workspaces |
| App | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Prisma + PostgreSQL |
| State | Zustand (UI) + TanStack Query (server) |
| Validation | Zod |
| Tooling | ESLint, Prettier, Husky, lint-staged |

## Structure

```
apps/
  web/                  # Next.js fullstack application
packages/
  ui/                   # Shared React components
  db/                   # Prisma schema + client
  types/                # Domain TypeScript types
  utils/                # Pure utility functions
  config/               # Env validation, constants, limits
  eslint-config/        # Shared ESLint config
  typescript-config/    # Shared TypeScript config
```

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9 (via Corepack)
- **PostgreSQL** — one of:
  - [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/) (recommended), or
  - Local PostgreSQL 17: `winget install -e --id PostgreSQL.PostgreSQL.17`

## Installation

```bash
# Enable Corepack and activate pnpm
corepack enable
corepack prepare pnpm@9.15.9 --activate

# Install dependencies
pnpm install

# Copy environment variables (required for Prisma CLI)
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local

# Start PostgreSQL and set up the database (auto-detects Docker or local install)
pnpm db:setup
```

If `db:setup` cannot start a database automatically, install PostgreSQL and update `DATABASE_URL` in `.env`, then run:

```bash
pnpm db:migrate:dev
pnpm db:seed
```

## Development

```bash
# Start all packages in dev mode (Next.js + package watchers)
pnpm dev

# Open http://localhost:3000
```

The web app runs at `http://localhost:3000`. API health check: `GET /api/v1/health`.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start development servers |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm format` | Format with Prettier |
| `pnpm db:up` | Start PostgreSQL via Docker Compose |
| `pnpm db:down` | Stop PostgreSQL container |
| `pnpm db:wait` | Wait until PostgreSQL is reachable |
| `pnpm db:setup` | Start DB + migrate + seed (one command) |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push schema to database (prototyping) |
| `pnpm db:migrate:dev` | Create/apply dev migrations |
| `pnpm db:migrate:deploy` | Apply migrations in production |
| `pnpm db:migrate:reset` | Reset database and re-run migrations |
| `pnpm db:seed` | Seed sample data |
| `pnpm db:studio` | Open Prisma Studio |

## Architecture

### Modules (not features)

Business logic lives in `apps/web/src/modules/`:

```
modules/
  auth/         components, services, validators, hooks, actions, types
  recording/
  dashboard/
  marketplace/
  inventory/
  audit/
```

### API Routes

Versioned REST API under `/api/v1/`:

```
/api/v1/health
/api/v1/recordings   (future)
/api/v1/inventory    (future)
/api/v1/marketplace  (future)
```

### Shared Packages

| Package | Responsibility |
| --- | --- |
| `@olshop/types` | Domain types only — no Prisma coupling |
| `@olshop/utils` | Pure functions (crypto, date, logger, storage) |
| `@olshop/config` | Zod env validation, constants, limits |
| `@olshop/db` | Prisma schema, client singleton, DB utilities |
| `@olshop/ui` | Reusable UI components |

### State Management

- **Zustand** — UI/runtime state (`src/store/`)
- **TanStack Query** — Server state (`src/hooks/`)

### Future-Ready

Architecture supports adding:

- Marketplace integrations (Shopee/Tokopedia)
- Background jobs and queue workers
- AI processing pipelines
- Storage quota enforcement
- Subscriptions and billing
- RBAC and audit logging

## Environment Variables

See [`.env.example`](.env.example) for all required variables.

**Required for server:**

- `DATABASE_URL`
- `AUTH_SECRET` (min 32 characters)
- `R2_*` credentials

**Required for client:**

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_APP_NAME`

## Coding Standards

| Context | Convention |
| --- | --- |
| Database columns | snake_case |
| TypeScript | camelCase |
| React components | PascalCase |
| API paths | `/api/v1/{resource}` |

## License

Private — all rights reserved.
