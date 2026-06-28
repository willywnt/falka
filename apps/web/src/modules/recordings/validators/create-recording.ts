import { MAX_UPLOAD_SIZE_BYTES } from '@palka/config/limits';
import { z } from 'zod';

import { webmMimeTypeSchema } from '@/modules/storage/validators/mime-type';

import { noResiSchema } from './no-resi';

export const startRecordingSchema = z.object({
  noResi: noResiSchema,
});

export const saveRecordingMetadataSchema = z.object({
  recordingId: z.string().cuid(),
  noResi: noResiSchema,
  storageKey: z.string().min(1).max(512),
  publicUrl: z.string().url(),
  fileSizeBytes: z
    .number()
    .int()
    .positive()
    .max(MAX_UPLOAD_SIZE_BYTES, 'File exceeds the 500 MB upload limit'),
  durationSeconds: z
    .number()
    .int()
    .nonnegative()
    .max(30 * 60),
  mimeType: webmMimeTypeSchema,
});

export type StartRecordingInput = z.infer<typeof startRecordingSchema>;
export type SaveRecordingMetadataInput = z.infer<typeof saveRecordingMetadataSchema>;
export type SaveRecordingMetadataPayload = SaveRecordingMetadataInput;
