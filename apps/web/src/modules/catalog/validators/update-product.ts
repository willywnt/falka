import { z } from 'zod';

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(1, 'Product name is required').max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    category: z.string().trim().max(100).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'At least one field must be provided.',
  });

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
