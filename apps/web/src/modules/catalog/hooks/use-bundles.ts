'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api/fetch-client';
import { formatApiErrorMessage } from '@/lib/api/format-api-error';
import { apiRoutes } from '@/lib/api/routes';
import type { PageMeta } from '@/hooks/use-pagination';

import { compressImage } from '../utils/compress-image';
import { catalogKeys } from './catalog-keys';
import type { BundleDetail, BundleListItem, BundleListSummary } from '../types';
import type { CreateBundleInput, UpdateBundleInput } from '../validators/bundle';

export type BundleStatusFilter = 'all' | 'available' | 'unavailable';

/** A page of bundles for the dedicated Bundles list + triage summary counts. */
export type BundlesPage = {
  items: BundleListItem[];
  meta: PageMeta;
  summary: BundleListSummary;
};

/** Paginated list of bundles (debounced search) + a status triage filter. */
export function useBundlesQuery(
  q: string,
  status: BundleStatusFilter,
  page: number,
  pageSize: number,
) {
  const trimmed = q.trim();
  return useQuery({
    queryKey: catalogKeys.bundles(trimmed, status, page, pageSize),
    queryFn: async () => {
      const result = await apiFetch<BundlesPage>(apiRoutes.bundles, {
        params: { page, pageSize, status, ...(trimmed ? { q: trimmed } : {}) },
      });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    placeholderData: keepPreviousData,
  });
}

/** A single bundle's full composition for the edit screen. */
export function useBundleQuery(bundleId: string) {
  return useQuery({
    queryKey: catalogKeys.bundleDetail(bundleId),
    queryFn: async () => {
      const result = await apiFetch<BundleDetail>(`${apiRoutes.bundles}/${bundleId}`);
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
  });
}

export function useCreateBundleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBundleInput) => {
      const result = await apiFetch<{ id: string }>(apiRoutes.bundles, {
        method: 'POST',
        body: input,
      });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['catalog', 'bundles'] });
    },
  });
}

export function useUpdateBundleMutation(bundleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateBundleInput) => {
      const result = await apiFetch<BundleDetail>(`${apiRoutes.bundles}/${bundleId}`, {
        method: 'PATCH',
        body: input,
      });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: catalogKeys.bundleDetail(bundleId) });
      void queryClient.invalidateQueries({ queryKey: ['catalog', 'bundles'] });
    },
  });
}

export function useDeleteBundleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bundleId: string) => {
      const result = await apiFetch<{ id: string }>(`${apiRoutes.bundles}/${bundleId}`, {
        method: 'DELETE',
      });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['catalog', 'bundles'] });
    },
  });
}

/** Compress an image, presign + PUT it to R2, then save it as the bundle's photo. */
export function useUploadBundleImageMutation(bundleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const blob = await compressImage(file);

      const presign = await apiFetch<{
        uploadUrl: string;
        storageKey: string;
        publicUrl: string;
        expiresAt: string;
      }>(apiRoutes.uploadsPresignImage, {
        method: 'POST',
        body: { mimeType: blob.type, fileSizeBytes: blob.size },
      });
      if (!presign.success) throw new Error(formatApiErrorMessage(presign.error));

      const put = await fetch(presign.data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': blob.type },
        body: blob,
      });
      if (!put.ok) {
        throw new Error('Upload to storage failed. Check the R2 bucket CORS allows PUT.');
      }

      const result = await apiFetch<BundleDetail>(`${apiRoutes.bundles}/${bundleId}/image`, {
        method: 'PATCH',
        body: { imageKey: presign.data.storageKey, imageUrl: presign.data.publicUrl },
      });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: catalogKeys.bundleDetail(bundleId) });
      void queryClient.invalidateQueries({ queryKey: ['catalog', 'bundles'] });
    },
  });
}

/** Remove the bundle's photo (clears the fields + deletes the R2 object). */
export function useRemoveBundleImageMutation(bundleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await apiFetch<BundleDetail>(`${apiRoutes.bundles}/${bundleId}/image`, {
        method: 'DELETE',
      });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: catalogKeys.bundleDetail(bundleId) });
      void queryClient.invalidateQueries({ queryKey: ['catalog', 'bundles'] });
    },
  });
}
