import { ALLOWED_UPLOAD_MIME_TYPES } from '@falka/config/limits';
import { z } from 'zod';

const allowedMimeTypes = ALLOWED_UPLOAD_MIME_TYPES as unknown as [string, ...string[]];

export function normalizeWebmMimeType(
  mimeType: string,
): (typeof ALLOWED_UPLOAD_MIME_TYPES)[number] {
  const baseType = mimeType.split(';')[0]?.trim().toLowerCase();

  if (baseType === 'video/webm') {
    return 'video/webm';
  }

  throw new Error('Only video/webm uploads are supported');
}

export const webmMimeTypeSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    const baseType = value.split(';')[0]?.trim().toLowerCase();

    if (baseType !== 'video/webm') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Only video/webm uploads are supported',
      });
    }
  })
  .transform((value) => normalizeWebmMimeType(value))
  .pipe(z.enum(allowedMimeTypes));
