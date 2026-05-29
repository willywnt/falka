import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/modules/auth/services/session';
import { inventoryServerService } from '@/modules/inventory/services/inventory-server.service';
import { apiSuccess, apiUnauthorized, handleApiError } from '@/lib/api-response';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return apiUnauthorized();

    const inventory = await inventoryServerService.listInventory(user.id);
    return apiSuccess(inventory);
  } catch (error) {
    return handleApiError(error);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
