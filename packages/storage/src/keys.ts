/**
 * Object-storage key predicates shared by the web app (upload/delete boundary) and the
 * worker (cleanup + quota accounting). Kept here as the single source of truth so the two
 * runtimes can never diverge — a prior worker-local copy hard-coded a stale `recordings/`
 * prefix and silently stopped decrementing per-org storage usage on cleanup.
 *
 * Key layout (recordings bucket):
 *   recordings: `<organizationId>/<year>/<month>/<filename>`
 *   product images (public bucket): `<organizationId>/<filename>`
 *   in-flight uploads: `pending/...`
 *
 * Accounts that predate organizations keep their keys verbatim — the org backfill set
 * `Organization.id := owner User.id`, so the `<organizationId>/` prefix stays valid.
 */

/**
 * Whether a storage key is a final object owned by `organizationId`. Security boundary for
 * upload completion and deletion, and the worker's quota-decrement gate. The trailing slash
 * blocks org-id prefix injection (e.g. `org-12/...` must not match org `org-1`).
 */
export function isOrgStorageKey(storageKey: string, organizationId: string): boolean {
  return storageKey.startsWith(`${organizationId}/`);
}

/** Whether a storage key is a not-yet-finalized pending upload. */
export function isPendingStorageKey(storageKey: string): boolean {
  return storageKey.startsWith('pending/');
}
