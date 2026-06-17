export const supplierKeys = {
  all: ['suppliers'] as const,
  list: ['suppliers', 'list'] as const,
  options: ['suppliers', 'options'] as const,
  detail: (id: string) => ['suppliers', 'detail', id] as const,
};
