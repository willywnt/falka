# Organization / Team Foundation (backlog big-bet G)

> Status: **shipped on `main` (2026-06-13), 5 commits, all gates green.** Turns the
> strictly-single-user app into a multi-user-per-shop one with roles, invites, RBAC, and an
> audit log. No production deploy yet, so migrations were aggressive (DB reset verified).

## Why

Falka was strictly one user per account (`userId` on every domain row). To let a shop owner bring
in a manager/cashier/packer with bounded permissions — and to light up the long-stubbed Settings
"Tim" + "Riwayat aktivitas" tabs — every piece of shop data had to belong to an **Organization**
the team shares, with role-based access on top.

## Decisions (locked)

- **Full Organization entity** (not lightweight membership): `organizationId` on all 18 domain
  models + backfill.
- **Roles**: `OrgRole = OWNER | ADMIN | STAFF` (new enum; platform `UserRole ADMIN|USER` stays).
- **STAFF blocked from**: reports/profit, money-sensitive actions (sale refund/void, PO cancel,
  product/variant/bundle delete, stock adjust, opname posting, damage write-off), marketplace
  connection management (+ Settings beyond own profile). `orders/pull` stays open.
- **Team authority is hybrid**: ADMIN lists members + mints/revokes STAFF invites; OWNER also
  changes roles, removes members, mints ADMIN invites. OWNER row immutable via UI.
- **Invites are code-based** (no email infra): 8-char `A-Z2-9` code, single-use, 7-day expiry,
  shared via WhatsApp; register with optional `inviteCode`.
- **Backfill trick**: `Organization.id := owner User.id` for existing accounts → backfill is one
  `UPDATE … SET organizationId = userId` per table, and R2 key prefixes + per-org code sequences
  stay valid verbatim.

## Shape (where things live)

- **Schema/migrations** (`packages/db`): `add_organizations` (tables + nullable col + backfill) →
  `enforce_org_scope` (NOT NULL on 16 models — PairingSession + AuditLog stay nullable — + FK +
  `@@unique([organizationId, sku])` and `[organizationId, code]` + storage cols dropped off User).
- **Auth/session**: `resolveOrgContext` (per-request DB re-validation), `withApiRoute` `{ user,
org }` + `minOrgRole`, `requireOrgRole` for pages, register redeem tx in `auth.service`.
- **Scope sweep**: every service takes `organizationId` (+ `actorUserId` for writers writing both);
  ~95 routes pass `org.id`; queue/worker payloads carry `organizationId` + `actorUserId`; code
  sequences wrapped in `retryOnCodeCollision`.
- **Team**: `modules/users` — `team.service`, `org.service`, `utils/invite-code`, `validators/
team`, hooks `use-team`/`use-org`, routes `org` + `org/members[/:id]` + `org/invites[/:id]`.
- **Audit**: `modules/audit` made real (`auditService.log` best-effort post-tx + `list`),
  `GET /api/v1/audit`, write points across sensitive actions + login + team events.
- **UI**: Settings Tim + Riwayat aktivitas tabs (role-gated), org rename, register invite field,
  nav `minRole` gating, STAFF action hiding.
- **Seed**: `staff@falka.local` is a STAFF member of the demo org (RBAC testable out of the box).

## Verification done

`migrate reset` + seed + `db:reset-demo` on a fresh DB; typecheck · lint · build · 301 vitest
tests green at each phase. Unit coverage: invite-code shape, hybrid invite authority +
owner-immutability, all three registration paths, audit best-effort.

## Still manual-QA-pending (run the dev server)

1. Log in `staff@falka.local` / `Staff123!`: no Laporan/admin Settings tabs; direct-nav to a
   report page redirects; a guarded API call (e.g. refund) returns 403.
2. As demo OWNER, create an invite → register a new account with the code → lands in the demo org
   with the invite's role; reusing the code fails; revoke blocks an unused code.
3. Remove a member → their next request 401s → login refused with the access-revoked message.
4. Riwayat aktivitas shows refund/delete/team/login events.

## Follow-up shipped (2026-06-13): configurable RBAC + admin-ops + invite-only

Three commits on `feat/org-foundation` (all gates green: typecheck · lint · 322 vitest · build):

- **Configurable permissions** (`feat(org): per-organization configurable permissions`): an 8-key
  catalog (`modules/users/permissions/`) replaces the hardcoded ADMIN gate. `Organization.permissions`
  (Json, null = defaults = original behavior) holds an ADMIN/STAFF allow-matrix the OWNER edits in
  Settings → "Peran & akses". `withApiRoute` gains `requirePermission` (OWNER bypasses); routes +
  report pages moved off `minOrgRole:'ADMIN'` to it; owner-only routes keep `minOrgRole:'OWNER'`.
  Client gates via `useHasPermission` + nav `permission`.
- **Admin-ops console + plan limits** (`feat(org): admin-ops console + per-org plan limits`):
  `app/(admin)/admin` (gated by `requirePlatformAdmin` = `UserRole.ADMIN`) provisions orgs + owner
  accounts (typed password) and edits `plan` / `memberLimit` / storage quota; routes under
  `/api/v1/admin/organizations`. `assertMemberCapacity` enforces the member cap at invite time.
- **Invite-only registration** (`feat(auth): invite-only registration`): `registerUser` requires a
  code (no own-org branch); landing/login self-signup CTAs removed.

### RBAC refinements (same day, commit `feat(org): view-tier permissions…`)

- **View-tier permission keys**: catalog grew to 10. `purchasing.view` + `marketplace.view` join
  `reports.view` as VIEW keys that hide a whole section (nav menu + pages + create entries +
  deep-link "Buat PO" buttons), not just a button. Their GET routes + pages are now
  `requirePermission`-gated. New default: STAFF gets NOTHING (all keys off) = pure daily-ops; the
  earlier "STAFF sees menus, just can't act" is gone.
- **Store rename is OWNER-only** (was ADMIN): `PATCH /api/v1/org` → `minOrgRole:'OWNER'`, inline
  editor shows only for OWNER.
- **Platform admin-ops is confined to `/admin`**: login routes a `UserRole.ADMIN` there, and the
  `authorized` callback + `(dashboard)` layout bounce them out of the shop dashboard entirely. The
  seed `admin@falka.local` is therefore a pure operator (its own org is unused).
- **STAFF can see Penyimpanan**: the read-only storage/quota Settings tab is visible to all roles.

**Still manual-QA-pending**: as OWNER edit the matrix → a STAFF gains/loses a menu+action (API
200↔403 + nav/button shows/hides); turn off `purchasing.view`/`marketplace.view` for ADMIN → those
menus vanish; as platform admin → land on `/admin`, `/dashboard` bounces back to `/admin`; create an
org + owner, set memberLimit and hit the cap; `/register` without a code refused.

## Not built (future)

- Multi-org per user (drop the `@@unique([userId])` on membership), ownership transfer, a second
  OWNER. Email-based invites. Per-resource finer permissions beyond the catalog. Real billing
  integration (the `plan` field is a labeled placeholder). Forced password reset on first login
  for admin-provisioned accounts (the initial password is shared manually in plaintext).
