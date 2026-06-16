import { apiSuccess } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';
import { notificationServerService } from '@/modules/notifications/services/notification-server.service';

type RouteParams = { id: string };

export const POST = withApiRoute<RouteParams>(
  async (_request, { user, org, params }) => {
    const { id } = await params;
    await notificationServerService.markRead(org.id, user.id, id);
    return apiSuccess({ id });
  },
  { requireAuth: true },
);
