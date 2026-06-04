import { ReturnDisposition } from '@prisma/client';
import { z } from 'zod';

export const processReturnSchema = z.object({
  lines: z
    .array(
      z.object({
        returnItemId: z.string().cuid(),
        disposition: z.nativeEnum(ReturnDisposition),
      }),
    )
    .min(1),
});

export type ProcessReturnInput = z.infer<typeof processReturnSchema>;
