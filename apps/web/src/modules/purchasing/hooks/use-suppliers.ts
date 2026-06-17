'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api/fetch-client';
import { formatApiErrorMessage } from '@/lib/api/format-api-error';
import { apiRoutes } from '@/lib/api/routes';

import { supplierKeys } from './supplier-keys';
import type { SupplierDetail, SupplierListItem, SupplierOption } from '../types';
import type { CreateSupplierInput, UpdateSupplierInput } from '../validators/supplier';

export function useSuppliersQuery(enabled = true) {
  return useQuery({
    queryKey: supplierKeys.list,
    queryFn: async () => {
      const result = await apiFetch<SupplierListItem[]>(apiRoutes.suppliers);
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    enabled,
  });
}

/** Active suppliers as lightweight picker options (PO form, variant edit). */
export function useSupplierOptionsQuery(enabled = true) {
  return useQuery({
    queryKey: supplierKeys.options,
    queryFn: async () => {
      const result = await apiFetch<SupplierOption[]>(`${apiRoutes.suppliers}/options`);
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    enabled,
  });
}

export function useCreateSupplierMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSupplierInput) => {
      const result = await apiFetch<SupplierDetail>(apiRoutes.suppliers, {
        method: 'POST',
        body: input,
      });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: supplierKeys.all }),
  });
}

export function useUpdateSupplierMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateSupplierInput) => {
      const result = await apiFetch<SupplierDetail>(`${apiRoutes.suppliers}/${id}`, {
        method: 'PATCH',
        body: input,
      });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: supplierKeys.all }),
  });
}

export function useDeleteSupplierMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await apiFetch<{ id: string }>(`${apiRoutes.suppliers}/${id}`, {
        method: 'DELETE',
      });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: supplierKeys.all }),
  });
}
