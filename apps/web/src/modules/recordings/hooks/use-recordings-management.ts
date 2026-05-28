'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api/fetch-client';
import { formatApiErrorMessage } from '@/lib/api/format-api-error';
import { apiRoutes } from '@/lib/api/routes';
import { storageQueryKeys } from '@/modules/storage/hooks/use-storage-quota';

import type {
  PaginatedRecordingsResponse,
  RecordingDetail,
  RecordingDownloadResponse,
  RecordingListItem,
  RecordingPlaybackResponse,
} from '../types';
import type { ListRecordingsQuery } from '../validators/list-recordings';

export const recordingsManagementKeys = {
  all: ['recordings-management'] as const,
  list: (query: ListRecordingsQuery) => ['recordings-management', 'list', query] as const,
  detail: (id: string) => ['recordings-management', 'detail', id] as const,
  playback: (id: string) => ['recordings-management', 'playback', id] as const,
};

function buildListQueryString(query: ListRecordingsQuery): string {
  const params = new URLSearchParams();

  params.set('page', String(query.page));
  params.set('pageSize', String(query.pageSize));
  params.set('status', query.status);
  params.set('sortBy', query.sortBy);
  params.set('sortOrder', query.sortOrder);

  if (query.search) {
    params.set('search', query.search);
  }

  return params.toString();
}

export function useRecordingsListQuery(query: ListRecordingsQuery) {
  return useQuery({
    queryKey: recordingsManagementKeys.list(query),
    queryFn: async () => {
      const result = await apiFetch<RecordingListItem[]>(
        `${apiRoutes.recordings}?${buildListQueryString(query)}`,
      );

      if (!result.success) {
        throw new Error(formatApiErrorMessage(result.error));
      }

      return {
        items: result.data,
        meta: result.meta as PaginatedRecordingsResponse['meta'],
      } satisfies PaginatedRecordingsResponse;
    },
    placeholderData: (previous) => previous,
  });
}

export function useRecordingDetailQuery(id: string | null, enabled = true) {
  return useQuery({
    queryKey: recordingsManagementKeys.detail(id ?? 'unknown'),
    queryFn: async () => {
      const result = await apiFetch<RecordingDetail>(`${apiRoutes.recordings}/${id}`);

      if (!result.success) {
        throw new Error(formatApiErrorMessage(result.error));
      }

      return result.data;
    },
    enabled: Boolean(id) && enabled,
  });
}

export function useRecordingPlaybackQuery(recordingId: string | null, enabled = true) {
  return useQuery({
    queryKey: recordingsManagementKeys.playback(recordingId ?? 'unknown'),
    queryFn: async () => {
      const result = await apiFetch<RecordingPlaybackResponse>(
        `${apiRoutes.recordings}/${recordingId}/playback`,
      );

      if (!result.success) {
        throw new Error(formatApiErrorMessage(result.error));
      }

      return result.data;
    },
    enabled: Boolean(recordingId) && enabled,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}

export function useDeleteRecordingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recordingId: string) => {
      const result = await apiFetch<{ success: true }>(`${apiRoutes.recordings}/${recordingId}`, {
        method: 'DELETE',
      });

      if (!result.success) {
        throw new Error(formatApiErrorMessage(result.error));
      }

      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: recordingsManagementKeys.all });
      void queryClient.invalidateQueries({ queryKey: storageQueryKeys.quota });
    },
  });
}

export function useDownloadRecordingMutation() {
  return useMutation({
    mutationFn: async (recordingId: string) => {
      const result = await apiFetch<RecordingDownloadResponse>(
        `${apiRoutes.recordings}/${recordingId}/download`,
      );

      if (!result.success) {
        throw new Error(formatApiErrorMessage(result.error));
      }

      return result.data;
    },
    onSuccess: (data) => {
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.filename;
      link.rel = 'noopener';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
  });
}
