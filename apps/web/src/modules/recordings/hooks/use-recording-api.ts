'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api/fetch-client';
import { formatApiErrorMessage } from '@/lib/api/format-api-error';
import { apiRoutes } from '@/lib/api/routes';
import { storageQueryKeys } from '@/modules/storage/hooks/use-storage-quota';

import type {
  SaveRecordingMetadataPayload,
  SaveRecordingMetadataResponse,
  StartRecordingResponse,
} from '../types';
import type { CancelRecordingInput } from '../validators/cancel-recording';
import { recordingKeys } from './recording-keys';

export function useStartRecordingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noResi: string) => {
      const result = await apiFetch<StartRecordingResponse>(`${apiRoutes.recordings}/start`, {
        method: 'POST',
        body: { noResi },
      });

      if (!result.success) {
        throw new Error(formatApiErrorMessage(result.error));
      }

      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: recordingKeys.active });
    },
  });
}

export function useSaveRecordingMetadataMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SaveRecordingMetadataPayload) => {
      const result = await apiFetch<SaveRecordingMetadataResponse>(apiRoutes.recordings, {
        method: 'POST',
        body: payload,
      });

      if (!result.success) {
        throw new Error(formatApiErrorMessage(result.error));
      }

      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: recordingKeys.all });
      void queryClient.invalidateQueries({ queryKey: storageQueryKeys.quota });
    },
  });
}

export function useCancelRecordingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CancelRecordingInput | string) => {
      const payload = typeof input === 'string' ? { recordingId: input } : input;

      const result = await apiFetch<{ success: true }>(`${apiRoutes.recordings}/cancel`, {
        method: 'POST',
        body: payload,
      });

      if (!result.success) {
        throw new Error(formatApiErrorMessage(result.error));
      }

      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: recordingKeys.all });
    },
  });
}

export function useMarkUploadingMutation() {
  return useMutation({
    mutationFn: async (recordingId: string) => {
      const result = await apiFetch<{ success: true }>(`${apiRoutes.recordings}/uploading`, {
        method: 'POST',
        body: { recordingId },
      });

      if (!result.success) {
        throw new Error(formatApiErrorMessage(result.error));
      }

      return result.data;
    },
  });
}
