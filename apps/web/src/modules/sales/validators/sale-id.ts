import { z } from 'zod';

export const saleIdSchema = z.object({ id: z.string().cuid() });

export type SaleIdInput = z.infer<typeof saleIdSchema>;
