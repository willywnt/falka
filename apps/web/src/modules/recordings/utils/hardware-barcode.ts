import { noResiSchema, normalizeBarcodeValue } from '@/modules/recordings/validators/no-resi';

export type HardwareBarcodeScanResult = {
  noResi: string;
};

/** Parse and validate a value from a USB keyboard-wedge 1D barcode scanner. */
export function parseHardwareBarcodeScan(raw: string): HardwareBarcodeScanResult | null {
  const normalized = normalizeBarcodeValue(raw);
  const parsed = noResiSchema.safeParse(normalized);
  if (!parsed.success) return null;

  return { noResi: parsed.data };
}
