export const purchaseOrderKeys = {
  all: ['purchase-orders'] as const,
  list: ['purchase-orders', 'list'] as const,
  detail: (id: string) => ['purchase-orders', 'detail', id] as const,
  variants: (q: string, page: number, pageSize: number) =>
    ['purchase-orders', 'variants', q, page, pageSize] as const,
};
