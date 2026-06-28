export const orderKeys = {
  all: ['orders'] as const,
  list: (
    page: number,
    pageSize: number,
    search = '',
    status = '',
    provider = '',
    connectionId = '',
  ) => ['orders', 'list', page, pageSize, search, status, provider, connectionId] as const,
  detail: (id: string) => ['orders', 'detail', id] as const,
  byResi: (trackingNumber: string) => ['orders', 'by-resi', trackingNumber] as const,
};
