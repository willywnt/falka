'use server';

import { getCurrentUser } from '@/modules/auth/services/session';
import { marketplaceServerService } from '@/modules/marketplace/services/marketplace-server.service';
import { createMarketplaceConnectionSchema } from '@/modules/marketplace/validators/create-connection';

export async function connectMarketplaceAction(input: unknown) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false as const, message: 'Unauthorized' };
  }

  const parsed = createMarketplaceConnectionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      message: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const connection = await marketplaceServerService.createConnection(user.id, parsed.data);
    return { success: true as const, data: connection };
  } catch (error) {
    return {
      success: false as const,
      message: error instanceof Error ? error.message : 'Failed to connect marketplace',
    };
  }
}
