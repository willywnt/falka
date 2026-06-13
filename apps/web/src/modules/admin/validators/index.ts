import { z } from 'zod';

/** Owner account minted alongside a new organization. */
const ownerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email pemilik tidak valid').max(255),
  displayName: z.string().trim().max(100).optional(),
  password: z.string().min(8, 'Password minimal 8 karakter').max(128),
});

/** Provision a new organization + its OWNER account. */
export const createOrganizationSchema = z.object({
  orgName: z.string().trim().min(1, 'Nama organisasi wajib diisi').max(100),
  plan: z.string().trim().min(1).max(50).optional(),
  /** null = unlimited; omit to leave unset. */
  memberLimit: z.number().int().positive().nullable().optional(),
  owner: ownerSchema,
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

/** Edit an existing org's config — every field optional (partial update). */
export const updateOrganizationConfigSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    plan: z.string().trim().min(1).max(50),
    memberLimit: z.number().int().positive().nullable(),
    /** Stored as BigInt server-side; accepted as a non-negative integer. */
    storageQuotaBytes: z.number().int().nonnegative(),
  })
  .partial();

export type UpdateOrganizationConfigInput = z.infer<typeof updateOrganizationConfigSchema>;
