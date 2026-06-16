import { apiSuccess } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';
import { notificationServerService } from '@/modules/notifications/services/notification-server.service';

export const POST = withApiRoute(
  async (_request, { user, org }) => {
    const result = await notificationServerService.markAllRead(org.id, user.id);
    return apiSuccess(result);
  },
  { requireAuth: true },
);
