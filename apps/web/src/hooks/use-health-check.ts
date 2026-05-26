'use client';

import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api';
import { apiRoutes } from '@/lib/api/routes';

interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  services?: Record<string, string>;
}

export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const result = await apiFetch<HealthResponse>(apiRoutes.health);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    retry: 1,
    staleTime: 30_000,
  });
}
