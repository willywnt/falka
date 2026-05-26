'use server';

import { getCurrentUser } from '@/modules/auth/services/session';
import { StorageError } from '@/modules/storage/errors/storage-errors';
import { uploadService } from '@/modules/storage/services/upload.service';
import { presignUploadSchema } from '@/modules/storage/validators/presign';
import type { PresignUploadResponse } from '@/modules/storage/types';

type PresignActionResult =
  | { success: true; data: PresignUploadResponse }
  | { success: false; code: string; message: string };

export async function presignUploadAction(input: unknown): Promise<PresignActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      code: 'UNAUTHORIZED',
      message: 'You must be signed in to upload files.',
    };
  }

  const parsed = presignUploadSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed.',
    };
  }

  try {
    const data = await uploadService.createPresignedUpload(user.id, parsed.data);
    return { success: true, data };
  } catch (error) {
    if (error instanceof StorageError) {
      return {
        success: false,
        code: error.code,
        message: error.message,
      };
    }

    throw error;
  }
}
