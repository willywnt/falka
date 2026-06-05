export const purchaseOrderKeys = {
  all: ['purchase-orders'] as const,
  list: ['purchase-orders', 'list'] as const,
  detail: (id: string) => ['purchase-orders', 'detail', id] as const,
  variants: (q: string) => ['purchase-orders', 'variants', q] as const,
};
