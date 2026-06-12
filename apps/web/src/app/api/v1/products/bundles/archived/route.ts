import { catalogServerService } from '@/modules/catalog/services/catalog-server.service';
import { apiSuccess } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

export const GET = withApiRoute(
  async (_request, { user }) => {
    const bundles = await catalogServerService.listArchivedBundles(user.id);
    return apiSuccess(bundles);
  },
  { requireAuth: true },
);
