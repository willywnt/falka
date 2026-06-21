'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api/fetch-client';
import { formatApiErrorMessage } from '@/lib/api/format-api-error';
import { apiRoutes } from '@/lib/api/routes';
import type { PageMeta } from '@/hooks/use-pagination';

import type { NotificationListItem, NotificationPreferenceItem } from '../types';
import type { UpdateNotificationPreferenceInput } from '../validators/update-preference';
import { notificationKeys } from './notification-keys';

const PAGE_SIZE = 20;

export type NotificationsQueryData = {
  items: NotificationListItem[];
  unreadCount: number;
};

export type NotificationsHistoryData = {
  items: NotificationListItem[];
  meta: (PageMeta & { unreadCount?: number }) | undefined;
};

/** The persisted notification feed (page 1) + the member's unread count — for the navbar tray. */
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

/** The full paginated history for the "Lihat semua" page. */
export function useNotificationsHistoryQuery(page: number, pageSize = PAGE_SIZE) {
  return useQuery({
    queryKey: notificationKeys.history(page, pageSize),
    queryFn: async (): Promise<NotificationsHistoryData> => {
      const result = await apiFetch<NotificationListItem[]>(apiRoutes.notifications, {
        params: { page, pageSize },
      });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return {
        items: result.data,
        meta: result.meta as (PageMeta & { unreadCount?: number }) | undefined,
      };
    },
    placeholderData: keepPreviousData,
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

/** The member's per-category tray preferences (Settings → Notifikasi). */
export function useNotificationPreferencesQuery() {
  return useQuery({
    queryKey: notificationKeys.preferences,
    queryFn: async (): Promise<NotificationPreferenceItem[]> => {
      const result = await apiFetch<NotificationPreferenceItem[]>(
        `${apiRoutes.notifications}/preferences`,
      );
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
  });
}

/** Toggle one category on/off; refreshes the tray since muting changes what it shows. */
export function useSetNotificationPreferenceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: UpdateNotificationPreferenceInput,
    ): Promise<NotificationPreferenceItem[]> => {
      const result = await apiFetch<NotificationPreferenceItem[]>(
        `${apiRoutes.notifications}/preferences`,
        { method: 'PATCH', body: input },
      );
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    onSuccess: (data) => {
      // Instant toggle feedback, then refresh the tray (muting changes its contents).
      queryClient.setQueryData(notificationKeys.preferences, data);
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
