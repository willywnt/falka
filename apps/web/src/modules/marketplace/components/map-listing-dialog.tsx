'use client';

import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useStockOverviewQuery } from '@/modules/inventory/hooks/use-inventory';

export function MapListingDialog({
  open,
  onOpenChange,
  onSelect,
  isMapping,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (variantId: string) => void;
  isMapping?: boolean;
}) {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useStockOverviewQuery(search.trim() || undefined, false);
  const variants = data ?? [];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setSearch('');
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Map to a variant</DialogTitle>
          <DialogDescription>Pick the internal variant this listing represents.</DialogDescription>
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
              <Skeleton key={index} className="h-12 w-full" />
            ))
          ) : variants.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">No variants found.</p>
          ) : (
            variants.map((variant) => (
              <button
                key={variant.variantId}
                type="button"
                disabled={isMapping}
                onClick={() => onSelect(variant.variantId)}
                className="hover:bg-muted/50 flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm disabled:opacity-50"
              >
                <div>
                  <div className="font-medium">{variant.productName}</div>
                  <div className="text-muted-foreground text-xs">
                    {variant.variantName} · {variant.sku}
                  </div>
                </div>
                <span className="text-muted-foreground text-xs tabular-nums">
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
