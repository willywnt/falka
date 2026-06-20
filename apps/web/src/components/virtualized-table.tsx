'use client';

import { Fragment, useRef, type ReactNode, type RefObject } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

import { Table, TableBody } from '@/components/ui/table';
import { cn } from '@/lib/utils';

/** Props a virtualized row must spread onto its `<TableRow>` so heights can be measured. */
export type VirtualRowProps = {
  ref?: (el: HTMLTableRowElement | null) => void;
  'data-index'?: number;
};

type VirtualizedTableProps<T> = {
  items: T[];
  getKey: (item: T, index: number) => string | number;
  /** Render one `<TableRow>`; spread `rowProps` onto it (no-op when not virtualized). */
  renderRow: (item: T, rowProps: VirtualRowProps) => ReactNode;
  /** The `<TableHeader>…</TableHeader>` block. */
  header: ReactNode;
  /** Total column count — used to size the virtualization spacer rows. */
  colSpan: number;
  estimateRowHeight?: number;
  overscan?: number;
  /** Turn virtualization on/off. Default: on. Off renders every row (fine for short lists). */
  virtualized?: boolean;
  /** Classes for the scroll container (e.g. `max-h-[55vh]`). */
  containerClassName?: string;
  className?: string;
};

/**
 * A bordered, scrollable table that OPTIONALLY virtualizes its rows (via
 * @tanstack/react-virtual) so it can render thousands of rows cheaply. Keeps the
 * semantic `<table>` (column alignment intact) using top/bottom spacer rows; use a
 * fixed table layout + column widths for stable columns while scrolling. Set
 * `virtualized={false}` (or gate on row count) to render normally for small lists.
 */
export function VirtualizedTable<T>({
  items,
  getKey,
  renderRow,
  header,
  colSpan,
  estimateRowHeight = 52,
  overscan = 12,
  virtualized = true,
  containerClassName,
  className,
}: VirtualizedTableProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={scrollRef} className={cn('overflow-auto rounded-xl border', containerClassName)}>
      <Table className={className}>
        {header}
        {virtualized ? (
          <VirtualBody
            scrollRef={scrollRef}
            items={items}
            getKey={getKey}
            renderRow={renderRow}
            colSpan={colSpan}
            estimateRowHeight={estimateRowHeight}
            overscan={overscan}
          />
        ) : (
          <TableBody>
            {items.map((item, index) => (
              <Fragment key={getKey(item, index)}>{renderRow(item, {})}</Fragment>
            ))}
          </TableBody>
        )}
      </Table>
    </div>
  );
}

function VirtualBody<T>({
  scrollRef,
  items,
  getKey,
  renderRow,
  colSpan,
  estimateRowHeight,
  overscan,
}: {
  scrollRef: RefObject<HTMLDivElement | null>;
  items: T[];
  getKey: (item: T, index: number) => string | number;
  renderRow: (item: T, rowProps: VirtualRowProps) => ReactNode;
  colSpan: number;
  estimateRowHeight: number;
  overscan: number;
}) {
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateRowHeight,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const first = virtualItems[0];
  const last = virtualItems[virtualItems.length - 1];
  const paddingTop = first ? first.start : 0;
  const paddingBottom = last ? virtualizer.getTotalSize() - last.end : 0;

  return (
    <TableBody>
      {paddingTop > 0 ? (
        <tr aria-hidden>
          <td colSpan={colSpan} style={{ height: paddingTop }} />
        </tr>
      ) : null}
      {virtualItems.map((virtualRow) => {
        const item = items[virtualRow.index];
        if (item === undefined) return null;
        return (
          <Fragment key={getKey(item, virtualRow.index)}>
            {renderRow(item, {
              ref: virtualizer.measureElement,
              'data-index': virtualRow.index,
            })}
          </Fragment>
        );
      })}
      {paddingBottom > 0 ? (
        <tr aria-hidden>
          <td colSpan={colSpan} style={{ height: paddingBottom }} />
        </tr>
      ) : null}
    </TableBody>
  );
}
