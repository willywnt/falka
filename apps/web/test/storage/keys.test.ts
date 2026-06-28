import { describe, expect, it } from 'vitest';

import { isOrgStorageKey, isPendingStorageKey } from '@palka/storage';

/**
 * Regression guard for the shared storage-key predicates that BOTH the web app and the
 * BullMQ worker import. A worker-local copy used to hard-code a stale `recordings/<orgId>/`
 * prefix that never matched the real `<orgId>/<year>/<month>/...` key layout, so the cleanup
 * job silently stopped decrementing per-org `storageUsedBytes` on hard-delete (quota drift).
 * These cases pin the contract the worker now relies on via @palka/storage.
 */
describe('@palka/storage isOrgStorageKey', () => {
  it('matches the real recording key layout `<orgId>/<year>/<month>/<file>`', () => {
    expect(isOrgStorageKey('org-1/2026/06/rec_20260602_abcd1234.webm', 'org-1')).toBe(true);
  });

  it('matches the flat product-image key layout `<orgId>/<file>`', () => {
    expect(isOrgStorageKey('org-1/img_20260606_abcd1234.webp', 'org-1')).toBe(true);
  });

  it('rejects the legacy `recordings/<orgId>/...` prefix that no longer exists', () => {
    expect(isOrgStorageKey('recordings/org-1/2026/06/rec.webm', 'org-1')).toBe(false);
  });

  it('rejects another org and a prefix-injection attempt', () => {
    expect(isOrgStorageKey('org-2/2026/06/rec.webm', 'org-1')).toBe(false);
    expect(isOrgStorageKey('org-12/rec.webm', 'org-1')).toBe(false);
  });
});

describe('@palka/storage isPendingStorageKey', () => {
  it('detects in-flight pending uploads only', () => {
    expect(isPendingStorageKey('pending/org-1/abcd')).toBe(true);
    expect(isPendingStorageKey('org-1/2026/06/rec.webm')).toBe(false);
  });
});
