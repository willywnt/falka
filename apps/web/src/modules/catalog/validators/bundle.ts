import { z } from 'zod';

/** Components that make up a bundle/kit. An empty array clears the bundle. */
export const setBundleSchema = z.object({
  components: z
    .array(
      z.object({
        componentVariantId: z.string().min(1),
        quantity: z.number().int().positive().max(1000),
      }),
    )
    .max(50),
});

export type SetBundleInput = z.infer<typeof setBundleSchema>;
