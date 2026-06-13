'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api/fetch-client';
import { formatApiErrorMessage } from '@/lib/api/format-api-error';
import { apiRoutes } from '@/lib/api/routes';

import { adminKeys } from './admin-keys';
import type { AdminOrgListItem, CreateOrganizationResult } from '../types';
import type { CreateOrganizationInput, UpdateOrganizationConfigInput } from '../validators';

/**
 * Operational-metrics report from GET /admin/ops — the console only renders
 * the per-bucket counts, so each bucket is typed as a list of opaque rows.
 */
export interface AdminOpsReport {
  failedUploads: unknown[];
  orphanRecordings: unknown[];
  stuckJobs: unknown[];
  storageMismatch: unknown[];
  generatedAt: string;
}

export function useAdminOrgsQuery() {
  return useQuery({
    queryKey: adminKeys.organizations,
    queryFn: async () => {
      const result = await apiFetch<AdminOrgListItem[]>(apiRoutes.adminOrganizations);
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
  });
}

export function useAdminOpsQuery() {
  return useQuery({
    queryKey: adminKeys.ops,
    queryFn: async () => {
      const result = await apiFetch<AdminOpsReport>(apiRoutes.adminOps);
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
  });
}

export function useCreateOrgMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateOrganizationInput) => {
      const result = await apiFetch<CreateOrganizationResult>(apiRoutes.adminOrganizations, {
        method: 'POST',
        body: input,
      });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.organizations }),
  });
}

export function useUpdateOrgMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      organizationId,
      config,
    }: {
      organizationId: string;
      config: UpdateOrganizationConfigInput;
    }) => {
      const result = await apiFetch(`${apiRoutes.adminOrganizations}/${organizationId}`, {
        method: 'PATCH',
        body: config,
      });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.organizations }),
  });
}
