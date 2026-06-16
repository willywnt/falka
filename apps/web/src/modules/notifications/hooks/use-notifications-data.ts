'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api/fetch-client';
import { formatApiErrorMessage } from '@/lib/api/format-api-error';
import { apiRoutes } from '@/lib/api/routes';

import type { NotificationListItem } from '../types';
import { notificationKeys } from './notification-keys';

const PAGE_SIZE = 20;

export type NotificationsQueryData = {
  items: NotificationListItem[];
  unreadCount: number;
};

/** The persisted notification feed (page 1) + the member's unread count. */
export function useNotificationsQuery() {
  return useQuery({
    queryKey: notificationKeys.list(1, PAGE_SIZE),
    queryFn: async (): Promise<NotificationsQueryData> => {
      const result = await apiFetch<NotificationListItem[]>(apiRoutes.notifications, {
        params: { page: 1, pageSize: PAGE_SIZE },
      });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      const meta = result.meta as { unreadCount?: number } | undefined;
      return { items: result.data, unreadCount: meta?.unreadCount ?? 0 };
    },
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const result = await apiFetch(`${apiRoutes.notifications}/${notificationId}/read`, {
        method: 'POST',
      });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const result = await apiFetch(`${apiRoutes.notifications}/read-all`, { method: 'POST' });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
