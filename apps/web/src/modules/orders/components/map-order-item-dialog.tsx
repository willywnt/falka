'use client';

import { useState } from 'react';
import { Package } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useStockOverviewQuery } from '@/modules/inventory/hooks/use-inventory';

export function MapOrderItemDialog({
  open,
  onOpenChange,
  itemLabel,
  isMapping,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemLabel: string;
  isMapping: boolean;
  onSelect: (variantId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search, 300);
  const { data, isLoading } = useStockOverviewQuery(debounced.trim() || undefined, false);
  const variants = (data ?? []).slice(0, 30);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Match to a product</DialogTitle>
          <DialogDescription className="truncate">{itemLabel}</DialogDescription>
        </DialogHeader>

        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search SKU or variant..."
          autoFocus
        />

        <div className="max-h-72 space-y-1 overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-full" />
            ))
          ) : variants.length === 0 ? (
            <p className="text-muted-foreground p-3 text-sm">No variants found.</p>
          ) : (
            variants.map((variant) => (
              <button
                key={variant.variantId}
                type="button"
                disabled={isMapping}
                onClick={() => onSelect(variant.variantId)}
                className="hover:bg-accent flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors disabled:opacity-50"
              >
                <Package className="text-muted-foreground size-4 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{variant.productName}</span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {variant.variantName} · {variant.sku}
                  </span>
                </span>
                <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                  {variant.availableStock} in stock
                </span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
