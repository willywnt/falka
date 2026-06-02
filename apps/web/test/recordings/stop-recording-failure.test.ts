import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { classifyStopRecordingFailure } from '@/modules/recordings/utils/stop-recording-failure';

/**
 * Happy Flow #1 — the recovery decisions taken when an upload fails after Stop.
 * This pins the logic that used to live inline in use-recording.ts's ~65-line
 * catch ladder.
 */

const FILLED = new Blob(['recorded-bytes']);

function ctx(blob: Blob | null) {
  return {
    recordingId: 'rec-1',
    noResi: 'RESI123',
    durationSeconds: 12,
    blob,
    mimeType: 'video/webm',
  };
}

describe('classifyStopRecordingFailure', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { onLine: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps a cancelled upload (AbortError) for retry when a blob was captured', () => {
    const action = classifyStopRecordingFailure(
      new DOMException('aborted', 'AbortError'),
      ctx(FILLED),
    );

    expect(action.kind).toBe('recoverable');
    if (action.kind === 'recoverable') {
      expect(action.params.errorCode).toBe('UPLOAD_CANCELLED');
      expect(action.params.failureCode).toBe('UPLOAD_CANCELLED');
      expect(action.params.resetSession).toBe(true);
      expect(action.params.blob).toBe(FILLED);
    }
  });

  it('fails a cancelled upload with no blob', () => {
    const action = classifyStopRecordingFailure(
      new DOMException('aborted', 'AbortError'),
      ctx(null),
    );

    expect(action.kind).toBe('fatal');
    if (action.kind === 'fatal') {
      expect(action.error.message).toBe('Upload cancelled.');
    }
  });

  it('keeps a quota failure for retry when a blob was captured', () => {
    const action = classifyStopRecordingFailure(new Error('Storage quota exceeded'), ctx(FILLED));

    expect(action.kind).toBe('recoverable');
    if (action.kind === 'recoverable') {
      expect(action.params.errorCode).toBe('QUOTA_EXCEEDED');
      expect(action.params.resetSession).toBe(true);
    }
  });

  it('fails a quota error with no blob (code QUOTA_EXCEEDED)', () => {
    const action = classifyStopRecordingFailure(new Error('quota exceeded'), ctx(null));

    expect(action.kind).toBe('fatal');
    if (action.kind === 'fatal') {
      expect(action.error.code).toBe('QUOTA_EXCEEDED');
    }
  });

  it('keeps a recoverable network failure for retry when a blob was captured', () => {
    const action = classifyStopRecordingFailure(new Error('network request failed'), ctx(FILLED));

    expect(action.kind).toBe('recoverable');
    if (action.kind === 'recoverable') {
      expect(action.params.errorCode).toBe('UPLOAD_RECOVERABLE');
      expect(action.params.resetSession).toBeUndefined();
    }
  });

  it('fails an unrecoverable error with no blob', () => {
    const action = classifyStopRecordingFailure(new Error('boom'), ctx(null));

    expect(action.kind).toBe('fatal');
    if (action.kind === 'fatal') {
      expect(action.error.message).toBe('boom');
    }
  });
});
