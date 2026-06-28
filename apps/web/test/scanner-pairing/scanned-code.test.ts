import { describe, expect, it } from 'vitest';

import { scannedCodeSchema } from '@/modules/scanner-pairing/validators/pairing';

/**
 * The camera-scan gate is intentionally lenient — a SKU/barcode (or resi) is
 * relayed verbatim so it matches its stored value exactly. The strict resi
 * format is only enforced when a recording is created (`trackingNumberSchema`).
 */
describe('scannedCodeSchema', () => {
  it('accepts a product SKU verbatim (case and dashes preserved)', () => {
    const result = scannedCodeSchema.safeParse('Black-S');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('Black-S');
  });

  it('accepts codes with spaces or slashes that the resi gate rejects', () => {
    expect(scannedCodeSchema.safeParse('Black / S').success).toBe(true);
    expect(scannedCodeSchema.safeParse('SKU.123').success).toBe(true);
  });

  it('trims surrounding whitespace', () => {
    const result = scannedCodeSchema.safeParse('  ABC123  ');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('ABC123');
  });

  it('rejects an empty scan', () => {
    expect(scannedCodeSchema.safeParse('   ').success).toBe(false);
  });

  it('rejects an absurdly long payload', () => {
    expect(scannedCodeSchema.safeParse('A'.repeat(129)).success).toBe(false);
  });
});
