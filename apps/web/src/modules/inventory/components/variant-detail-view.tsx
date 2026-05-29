'use client';

import Link from 'next/link';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react';

import { useInventoryHistoryQuery, useVariantDetailQuery } from '../hooks/use-inventory';
import { useInventoryUiStore } from '../store/inventory-ui.store';
import { InventoryEventsTable } from './inventory-events-table';
import { StockMutationModal } from './stock-mutation-modal';
import { StockStatusBadge } from './stock-status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { formatDateTime } from '@/lib/formatters';

export function VariantDetailView({ variantId }: { variantId: string }) {
  const detailQuery = useVariantDetailQuery(variantId);
  const historyQuery = useInventoryHistoryQuery(variantId, { limit: 20 });
  const openMutation = useInventoryUiStore((state) => state.openMutation);
  const mutationTarget = useInventoryUiStore((state) => state.mutationTarget);
  const closeMutation = useInventoryUiStore((state) => state.closeMutation);

  if (detailQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (detailQuery.error || !detailQuery.data) {
    return (
      <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm">
        Variant not found or failed to load.
      </div>
    );
  }

  const variant = detailQuery.data;
  const inventory = variant.inventory;

  const listItem = inventory
    ? {
        variantId: variant.id,
        sku: variant.sku,
        variantName: variant.name,
        productId: variant.productId,
        productName: variant.product?.name ?? '',
        availableStock: inventory.availableStock,
        reservedStock: inventory.reservedStock,
        damagedStock: inventory.damagedStock,
        incomingStock: inventory.incomingStock,
        lowStockThreshold: variant.lowStockThreshold,
        stockHealth: variant.stockHealth,
        lastAdjustedAt: inventory.lastAdjustedAt,
      }
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/dashboard/inventory?tab=variants"
            className="text-muted-foreground inline-flex items-center gap-1 text-sm hover:underline"
          >
            <ArrowLeft className="size-4" />
            Back to variants
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-mono text-xl font-semibold">{variant.sku}</h2>
            <StockStatusBadge status={variant.stockHealth} />
            <Badge variant={variant.isActive ? 'default' : 'secondary'}>
              {variant.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {variant.name}
            {variant.product ? ` · ${variant.product.name}` : ''}
          </p>
        </div>
        {listItem ? (
          <Button onClick={() => openMutation(listItem)}>
            <SlidersHorizontal className="size-4" />
            Mutate stock
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inventory summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Available</p>
              <p className="text-lg font-semibold tabular-nums">{inventory?.availableStock ?? 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Reserved</p>
              <p className="text-lg font-semibold tabular-nums">{inventory?.reservedStock ?? 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Incoming</p>
              <p className="text-lg font-semibold tabular-nums">{inventory?.incomingStock ?? 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Low stock at</p>
              <p className="text-lg font-semibold tabular-nums">{variant.lowStockThreshold}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Product info</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Barcode</span>
              <p className="font-mono">{variant.barcode ?? '—'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Price</span>
              <p>{variant.price}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Alerts</span>
              <p>{variant.alertEnabled ? 'Enabled' : 'Disabled'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Marketplace mappings</span>
              <p className="text-muted-foreground">
                {variant.marketplaceMappingCount} (future sync)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h3 className="font-medium">Recent mutations</h3>
        {historyQuery.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <InventoryEventsTable events={historyQuery.data?.events ?? []} />
        )}
      </div>

      <StockMutationModal
        item={mutationTarget}
        open={Boolean(mutationTarget)}
        onOpenChange={(open) => {
          if (!open) closeMutation();
        }}
      />
    </div>
  );
}
