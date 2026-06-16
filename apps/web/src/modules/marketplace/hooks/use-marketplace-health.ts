'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api/fetch-client';
import { formatApiErrorMessage } from '@/lib/api/format-api-error';
import { apiRoutes } from '@/lib/api/routes';

import type { MarketplaceConnectionHealth, MarketplaceDriftReport } from '../types';
import { marketplaceKeys } from './use-marketplace-connections';
import { marketplaceListingKeys } from './use-marketplace-listings';

/** Per-connection health for the dashboard badges + nav pulse (computed on-read, cheap). */
export function useMarketplaceHealthQuery(enabled = true) {
  return useQuery({
    queryKey: marketplaceKeys.health(),
    queryFn: async () => {
      const result = await apiFetch<MarketplaceConnectionHealth[]>(
        `${apiRoutes.marketplace}/health`,
      );

      if (!result.success) {
        throw new Error(formatApiErrorMessage(result.error));
      }

      return result.data;
    },
    enabled,
  });
}

/** One connection's health for the detail "Kesehatan & drift" panel. */
export function useMarketplaceConnectionHealthQuery(connectionId: string, enabled = true) {
  return useQuery({
    queryKey: marketplaceKeys.healthDetail(connectionId),
    queryFn: async () => {
      const result = await apiFetch<MarketplaceConnectionHealth>(
        `${apiRoutes.marketplace}/${connectionId}/health`,
      );

      if (!result.success) {
        throw new Error(formatApiErrorMessage(result.error));
      }

      return result.data;
    },
    enabled: Boolean(connectionId) && enabled,
  });
}

/** Run a live drift check against one connection's provider (read-only, on demand). */
export function useDriftCheckMutation(connectionId: string) {
  return useMutation({
    mutationFn: async () => {
      const result = await apiFetch<MarketplaceDriftReport>(
        `${apiRoutes.marketplace}/${connectionId}/drift-check`,
        { method: 'POST' },
      );

      if (!result.success) {
        throw new Error(formatApiErrorMessage(result.error));
      }

      return result.data;
    },
  });
}

/** Bulk re-push: queue a stock sync for every sync-enabled listing of the connection. */
export function useSyncAllMutation(connectionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await apiFetch<{ queued: number }>(
        `${apiRoutes.marketplace}/${connectionId}/sync-all`,
        { method: 'POST' },
      );

      if (!result.success) {
        throw new Error(formatApiErrorMessage(result.error));
      }

      return result.data;
    },
    onSuccess: () => {
      // Kick the in-flight poll + refresh listing/health statuses as jobs land.
      void queryClient.invalidateQueries({ queryKey: marketplaceKeys.syncStatus(connectionId) });
      void queryClient.invalidateQueries({ queryKey: marketplaceListingKeys.all(connectionId) });
      void queryClient.invalidateQueries({ queryKey: marketplaceKeys.healthDetail(connectionId) });
    },
  });
}

/**
 * In-flight stock-sync count for the connection — polls every 3s WHILE work is queued
 * (PENDING/PROCESSING), then stops. Drives the "sinkronisasi berjalan" indicator and the
 * disable-while-running guard against double-syncs.
 */
export function useSyncStatusQuery(connectionId: string, enabled = true) {
  return useQuery({
    queryKey: marketplaceKeys.syncStatus(connectionId),
    queryFn: async () => {
      const result = await apiFetch<{ inFlight: number }>(
        `${apiRoutes.marketplace}/${connectionId}/sync-status`,
      );

      if (!result.success) {
        throw new Error(formatApiErrorMessage(result.error));
      }

      return result.data;
    },
    enabled: Boolean(connectionId) && enabled,
    refetchInterval: (query) => ((query.state.data?.inFlight ?? 0) > 0 ? 2000 : false),
  });
}
