import { z } from 'zod';

export const renameOrgSchema = z.object({
  name: z.string().trim().min(1, 'Nama organisasi wajib diisi').max(100),
});

export type RenameOrgInput = z.infer<typeof renameOrgSchema>;
