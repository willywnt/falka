import { z } from 'zod';

export const cancelRecordingSchema = z.object({
  recordingId: z.string().cuid(),
  failureCode: z.string().max(64).optional(),
  failureReason: z.string().max(512).optional(),
});

export type CancelRecordingInput = z.infer<typeof cancelRecordingSchema>;
