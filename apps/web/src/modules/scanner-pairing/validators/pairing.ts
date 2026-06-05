import { z } from 'zod';

export const pairingIdSchema = z.string().uuid('Invalid pairing session id');

/**
 * A code from a camera/QR scan — a shipping resi OR a product SKU/barcode. Kept
 * deliberately lenient (verbatim, just trimmed) so a scan is never dropped for
 * casing or characters; the resi FORMAT is only enforced when a recording is
 * actually created (`noResiSchema`), and a product code is matched as-is.
 */
export const scannedCodeSchema = z
  .string()
  .trim()
  .min(1, 'Empty scan')
  .max(128, 'Scanned code is too long');

/** Secret from QR (`code` query param); matches server-generated pairingCode. */
export const pairingCodeSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim() : value),
  z.string().min(16, 'Invalid pairing code').max(64, 'Invalid pairing code'),
);

/** Which station a new pairing drives; defaults to recordings for back-compat. */
export const pairingPurposeSchema = z.enum(['RECORDING', 'POS']);

export const createPairingSchema = z.object({
  purpose: pairingPurposeSchema.default('RECORDING'),
});

export const connectPairingSchema = z.object({
  pairingId: pairingIdSchema,
  deviceInfo: z
    .object({
      userAgent: z.string().max(512).optional(),
      platform: z.string().max(128).optional(),
      language: z.string().max(32).optional(),
      screen: z.string().max(64).optional(),
    })
    .optional(),
});

export const submitBarcodeSchema = z.object({
  pairingId: pairingIdSchema,
  barcode: scannedCodeSchema,
});

export const joinPairingSocketSchema = z.object({
  pairingId: pairingIdSchema,
  role: z.enum(['desktop', 'mobile']),
});

export const stationRecordingPhaseSchema = z.enum(['idle', 'countdown', 'recording', 'uploading']);

export const reportStationStateSchema = z.object({
  pairingId: pairingIdSchema,
  phase: stationRecordingPhaseSchema,
  barcode: scannedCodeSchema.optional(),
});

export type CreatePairingInput = z.infer<typeof createPairingSchema>;
export type ConnectPairingInput = z.infer<typeof connectPairingSchema>;
export type SubmitBarcodeInput = z.infer<typeof submitBarcodeSchema>;
export type JoinPairingSocketInput = z.infer<typeof joinPairingSocketSchema>;
