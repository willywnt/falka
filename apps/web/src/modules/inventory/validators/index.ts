export * from './mutations';
export * from './queries';

import { z } from 'zod';

const productDimensionsSchema = z.object({
  length: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
  unit: z.enum(['cm', 'in']),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required').max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  brand: z.string().trim().max(100).optional(),
  description: z.string().trim().max(5000).optional(),
  isActive: z.boolean().default(true),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const createProductFormSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required').max(200),
  slug: z.string().trim().max(200).optional(),
  brand: z.string().trim().max(100).optional(),
  description: z.string().trim().max(5000).optional(),
  isActive: z.boolean(),
});

export type CreateProductFormInput = z.infer<typeof createProductFormSchema>;

export const createProductVariantSchema = z.object({
  productId: z.string().cuid(),
  sku: z
    .string()
    .trim()
    .min(1, 'SKU is required')
    .max(100)
    .regex(/^[A-Za-z0-9._-]+$/, 'SKU must be alphanumeric with . _ -'),
  barcode: z.string().trim().max(100).optional(),
  name: z.string().trim().min(1, 'Variant name is required').max(200),
  price: z.coerce.number().nonnegative('Price must be non-negative'),
  cost: z.coerce.number().nonnegative().optional(),
  weight: z.coerce.number().nonnegative().optional(),
  dimensions: productDimensionsSchema.optional(),
  initialStock: z.coerce.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
});

export type CreateProductVariantInput = z.infer<typeof createProductVariantSchema>;

export const createProductVariantFormSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(1, 'SKU is required')
    .max(100)
    .regex(/^[A-Za-z0-9._-]+$/, 'SKU must be alphanumeric with . _ -'),
  barcode: z.string().trim().max(100).optional(),
  name: z.string().trim().min(1, 'Variant name is required').max(200),
  price: z.coerce.number().nonnegative('Price must be non-negative'),
  cost: z.coerce.number().nonnegative().optional(),
  weight: z.coerce.number().nonnegative().optional(),
  dimensions: productDimensionsSchema.optional(),
  initialStock: z.coerce.number().int().nonnegative(),
  isActive: z.boolean(),
});

export type CreateProductVariantFormInput = z.infer<typeof createProductVariantFormSchema>;

export const variantIdParamSchema = z.object({
  id: z.string().cuid(),
});

export const productIdParamSchema = z.object({
  id: z.string().cuid(),
});
