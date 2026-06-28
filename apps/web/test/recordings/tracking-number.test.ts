import { describe, expect, it } from 'vitest';

import { trackingNumberSchema } from '@/modules/recordings/validators/tracking-number';

/**
 * Happy Flow #1 — manual recording input gate.
 * The resi/tracking number is the first guard before a recording can start.
 */
describe('trackingNumberSchema', () => {
  it('accepts a typical alphanumeric tracking number', () => {
    const result = trackingNumberSchema.safeParse('JNE0012345678');
    expect(result.success).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(trackingNumberSchema.safeParse('').success).toBe(false);
  });

  it('rejects values shorter than 3 characters', () => {
    expect(trackingNumberSchema.safeParse('12').success).toBe(false);
    expect(trackingNumberSchema.safeParse('123').success).toBe(true);
  });

  it('rejects values longer than 64 characters', () => {
    expect(trackingNumberSchema.safeParse('A'.repeat(65)).success).toBe(false);
    expect(trackingNumberSchema.safeParse('A'.repeat(64)).success).toBe(true);
  });

  it('allows letters, numbers, dashes and underscores only', () => {
    expect(trackingNumberSchema.safeParse('ABC-123_456').success).toBe(true);
    expect(trackingNumberSchema.safeParse('has space').success).toBe(false);
    expect(trackingNumberSchema.safeParse('has/slash').success).toBe(false);
    expect(trackingNumberSchema.safeParse('emoji😀123').success).toBe(false);
  });

  it('trims surrounding whitespace before validating', () => {
    const result = trackingNumberSchema.safeParse('  ABC123  ');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('ABC123');
    }
  });
});
