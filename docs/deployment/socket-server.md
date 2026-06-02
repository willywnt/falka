# Realtime (Socket.IO) deployment

## Root cause of the production "xhr poll error"

The pairing realtime layer is a Socket.IO server attached to a **custom Node
server** ([`apps/web/server.ts`](../../apps/web/server.ts) →
`initPairingSocketServer`). That custom server is the only place the
`/api/socket` Engine.IO endpoint exists, and it is started only by the
`dev`/`start` scripts (`tsx server.ts`).

`apps/web/vercel.json` deploys the app with `framework: nextjs` (`next build`,
output `.next`). **Vercel never runs `server.ts`** — it serves the `.next`
output as serverless functions. There is no App Router handler at
`app/api/socket`, so in production nothing answers the client's initial
long-poll handshake and the browser reports `xhr poll error`.

Forcing `transports: ['websocket']` is **not** a fix either: a serverless
function cannot hold the persistent connection Engine.IO needs, and the
heartbeat sweepers in `register-handlers.ts` cannot stay alive.

This is an architecture/deploy mismatch, not a CORS/path/transport bug — the
path (`/api/socket`), CORS, and transports are all correct.

## The fix: run the socket server as a separate always-on host

1. Deploy the custom Node server (`server.ts` + `socket-server/**`) to an
   always-on Node host (Railway, Render, Fly.io, or a VM). It must be reachable
   over HTTPS/WSS.
2. Point the browser at it with the **`NEXT_PUBLIC_SOCKET_URL`** env var
   (already wired in `socket-client.service.ts`). When unset, the client falls
   back to the same origin, so **local dev is unchanged**.
3. The socket host needs the same `AUTH_SECRET`, `DATABASE_URL`, and
   `REDIS_URL` as the app (it validates the auth JWT and reads/writes pairing
   sessions).
4. CORS on the socket server already allows `NEXT_PUBLIC_APP_URL` /
   `NEXT_PUBLIC_PAIRING_URL` / `AUTH_URL` (see `socket-server/io-server.ts`).
   Set `NEXT_PUBLIC_APP_URL` to the app's public URL so the browser origin is
   allowed.
5. The app CSP already permits `https:` + `wss:` in `connect-src`.

## ⚠️ Auth caveat — cross-origin session cookie (needs a decision)

The socket authenticates the connection by reading the **next-auth session
cookie** (`resolve-auth-token.ts` → `getToken`). The browser only sends that
cookie to the socket host if the cookie is in scope there. With the app on
`*.vercel.app` and the socket on `*.railway.app` (different registrable
domains, and `.vercel.app` is on the public-suffix list), **the cookie is not
sent and socket auth fails.**

Two viable options — both touch sensitive config, so confirm before we proceed:

- **A. Shared parent domain (recommended).** Put both behind one custom domain:
  app at `app.example.com`, socket at `socket.example.com`. Configure the
  Auth.js session cookie with `domain: '.example.com'` so it is sent to both
  subdomains (same-site, so `SameSite=Lax` still works). This is an **Auth.js
  config change** (in the sensitive list).
- **B. Token-in-handshake.** Stop relying on the cookie; pass the session token
  through the Socket.IO `auth` handshake payload and validate it server-side.
  Avoids the cookie/domain problem but changes the socket auth mechanism.

Until one of these is in place, `NEXT_PUBLIC_SOCKET_URL` makes the client reach
the socket host, but authenticated connections will only succeed when the
cookie is actually delivered (e.g. option A).
