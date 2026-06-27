'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api/fetch-client';
import { formatApiErrorMessage } from '@/lib/api/format-api-error';
import { apiRoutes } from '@/lib/api/routes';

import { budgetKeys } from './budget-keys';
import type { BudgetListItem, BudgetReport } from '../types';
import type { UpsertBudgetsInput } from '../validators/budget';

export function useBudgetsQuery() {
  return useQuery({
    queryKey: budgetKeys.list(),
    queryFn: async () => {
      const result = await apiFetch<BudgetListItem[]>(apiRoutes.budgets);
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
  });
}

export function useBudgetReportQuery(month: string) {
  return useQuery({
    queryKey: budgetKeys.report(month),
    queryFn: async () => {
      const result = await apiFetch<BudgetReport>(`${apiRoutes.budgets}/report`, {
        params: { month },
      });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
  });
}

export function useUpsertBudgetsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertBudgetsInput) => {
      const result = await apiFetch<BudgetListItem[]>(apiRoutes.budgets, {
        method: 'PATCH',
        body: input,
      });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    // Budgets changed → both the list and the budget-vs-actual report are stale.
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: budgetKeys.all }),
  });
}
