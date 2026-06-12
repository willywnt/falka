import { NextResponse } from 'next/server';
import { z } from 'zod';

import { catalogServerService } from '@/modules/catalog/services/catalog-server.service';
import { apiNotFound, apiSuccess } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

const paramsSchema = z.object({ bundleId: z.string().min(1) });

type RouteParams = { bundleId: string };

export const POST = withApiRoute<RouteParams>(
  async (_request, { user, params }) => {
    const parsed = paramsSchema.safeParse(await params);
    if (!parsed.success) return apiNotFound('Bundle not found');

    const restored = await catalogServerService.restoreBundle(user.id, parsed.data.bundleId);
    return apiSuccess(restored);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
