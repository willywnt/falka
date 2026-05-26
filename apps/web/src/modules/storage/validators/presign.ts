import {
  ALLOWED_UPLOAD_EXTENSIONS,
  MAX_UPLOAD_SIZE_BYTES,
} from '@olshop/config/limits';
import { z } from 'zod';

import { hasAllowedExtension } from '../utils/mime';
import { webmMimeTypeSchema } from './mime-type';

export const presignUploadSchema = z
  .object({
    filename: z
      .string()
      .trim()
      .min(1, 'Filename is required')
      .max(255, 'Filename must be at most 255 characters'),
    mimeType: webmMimeTypeSchema,
    fileSizeBytes: z
      .number()
      .int('File size must be an integer')
      .positive('File size must be greater than zero')
      .max(MAX_UPLOAD_SIZE_BYTES, 'File exceeds the 500 MB upload limit'),
  })
  .superRefine((data, ctx) => {
    if (!hasAllowedExtension(data.filename, ALLOWED_UPLOAD_EXTENSIONS)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Only .webm files are supported',
        path: ['filename'],
      });
    }
  });

export type PresignUploadInput = z.infer<typeof presignUploadSchema>;
