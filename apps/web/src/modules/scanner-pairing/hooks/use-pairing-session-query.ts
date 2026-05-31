'use client';

import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api/fetch-client';
import { apiRoutes } from '@/lib/api/routes';

import type { PairingSessionSummary } from '../types';
import { pairingQueryKeys } from './use-pairing-api';

export function usePairingSessionQuery(pairingId: string | null, enabled = true) {
  return useQuery({
    queryKey: pairingQueryKeys.session(pairingId ?? ''),
    queryFn: async () => {
      const result = await apiFetch<{ session: PairingSessionSummary }>(
        `${apiRoutes.scannerPairing}/${pairingId}`,
      );
      if (!result.success) throw new Error(result.error.message);
      return result.data.session;
    },
    enabled: enabled && Boolean(pairingId),
    retry: 1,
  });
}
