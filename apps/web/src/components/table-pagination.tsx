'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { PAGE_SIZE_OPTIONS } from '@/hooks/use-pagination';

type TablePaginationProps = {
  page: number;
  pageSize: number;
  /** Total rows across all pages (server total, or the client array length). */
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: readonly number[];
};

/** Reusable rows-per-page + page navigator. Works for client- or server-paginated tables. */
export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs">
      <div className="text-muted-foreground flex items-center gap-1.5">
        <span>Rows</span>
        <Select
          value={String(pageSize)}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="h-8 w-auto pr-7"
          aria-label="Rows per page"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Select>
      </div>

      <div className="text-muted-foreground flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="whitespace-nowrap tabular-nums">
          {from}–{to} of {total}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
