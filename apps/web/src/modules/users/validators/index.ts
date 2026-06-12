import { z } from 'zod';

export const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'STAFF']).default('STAFF'),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['OWNER', 'ADMIN', 'STAFF']),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
