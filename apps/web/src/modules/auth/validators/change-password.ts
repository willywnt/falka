import { z } from 'zod';

/** Self-service password change — the new password follows the register policy (min 8). */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password lama wajib diisi'),
  newPassword: z.string().min(8, 'Password minimal 8 karakter'),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
