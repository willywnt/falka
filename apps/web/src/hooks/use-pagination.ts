'use client';

import { useState } from 'react';

/** Page sizes offered by the TablePagination control. */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

/** Pagination metadata returned by a server-paginated list endpoint. */
export type PageMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

/**
 * Page + page-size state for a paginated table. Changing the size resets to page
 * 1 (the current offset is meaningless at a new size). Default size is 10.
 */
export function usePagination(defaultPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(defaultPageSize);

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setPage(1);
  };

  return { page, setPage, pageSize, setPageSize };
}
