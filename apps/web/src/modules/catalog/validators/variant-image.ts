import { z } from 'zod';

/** Set a variant's photo from a just-uploaded R2 object (key + its public URL). */
export const setVariantImageSchema = z.object({
  imageKey: z.string().trim().min(1).max(512),
  imageUrl: z.string().trim().url().max(1024),
});

export type SetVariantImageInput = z.infer<typeof setVariantImageSchema>;
