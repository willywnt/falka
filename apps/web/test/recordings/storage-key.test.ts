import { describe, expect, it } from 'vitest';

import {
  generateProductImageKey,
  generateRecordingFilename,
  generateStorageKey,
  isOrgStorageKey,
  isPendingStorageKey,
} from '@/modules/storage/utils/storage-key';
import { extractGeneratedFilename } from '@/modules/recordings/utils/media-recorder';

/**
 * Happy Flow #1 — upload ownership gate.
 * `completeRecording` rejects any storage key that is not a final object under
 * the caller's own `{organizationId}/` prefix, so this helper is a security boundary.
 */
describe('isOrgStorageKey', () => {
  it('accepts a key under the organization prefix', () => {
    expect(isOrgStorageKey('org-1/2026/06/rec_20260602_abcd1234.webm', 'org-1')).toBe(true);
    expect(isOrgStorageKey('org-1/img_20260606_abcd1234.webp', 'org-1')).toBe(true);
  });

  it('rejects a key belonging to another organization', () => {
    expect(isOrgStorageKey('org-2/2026/06/rec.webm', 'org-1')).toBe(false);
  });

  it('rejects a pending key (not yet a final org key)', () => {
    expect(isOrgStorageKey('pending/org-1/abcd1234', 'org-1')).toBe(false);
  });

  it('rejects a prefix-injection attempt', () => {
    expect(isOrgStorageKey('org-12/rec.webm', 'org-1')).toBe(false);
  });
});

describe('isPendingStorageKey', () => {
  it('detects pending keys', () => {
    expect(isPendingStorageKey('pending/org-1/abcd')).toBe(true);
    expect(isPendingStorageKey('org-1/2026/06/rec.webm')).toBe(false);
  });
});

describe('extractGeneratedFilename', () => {
  it('returns the last path segment', () => {
    expect(extractGeneratedFilename('org-1/2026/06/rec_x.webm')).toBe('rec_x.webm');
  });

  it('returns the input when there is no slash', () => {
    expect(extractGeneratedFilename('rec_x.webm')).toBe('rec_x.webm');
  });
});

describe('generateStorageKey', () => {
  it('builds {organizationId}/{year}/{month}/{filename} with zero-padded month', () => {
    const date = new Date(Date.UTC(2026, 0, 9)); // January 2026
    expect(generateStorageKey('org-1', 'rec_x.webm', date)).toBe('org-1/2026/01/rec_x.webm');
  });
});

describe('generateProductImageKey', () => {
  it('builds a flat {organizationId}/{filename} key', () => {
    expect(generateProductImageKey('org-1', 'img_x.webp')).toBe('org-1/img_x.webp');
  });
});

describe('generateRecordingFilename', () => {
  it('produces a rec_<YYYYMMDD>_<id>.webm filename', () => {
    const date = new Date(Date.UTC(2026, 5, 2));
    expect(generateRecordingFilename(date)).toMatch(/^rec_20260602_[0-9a-zA-Z]+\.webm$/);
  });
});
