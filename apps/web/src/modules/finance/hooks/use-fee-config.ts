'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api/fetch-client';
import { formatApiErrorMessage } from '@/lib/api/format-api-error';
import { apiRoutes } from '@/lib/api/routes';

import { expenseKeys } from './expense-keys';
import { feeConfigKeys } from './fee-config-keys';
import type { DeriveFeesResult, FeeConfig } from '../types';
import type { DeriveFeesInput, UpdateFeeConfigInput } from '../validators/fee-config';

export function useFeeConfigQuery() {
  return useQuery({
    queryKey: feeConfigKeys.all,
    queryFn: async () => {
      const result = await apiFetch<FeeConfig>(apiRoutes.feeConfig);
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
  });
}

export function useUpdateFeeConfigMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateFeeConfigInput) => {
      const result = await apiFetch<FeeConfig>(apiRoutes.feeConfig, {
        method: 'PATCH',
        body: input,
      });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: feeConfigKeys.all }),
  });
}

/** "Hitung fee bulan ini" — materialize the month's fee estimates from the configured rates. */
export function useDeriveFeesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: DeriveFeesInput) => {
      const result = await apiFetch<DeriveFeesResult>(`${apiRoutes.feeConfig}/derive`, {
        method: 'POST',
        body: input,
      });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    onSuccess: () => {
      // New/updated fee expenses landed → refresh the ledger (the report/card refetch on revisit).
      void queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}
