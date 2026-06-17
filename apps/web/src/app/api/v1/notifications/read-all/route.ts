import { apiSuccess } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';
import { hiddenNotificationCategories } from '@/modules/notifications/notification-visibility';
import { notificationServerService } from '@/modules/notifications/services/notification-server.service';

export const POST = withApiRoute(
  async (_request, { user, org }) => {
    const result = await notificationServerService.markAllRead(
      org.id,
      user.id,
      hiddenNotificationCategories(org.permissions),
    );
    return apiSuccess(result);
  },
  { requireAuth: true },
);
