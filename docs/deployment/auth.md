# Auth.js Production Configuration

Falka uses **Auth.js v5** with JWT sessions and a Credentials provider.

## Required environment variables

```bash
AUTH_SECRET=          # openssl rand -base64 32
AUTH_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
```

`AUTH_URL` and `NEXTAUTH_URL` must match your production domain exactly (including `https`).

## Generate AUTH_SECRET

```bash
openssl rand -base64 32
```

Minimum 32 characters. Store in Vercel as a **Sensitive** environment variable. Rotate periodically — rotation invalidates existing sessions.

## Secure cookies

Auth.js automatically sets secure cookies when:

- `NODE_ENV=production`
- `AUTH_URL` uses `https://`

Configuration in `apps/web/src/auth.config.ts`:

- JWT session strategy (30-day max age)
- `trustHost: true` (required on Vercel)

No additional cookie config is needed for standard Vercel deployment.

## Production checklist

- [ ] `AUTH_SECRET` is unique per environment (prod ≠ preview)
- [ ] `AUTH_URL` matches Vercel custom domain
- [ ] HTTPS enforced (Vercel default)
- [ ] Credentials provider rate limiting (future — add middleware)
- [ ] Passwords hashed with Argon2 (already implemented)

## Preview deployments

For Vercel preview URLs (`*.vercel.app`):

```
AUTH_URL=https://your-project.vercel.app
NEXTAUTH_URL=https://your-project.vercel.app
```

Or use Vercel's automatic `VERCEL_URL` in a future enhancement.

## Session security

- JWT stored in HTTP-only cookie
- No sensitive data in JWT payload (id, email, role only)
- Middleware protects `/dashboard`, `/recordings`, `/settings` routes

## Future OAuth providers

When adding Shopee/Tokopedia OAuth for marketplace, extend `auth.ts` providers array. Keep marketplace tokens separate (encrypted in `MarketplaceConnection` table) — do not store them in Auth.js sessions.

## VPS / self-hosted notes

When migrating off Vercel:

- Set `AUTH_URL` to your domain
- Ensure reverse proxy forwards `X-Forwarded-Proto: https`
- Keep `trustHost: true` or set explicit `AUTH_TRUST_HOST`
