export type { AppErrorCode } from '@/lib/errors';
export type { ApiResult, FetchOptions } from '@/lib/api';

export interface PaginatedMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginatedMeta;
}

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; errors?: Record<string, string[] | undefined> };
