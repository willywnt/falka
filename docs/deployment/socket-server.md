# Realtime (Socket.IO) deployment

> **Production = self-hosted Biznet VPS + Coolify — LIVE at `https://app.trypalka.com` (since 2026-06-28).**
> Postgres 16 + Redis 7 self-hosted in Docker (Coolify-managed), Cloudflare R2 for files; web + worker + a
> one-shot migrate service deploy from a CI-built GHCR image. Vercel + Neon are **retired**. Runbook + field
> notes: [coolify-setup.md](./coolify-setup.md).

## Root cause of the historical production "xhr poll error" (Vercel era — now resolved)

The pairing realtime layer is a Socket.IO server attached to a **custom Node
server** ([`apps/web/server.ts`](../../apps/web/server.ts) →
`initPairingSocketServer`). That custom server is the only place the
`/api/socket` Engine.IO endpoint exists, and it is started only by the
`dev`/`start` scripts (`tsx server.ts`).

On the retired Vercel deploy the app was built with `framework: nextjs` (`next build`,
output `.next`). **Vercel never ran `server.ts`** — it served the `.next`
output as serverless functions. There was no App Router handler at
`app/api/socket`, so in production nothing answered the client's initial
long-poll handshake and the browser reported `xhr poll error`. (`apps/web/vercel.json`
has since been deleted.)

Forcing `transports: ['websocket']` was **not** a fix either: a serverless
function cannot hold the persistent connection Engine.IO needs, and the
heartbeat sweepers in `register-handlers.ts` cannot stay alive.

This was an architecture/deploy mismatch, not a CORS/path/transport bug — the
path (`/api/socket`), CORS, and transports were all correct.

## Current setup: same-origin on the VPS (and the optional future split)

On the single-host VPS the **web container runs the custom Node server**
(`apps/web/server.ts`, via `pnpm --filter @palka/web start`), so the Socket.IO
server runs in production at the **same origin** as the app. Pairing works in
prod today with **`NEXT_PUBLIC_SOCKET_URL` UNSET** — the client falls back to the
same origin (`socket-client.service.ts`), and the app CSP already permits
`https:` + `wss:` in `connect-src`.

Splitting the socket onto its own always-on host remains **optional**, for future
horizontal scaling:

1. Deploy the custom Node server (`server.ts` + `socket-server/**`) to an
   always-on Node host (Railway, Render, Fly.io, or a VM). It must be reachable
   over HTTPS/WSS.
2. Point the browser at it by **setting `NEXT_PUBLIC_SOCKET_URL`**
   (already wired in `socket-client.service.ts`). When unset, the client falls
   back to the same origin, so **the VPS same-origin path and local dev are unchanged**.
3. The socket host needs the same `AUTH_SECRET`, `DATABASE_URL`, and
   `REDIS_URL` as the app (it validates the auth JWT and reads/writes pairing
   sessions).
4. CORS on the socket server already allows `NEXT_PUBLIC_APP_URL` /
   `NEXT_PUBLIC_PAIRING_URL` / `AUTH_URL` (see `socket-server/io-server.ts`).
   Set `NEXT_PUBLIC_APP_URL` to the app's public URL so the browser origin is
   allowed.
5. The app CSP already permits `https:` + `wss:` in `connect-src`.

## Auth across origins — token-in-handshake (chosen)

The socket originally authenticated by reading the **next-auth session cookie**
(`resolve-auth-token.ts` → `getToken`). The browser only sends that cookie to the
socket host if the cookie is in scope there. With the app on `*.vercel.app` and the
socket on `*.railway.app` (different registrable domains, and `.vercel.app` is on the
public-suffix list), **the cookie is not sent and cookie-based socket auth fails.**

We chose **token-in-handshake** so the realtime layer never depends on a cross-origin
cookie (no `AUTH_COOKIE_DOMAIN`, no shared parent domain required):

1. The browser fetches a **short-lived token** from the app:
   `GET /api/v1/scanner-pairing/socket-token` (`createScannerSocketToken`). This call
   is same-origin to the app, so the session cookie IS sent and the user is
   authenticated. The token is a next-auth JWE carrying `{ id }`, signed with
   `AUTH_SECRET` under a dedicated salt (`SOCKET_AUTH_TOKEN_SALT`), TTL
   `SOCKET_AUTH_TOKEN_TTL_SECONDS` (see `scanner-pairing/config.ts`).
2. The client passes it in the Socket.IO handshake `auth` payload. The provider is a
   function, so it is re-invoked on every (re)connect → always a fresh token
   (`socket-client.service.ts`, enabled only when `NEXT_PUBLIC_SOCKET_URL` is set).
3. The socket host validates it with `verifyScannerSocketToken`
   (`decode` with the same secret + salt; jose enforces `exp`) in the connection
   middleware (`register-handlers.ts`). When no handshake token is present it falls
   back to the cookie, so **same-origin local dev is unchanged**.

The socket host therefore only needs the same **`AUTH_SECRET`** (plus `DATABASE_URL`
and `REDIS_URL`); the cookie domain is irrelevant.
