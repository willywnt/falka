'use client';

import { SlidersHorizontal } from 'lucide-react';

import type { InventoryListItemDto } from '../types';
import { StockStatusBadge } from './stock-status-badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { formatDateTime } from '@/lib/formatters';

export function InventoryTable({
  items,
  onMutate,
  onViewHistory,
}: {
  items: InventoryListItemDto[];
  onMutate: (item: InventoryListItemDto) => void;
  onViewHistory?: (item: InventoryListItemDto) => void;
}) {
  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Variant</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Available</TableHead>
            <TableHead className="text-right">Reserved</TableHead>
            <TableHead className="text-right">Damaged</TableHead>
            <TableHead className="text-right">Incoming</TableHead>
            <TableHead>Last adjusted</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.variantId}>
              <TableCell className="font-mono text-sm font-medium">{item.sku}</TableCell>
              <TableCell>{item.variantName}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{item.productName}</TableCell>
              <TableCell>
                <StockStatusBadge status={item.stockHealth} />
              </TableCell>
              <TableCell className="text-right font-medium">{item.availableStock}</TableCell>
              <TableCell className="text-right">{item.reservedStock}</TableCell>
              <TableCell className="text-right">{item.damagedStock}</TableCell>
              <TableCell className="text-right">{item.incomingStock}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {item.lastAdjustedAt ? formatDateTime(item.lastAdjustedAt) : '—'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {onViewHistory ? (
                    <Button variant="ghost" size="sm" onClick={() => onViewHistory(item)}>
                      History
                    </Button>
                  ) : null}
                  <Button variant="ghost" size="sm" onClick={() => onMutate(item)}>
                    <SlidersHorizontal className="size-4" />
                    Mutate
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
