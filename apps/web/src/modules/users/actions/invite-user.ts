'use server';

import { inviteUserSchema } from '../validators';

export async function inviteUserAction(formData: FormData) {
  const parsed = inviteUserSchema.safeParse({
    email: formData.get('email'),
    role: formData.get('role') ?? 'STAFF',
  });

  if (!parsed.success) {
    return { success: false as const, errors: parsed.error.flatten().fieldErrors };
  }

  // TODO: integrate with UsersService when auth is implemented
  return { success: true as const };
}
