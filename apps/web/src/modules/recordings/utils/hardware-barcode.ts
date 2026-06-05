import { noResiSchema } from '@/modules/recordings/validators/no-resi';

export type HardwareBarcodeScanResult = {
  noResi: string;
};

/**
 * Parse a value from a USB keyboard-wedge 1D barcode scanner. The value is taken
 * verbatim (only trimmed) and must still be a valid resi to auto-fill the field
 * — the wedge feeds the recordings flow, where the resi format is the contract.
 */
export function parseHardwareBarcodeScan(raw: string): HardwareBarcodeScanResult | null {
  const parsed = noResiSchema.safeParse(raw.trim());
  if (!parsed.success) return null;

  return { noResi: parsed.data };
}
