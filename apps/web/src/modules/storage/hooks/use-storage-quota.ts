'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api/fetch-client';
import { formatApiErrorMessage } from '@/lib/api/format-api-error';
import { apiRoutes } from '@/lib/api/routes';

import type { StorageQuotaResponse } from '../types';

export const storageQueryKeys = {
  quota: ['storage', 'quota'] as const,
};

export function useStorageQuotaQuery() {
  return useQuery({
    queryKey: storageQueryKeys.quota,
    queryFn: async () => {
      const result = await apiFetch<StorageQuotaResponse>(`${apiRoutes.storage}/quota`);

      if (!result.success) {
        throw new Error(formatApiErrorMessage(result.error));
      }

      return result.data;
    },
    staleTime: 60_000,
  });
}

export function useInvalidateStorageQuota() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: storageQueryKeys.quota });
  };
}
