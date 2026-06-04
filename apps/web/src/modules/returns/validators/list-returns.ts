import { ReturnStatus } from '@prisma/client';
import { z } from 'zod';

export const listReturnsQuerySchema = z.object({
  status: z.nativeEnum(ReturnStatus).optional(),
});

export type ListReturnsQuery = z.infer<typeof listReturnsQuerySchema>;
