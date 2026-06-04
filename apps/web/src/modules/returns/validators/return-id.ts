import { z } from 'zod';

export const returnIdSchema = z.object({ id: z.string().cuid() });

export type ReturnIdInput = z.infer<typeof returnIdSchema>;
