import { NextResponse } from 'next/server';
import { z } from 'zod';

import { catalogServerService } from '@/modules/catalog/services/catalog-server.service';
import { setBundleSchema } from '@/modules/catalog/validators';
import { apiNotFound, apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

const paramsSchema = z.object({ variantId: z.string().min(1) });

type RouteParams = { variantId: string };

export const GET = withApiRoute<RouteParams>(
  async (_request, { user, params }) => {
    const parsed = paramsSchema.safeParse(await params);
    if (!parsed.success) return apiNotFound('Bundle not found');

    const bundle = await catalogServerService.getBundleByVariant(user.id, parsed.data.variantId);
    return apiSuccess(bundle);
  },
  { requireAuth: true },
);

export const PUT = withApiRoute<RouteParams>(
  async (request, { user, params }) => {
    const parsedParams = paramsSchema.safeParse(await params);
    if (!parsedParams.success) return apiNotFound('Bundle not found');

    const body: unknown = await request.json();
    const parsed = setBundleSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const bundle = await catalogServerService.setBundleComponentsByVariant(
      user.id,
      parsedParams.data.variantId,
      parsed.data,
    );
    return apiSuccess(bundle);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
