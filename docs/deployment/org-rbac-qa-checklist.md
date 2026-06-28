# Org / RBAC go-live QA checklist

The Organization/RBAC foundation ships with green typecheck/lint/build + unit tests, but the
authorization boundary has **never been exercised against a running server**. Run this once
before relying on multi-user/RBAC in production (dev server is fine for everything except the
deploy-specific rows). Check each box with evidence (a screenshot or the response body/status).

> The automated service-layer half of the cross-tenant probe lives in
> `apps/web/test/org/cross-tenant-isolation.test.ts`; section 7 below is its runtime counterpart.

## Prep

```bash
pnpm --filter @palka/db db:seed     # admin@palka.local/Admin123!, demo@palka.local/Demo123!, staff@palka.local/Staff123!
pnpm dev                            # http://localhost:3000
```

Seed accounts: `demo@palka.local` = OWNER of the demo org · `staff@palka.local` = STAFF in it ·
`admin@palka.local` = platform admin (confined to `/admin`).

## 1. STAFF is daily-ops only (default permissions = all off)

- [ ] Sign in as `staff@palka.local`. Nav shows Kasir/Pesanan/Inventaris/Opname/Katalog/Rekam/Retur
      only — **no Laporan, no Purchasing, no Marketplace** menus.
- [ ] Deep-link to a gated page (`/dashboard/reports/profit`, `/dashboard/purchasing`,
      `/marketplace`) → redirected away, not rendered.
- [ ] A guarded mutation returns 403, e.g. attempt a POS refund / a `catalog.delete` / a PO cancel
      (API responds 403, button hidden in UI).
- [ ] Settings: STAFF sees **Penyimpanan** (read-only quota) but not Tim / Riwayat / Peran & akses.

## 2. OWNER edits the permission matrix → STAFF gains/loses access live

- [ ] As `demo@palka.local` (OWNER), Settings → **Peran & akses**: turn ON one ACTION key for STAFF
      (e.g. `sales.refund`).
- [ ] Re-login as STAFF (or refresh): the refund button now shows AND the refund API returns 200.
- [ ] Turn the key back OFF → button hides AND the API returns 403 again (200↔403 toggles).
- [ ] Turn OFF a VIEW key for **ADMIN** (`purchasing.view` / `marketplace.view`) → that whole menu + its pages + deep-link buttons vanish for an ADMIN member.

## 3. Invites (mint / redeem / reuse / revoke / cap)

- [ ] As OWNER (or an ADMIN with `team.manage`), Settings → Tim: mint a STAFF invite code.
- [ ] In an incognito window, `/register` with that code → lands in the demo org with the STAFF role.
- [ ] Reuse the same code → refused (single-use).
- [ ] Mint another, then **revoke** it before use → registering with it is refused.
- [ ] Only OWNER can mint an **ADMIN** invite; an ADMIN cannot.
- [ ] Set the org `memberLimit` low (via `/admin`) and confirm minting past it is refused
      (members + pending invites ≥ limit).

## 4. Member removal → access revoked

- [ ] As OWNER, remove a member. Their next API request returns **401**, and a fresh login is
      refused with the access-revoked message (no active membership).
- [ ] The OWNER row itself cannot be removed or role-changed from the UI.

## 5. Platform admin is confined to /admin

- [ ] Sign in as `admin@palka.local` → lands on `/admin` (admin-ops chrome), not the shop dashboard.
- [ ] Manually navigate to `/dashboard` → bounced back to `/admin`.
- [ ] In `/admin`: provision a NEW org + its OWNER (typed initial password), and edit an org's
      `plan` / `memberLimit` / storage quota.

## 6. Registration is invite-only

- [ ] `/register` without a code → refused (no own-org self-signup path).
- [ ] Landing/login pages show no self-signup CTA.

## 7. Cross-tenant isolation — THE critical probe

Create a SECOND org so there is something to leak to (use `/admin` to provision `org-B` + its OWNER,
or sign up a second account via an `org-B` invite). Then, signed in as an `org-A` member, try to
touch `org-B`'s resources **by id** — every one must 404/403, never return org-B data:

- [ ] `GET /api/v1/recordings/<org-B recording id>` → 404/validation error, no payload.
- [ ] `GET /api/v1/sales/<org-B sale id>` (and `/orders/<id>`, `/products/<id>`, `/purchase-orders/<id>`,
      `/returns/<id>`) → 404, no payload.
- [ ] A mutation by org-B id (e.g. delete an org-B product, refund an org-B sale, cancel an org-B PO)
      → 403/404, and org-B's data is unchanged afterward.
- [ ] A presigned-upload / recording-complete with an `org-B/...` storage key as an `org-A` caller
      → rejected (invalid storage key for this organization).

## 8. Audit log

- [ ] As OWNER, Settings → **Riwayat aktivitas** lists recent sensitive events: a refund, a delete,
      a team change (invite/remove/role), and a **login** (credentials path).
- [ ] (Known gap) a pairing-QR sign-in does NOT yet write a login audit row — credentials only.

## Deploy-only rows (run on the real VPS, after `docs/deployment/vps-setup.md`)

- [ ] The stack boots: `docker compose ... ps` shows web/worker **healthy**, `migrate` Exited(0).
- [ ] `db:bootstrap-admin` mints the first platform admin; `/admin` login works; provision the first
      real org + OWNER.
- [ ] argon2 loads on `node:20-slim` (login succeeds — it is the native dep most likely to break).
- [ ] The Socket.IO pairing handshake survives Caddy's TLS reverse proxy (scan → countdown → record).
- [ ] A real phone upload (recording + variant photo) round-trips through R2 (private recordings
      bucket stays private; public products bucket is readable).
