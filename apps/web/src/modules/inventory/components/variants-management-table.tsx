'use client';

import Link from 'next/link';

import type { ProductVariantListItemDto } from '../types';
import { StockStatusBadge } from './stock-status-badge';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { formatDateTime } from '@/lib/formatters';

export function VariantsManagementTable({
  variants,
  selectedIds,
  onToggleSelect,
  onSelectAll,
}: {
  variants: ProductVariantListItemDto[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
}) {
  const allSelected = variants.length > 0 && variants.every((v) => selectedIds.includes(v.id));

  if (variants.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="font-medium">No variants match your filters</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Search by exact SKU or barcode for fast lookup.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() =>
                  onSelectAll(allSelected ? [] : variants.map((variant) => variant.id))
                }
                aria-label="Select all variants"
                className="size-4 rounded border"
              />
            </TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Available</TableHead>
            <TableHead className="text-right">Reserved</TableHead>
            <TableHead className="text-right">Incoming</TableHead>
            <TableHead>Stock status</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {variants.map((variant) => (
            <TableRow key={variant.id}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(variant.id)}
                  onChange={() => onToggleSelect(variant.id)}
                  aria-label={`Select ${variant.sku}`}
                  className="size-4 rounded border"
                />
              </TableCell>
              <TableCell>
                <Link
                  href={`/dashboard/inventory/variants/${variant.id}`}
                  className="font-mono text-sm font-medium hover:underline"
                >
                  {variant.sku}
                </Link>
                {variant.barcode ? (
                  <div className="text-muted-foreground text-xs">{variant.barcode}</div>
                ) : null}
              </TableCell>
              <TableCell>
                <div>{variant.productName}</div>
                {variant.productBrand ? (
                  <div className="text-muted-foreground text-xs">{variant.productBrand}</div>
                ) : null}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {variant.availableStock}
              </TableCell>
              <TableCell className="text-right tabular-nums">{variant.reservedStock}</TableCell>
              <TableCell className="text-right tabular-nums">{variant.incomingStock}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <StockStatusBadge status={variant.stockHealth} />
                  {variant.alertEnabled && variant.stockHealth === 'low_stock' ? (
                    <span className="text-muted-foreground text-xs">
                      Threshold: {variant.lowStockThreshold}
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {variant.lastUpdated ? formatDateTime(variant.lastUpdated) : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
