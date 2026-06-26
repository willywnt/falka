'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api/fetch-client';
import { formatApiErrorMessage } from '@/lib/api/format-api-error';
import { apiRoutes } from '@/lib/api/routes';

import { expenseKeys } from './expense-keys';
import type { ExpenseDetail, ExpenseListItem } from '../types';
import type { CreateExpenseInput, UpdateExpenseInput } from '../validators/expense';

/** Filters as serializable strings (ISO dates, category) for the URL + query key. */
export type ExpenseFilters = { from?: string; to?: string; category?: string };

export function useExpensesQuery(filters: ExpenseFilters = {}) {
  const from = filters.from ?? '';
  const to = filters.to ?? '';
  const category = filters.category ?? '';

  return useQuery({
    queryKey: expenseKeys.list(from, to, category),
    queryFn: async () => {
      const result = await apiFetch<ExpenseListItem[]>(apiRoutes.expenses, {
        params: {
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
          ...(category ? { category } : {}),
        },
      });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
  });
}

export function useCreateExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      const result = await apiFetch<ExpenseDetail>(apiRoutes.expenses, {
        method: 'POST',
        body: input,
      });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: expenseKeys.all }),
  });
}

export function useUpdateExpenseMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateExpenseInput) => {
      const result = await apiFetch<ExpenseDetail>(`${apiRoutes.expenses}/${id}`, {
        method: 'PATCH',
        body: input,
      });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: expenseKeys.all }),
  });
}

export function useDeleteExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await apiFetch<{ id: string }>(`${apiRoutes.expenses}/${id}`, {
        method: 'DELETE',
      });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: expenseKeys.all }),
  });
}
