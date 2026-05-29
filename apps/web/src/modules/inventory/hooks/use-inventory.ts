'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api/fetch-client';
import { formatApiErrorMessage } from '@/lib/api/format-api-error';
import { apiRoutes } from '@/lib/api/routes';
import type {
  InventoryDetailDto,
  InventoryHistoryResultDto,
  InventoryListItemDto,
  InventoryOverviewDto,
  PaginationMetaDto,
  ProductDetailDto,
  ProductListItemDto,
  ProductVariantDetailDto,
  ProductVariantListItemDto,
  RecentMutationListItemDto,
  StockMutationResultDto,
} from '../types';
import type {
  AdjustStockInput,
  CreateProductInput,
  CreateProductVariantInput,
  ListInventoryHistoryQuery,
  ListProductsQuery,
  ListVariantsQuery,
  ReleaseStockInput,
  ReserveStockInput,
} from '../validators';

type PaginatedResponse<T> = { items: T[]; meta: PaginationMetaDto };

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const inventoryKeys = {
  all: ['inventory'] as const,
  overview: () => ['inventory', 'overview'] as const,
  products: (query: ListProductsQuery) => ['inventory', 'products', query] as const,
  variants: (query: ListVariantsQuery) => ['inventory', 'variants', query] as const,
  productsSimple: () => ['inventory', 'products', 'simple'] as const,
  inventoryList: () => ['inventory', 'list'] as const,
  variantDetail: (id: string) => ['inventory', 'variant', id] as const,
  inventoryDetail: (variantId: string) => ['inventory', 'detail', variantId] as const,
  history: (variantId: string, query?: ListInventoryHistoryQuery) =>
    ['inventory', 'history', variantId, query ?? {}] as const,
  recentMutations: () => ['inventory', 'recent-mutations'] as const,
};

async function fetchPaginated<T>(url: string): Promise<PaginatedResponse<T>> {
  const result = await apiFetch<T[]>(url);
  if (!result.success) throw new Error(formatApiErrorMessage(result.error));
  return {
    items: result.data,
    meta: (result.meta ?? {
      page: 1,
      pageSize: result.data.length,
      total: result.data.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    }) as PaginationMetaDto,
  };
}

export function useInventoryOverviewQuery() {
  return useQuery({
    queryKey: inventoryKeys.overview(),
    queryFn: async () => {
      const result = await apiFetch<InventoryOverviewDto>(apiRoutes.inventoryOverview);
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    staleTime: 30_000,
  });
}

export function useProductsPaginatedQuery(query: ListProductsQuery) {
  return useQuery({
    queryKey: inventoryKeys.products(query),
    queryFn: () =>
      fetchPaginated<ProductListItemDto>(
        `${apiRoutes.inventoryProducts}${buildQueryString(query as Record<string, string | number | undefined>)}`,
      ),
    placeholderData: (prev) => prev,
  });
}

export function useVariantsPaginatedQuery(query: ListVariantsQuery) {
  return useQuery({
    queryKey: inventoryKeys.variants(query),
    queryFn: () =>
      fetchPaginated<ProductVariantListItemDto>(
        `${apiRoutes.inventoryVariants}${buildQueryString(query as Record<string, string | number | undefined>)}`,
      ),
    placeholderData: (prev) => prev,
  });
}

/** Simple product list for modals (first page, larger size) */
export function useProductsQuery() {
  return useQuery({
    queryKey: inventoryKeys.productsSimple(),
    queryFn: async () => {
      const result = await fetchPaginated<ProductListItemDto>(
        `${apiRoutes.inventoryProducts}?page=1&pageSize=100`,
      );
      return result.items;
    },
  });
}

export function useInventoryListQuery() {
  return useQuery({
    queryKey: inventoryKeys.inventoryList(),
    queryFn: async () => {
      const result = await apiFetch<InventoryListItemDto[]>(apiRoutes.inventory);
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
  });
}

export function useVariantDetailQuery(variantId: string | null) {
  return useQuery({
    queryKey: inventoryKeys.variantDetail(variantId ?? 'unknown'),
    queryFn: async () => {
      const result = await apiFetch<ProductVariantDetailDto>(
        `${apiRoutes.inventoryVariants}/${variantId}`,
      );
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    enabled: Boolean(variantId),
  });
}

export function useInventoryHistoryQuery(
  variantId: string | null,
  query: ListInventoryHistoryQuery = { limit: 50 },
) {
  return useQuery({
    queryKey: inventoryKeys.history(variantId ?? 'unknown', query),
    queryFn: async () => {
      const result = await apiFetch<InventoryHistoryResultDto>(
        `${apiRoutes.inventoryVariants}/${variantId}/history${buildQueryString(query as Record<string, string | number | undefined>)}`,
      );
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    enabled: Boolean(variantId),
  });
}

export function useRecentMutationsQuery(limit = 10) {
  return useQuery({
    queryKey: inventoryKeys.recentMutations(),
    queryFn: async () => {
      const result = await apiFetch<RecentMutationListItemDto[]>(
        `${apiRoutes.inventoryRecentMutations}?limit=${limit}`,
      );
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    staleTime: 15_000,
  });
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProductInput) => {
      const result = await apiFetch<ProductDetailDto>(apiRoutes.inventoryProducts, {
        method: 'POST',
        body: input,
      });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: inventoryKeys.all }),
  });
}

export function useCreateVariantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProductVariantInput) => {
      const result = await apiFetch<ProductVariantDetailDto>(apiRoutes.inventoryVariants, {
        method: 'POST',
        body: input,
      });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: inventoryKeys.all }),
  });
}

function useStockMutation(invalidateVariantId: (variables: { variantId: string }) => void) {
  const queryClient = useQueryClient();
  return {
    onSuccess: (_data: StockMutationResultDto, variables: { variantId: string }) => {
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      invalidateVariantId(variables);
    },
  };
}

export function useAdjustStockMutation() {
  const queryClient = useQueryClient();
  const callbacks = useStockMutation(({ variantId }) => {
    void queryClient.invalidateQueries({ queryKey: inventoryKeys.history(variantId) });
    void queryClient.invalidateQueries({ queryKey: inventoryKeys.variantDetail(variantId) });
  });

  return useMutation({
    mutationFn: async ({ variantId, ...input }: AdjustStockInput & { variantId: string }) => {
      const result = await apiFetch<StockMutationResultDto>(
        `${apiRoutes.inventoryVariants}/${variantId}/adjust`,
        { method: 'POST', body: input },
      );
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    ...callbacks,
  });
}

export function useReserveStockMutation() {
  const queryClient = useQueryClient();
  const callbacks = useStockMutation(({ variantId }) => {
    void queryClient.invalidateQueries({ queryKey: inventoryKeys.history(variantId) });
  });

  return useMutation({
    mutationFn: async ({ variantId, ...input }: ReserveStockInput & { variantId: string }) => {
      const result = await apiFetch<StockMutationResultDto>(
        `${apiRoutes.inventoryVariants}/${variantId}/reserve`,
        { method: 'POST', body: input },
      );
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    ...callbacks,
  });
}

export function useReleaseStockMutation() {
  const queryClient = useQueryClient();
  const callbacks = useStockMutation(({ variantId }) => {
    void queryClient.invalidateQueries({ queryKey: inventoryKeys.history(variantId) });
  });

  return useMutation({
    mutationFn: async ({ variantId, ...input }: ReleaseStockInput & { variantId: string }) => {
      const result = await apiFetch<StockMutationResultDto>(
        `${apiRoutes.inventoryVariants}/${variantId}/release`,
        { method: 'POST', body: input },
      );
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    ...callbacks,
  });
}
