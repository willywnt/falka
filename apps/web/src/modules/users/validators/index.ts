import { z } from 'zod';

export const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
