import type { ReturnStatus } from '@prisma/client';

export const returnKeys = {
  all: ['returns'] as const,
  list: (status: ReturnStatus | undefined, page: number, pageSize: number) =>
    ['returns', 'list', status ?? 'all', page, pageSize] as const,
  detail: (id: string) => ['returns', 'detail', id] as const,
};
