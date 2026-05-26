'use server';

import { saveRecordingMetadataSchema } from '../validators/create-recording';

export async function createRecordingAction(input: unknown) {
  const parsed = saveRecordingMetadataSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false as const, errors: parsed.error.flatten().fieldErrors };
  }

  return { success: true as const, data: parsed.data };
}
