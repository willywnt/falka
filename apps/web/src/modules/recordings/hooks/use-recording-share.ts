'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api/fetch-client';
import { formatApiErrorMessage } from '@/lib/api/format-api-error';
import { apiRoutes } from '@/lib/api/routes';

import type { CreateShareLinkResponse, ShareLinkItem } from '../types';
import { recordingKeys } from './recording-keys';

export function useShareLinksQuery(recordingId: string | null, enabled = true) {
  return useQuery({
    queryKey: recordingKeys.shareLinks(recordingId ?? 'unknown'),
    queryFn: async () => {
      const result = await apiFetch<ShareLinkItem[]>(
        `${apiRoutes.recordings}/${recordingId}/share`,
      );
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    enabled: Boolean(recordingId) && enabled,
  });
}

export function useCreateShareLinkMutation(recordingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expiresInHours: number) => {
      const result = await apiFetch<CreateShareLinkResponse>(
        `${apiRoutes.recordings}/${recordingId}/share`,
        { method: 'POST', body: { expiresInHours } },
      );
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: recordingKeys.shareLinks(recordingId) });
    },
  });
}

export function useRevokeShareLinkMutation(recordingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shareLinkId: string) => {
      const result = await apiFetch<ShareLinkItem>(
        `${apiRoutes.recordings}/${recordingId}/share/${shareLinkId}`,
        { method: 'DELETE' },
      );
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: recordingKeys.shareLinks(recordingId) });
    },
  });
}
