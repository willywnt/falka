import { z } from 'zod';

import { MAX_OPTION_TYPES, optionTypesSchema, variantOptionsSchema } from './options';

/** Decimal(12,2) caps the storable money value just under 10^10. */
const MAX_MONEY = 9_999_999_999;
/** Decimal(10,3) caps the storable weight just under 10^7. */
const MAX_WEIGHT = 9_999_999;
const MAX_STOCK = 1_000_000_000;
/** Reorder-planning lead time, capped at a year. 0 = use the global default. */
const MAX_LEAD_DAYS = 365;

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value === '' ? undefined : value));

export const createVariantSchema = z.object({
  sku: z.string().trim().min(1, 'SKU is required').max(64),
  name: z.string().trim().min(1, 'Variant name is required').max(200),
  options: variantOptionsSchema.optional(),
  barcode: optionalTrimmed(64),
  price: z.coerce.number().nonnegative('Price must be 0 or more').max(MAX_MONEY),
  cost: z.coerce.number().nonnegative().max(MAX_MONEY).optional(),
  weight: z.coerce.number().nonnegative().max(MAX_WEIGHT).optional(),
  lowStockThreshold: z.coerce.number().int().nonnegative().max(MAX_STOCK).default(0),
  alertEnabled: z.boolean().default(true),
  initialStock: z.coerce.number().int().nonnegative().max(MAX_STOCK).default(0),
  leadTimeDays: z.coerce.number().int().nonnegative().max(MAX_LEAD_DAYS).optional(),
  minOrderQty: z.coerce.number().int().nonnegative().max(MAX_STOCK).optional(),
});

export type CreateVariantInput = z.infer<typeof createVariantSchema>;

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required').max(200),
  description: optionalTrimmed(2000),
  category: optionalTrimmed(100),
  optionTypes: optionTypesSchema.optional(),
  variant: createVariantSchema,
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

/** One option row in the create form: a dimension name + the first variant's value. */
const formOptionRowSchema = z.object({
  name: z.string().trim().min(1, 'Option name is required').max(40),
  value: z.string().trim().min(1, 'Value is required').max(60),
});

/** Form-facing schema: plain (non-optional) fields the create-product dialog binds to. */
export const createProductFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Product name is required').max(200),
    category: z.string().trim().max(100),
    description: z.string().trim().max(2000),
    options: z.array(formOptionRowSchema).max(MAX_OPTION_TYPES),
    variant: z.object({
      sku: z.string().trim().min(1, 'SKU is required').max(64),
      name: z.string().trim().min(1, 'Variant name is required').max(200),
      price: z.coerce.number().nonnegative('Price must be 0 or more').max(MAX_MONEY),
      cost: z.coerce.number().nonnegative('Cost must be 0 or more').max(MAX_MONEY),
      lowStockThreshold: z.coerce.number().int().nonnegative().max(MAX_STOCK),
      initialStock: z.coerce.number().int().nonnegative().max(MAX_STOCK),
      leadTimeDays: z.coerce.number().int().nonnegative().max(MAX_LEAD_DAYS),
      minOrderQty: z.coerce.number().int().nonnegative().max(MAX_STOCK),
    }),
  })
  .superRefine((data, ctx) => {
    const names = data.options.map((option) => option.name.trim().toLowerCase());
    names.forEach((name, index) => {
      if (name && names.indexOf(name) !== index) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options', index, 'name'],
          message: 'Duplicate option',
        });
      }
    });
  });

export type CreateProductFormInput = z.infer<typeof createProductFormSchema>;

const optionValueSchema = z.string().trim().min(1, 'Required').max(60);

/**
 * Form-facing schema for adding a variant to an existing product. Built per
 * product so `optionValues` requires exactly one value per declared dimension
 * (empty array when the product has no options).
 */
export function buildAddVariantFormSchema(optionTypes: readonly string[]) {
  return z.object({
    sku: z.string().trim().min(1, 'SKU is required').max(64),
    name: z.string().trim().min(1, 'Variant name is required').max(200),
    optionValues: z.array(optionValueSchema).length(optionTypes.length),
    price: z.coerce.number().nonnegative('Price must be 0 or more').max(MAX_MONEY),
    cost: z.coerce.number().nonnegative('Cost must be 0 or more').max(MAX_MONEY),
    lowStockThreshold: z.coerce.number().int().nonnegative().max(MAX_STOCK),
    initialStock: z.coerce.number().int().nonnegative().max(MAX_STOCK),
    leadTimeDays: z.coerce.number().int().nonnegative().max(MAX_LEAD_DAYS),
    minOrderQty: z.coerce.number().int().nonnegative().max(MAX_STOCK),
  });
}

export type AddVariantFormInput = z.infer<ReturnType<typeof buildAddVariantFormSchema>>;
