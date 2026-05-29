'use client';

import Link from 'next/link';
import { AlertTriangle, Boxes, Package, TrendingUp } from 'lucide-react';

import { useInventoryOverviewQuery, useRecentMutationsQuery } from '../hooks/use-inventory';
import type { InventoryOverviewDto } from '../types';
import { INVENTORY_EVENT_TYPE_LABELS } from '../types';
import { StockStatusBadge } from './stock-status-badge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { formatDateTime } from '@/lib/formatters';

function OverviewCard({
  title,
  value,
  hint,
  icon: Icon,
  tone = 'default',
}: {
  title: string;
  value: string | number;
  hint?: string;
  icon: typeof Package;
  tone?: 'default' | 'warning' | 'danger';
}) {
  const toneClass =
    tone === 'warning'
      ? 'text-amber-600 dark:text-amber-400'
      : tone === 'danger'
        ? 'text-red-600 dark:text-red-400'
        : '';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
        <Icon className={cnIcon(toneClass)} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</div>
        {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function cnIcon(className: string) {
  return `size-4 ${className || 'text-muted-foreground'}`;
}

function healthSummary(overview: InventoryOverviewDto) {
  const total = overview.variantCount || 1;
  const healthyPct = Math.round((overview.healthyCount / total) * 100);
  if (overview.outOfStockCount > 0)
    return { label: 'Needs attention', status: 'out_of_stock' as const };
  if (overview.lowStockCount > 0) return { label: 'Low stock items', status: 'low_stock' as const };
  return { label: `${healthyPct}% healthy`, status: 'healthy' as const };
}

export function InventoryOverviewPanel({
  onViewLowStock,
  onViewTimeline,
}: {
  onViewLowStock: () => void;
  onViewTimeline: () => void;
}) {
  const overviewQuery = useInventoryOverviewQuery();
  const mutationsQuery = useRecentMutationsQuery(8);

  if (overviewQuery.isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  if (overviewQuery.error || !overviewQuery.data) {
    return (
      <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm">
        Failed to load inventory overview.
      </div>
    );
  }

  const overview = overviewQuery.data;
  const health = healthSummary(overview);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OverviewCard title="Products" value={overview.productCount} icon={Package} />
        <OverviewCard title="SKUs" value={overview.variantCount} icon={Boxes} />
        <OverviewCard
          title="Available units"
          value={overview.totalAvailableUnits.toLocaleString()}
          icon={TrendingUp}
        />
        <OverviewCard
          title="Low stock"
          value={overview.lowStockCount}
          hint={`${overview.outOfStockCount} out of stock`}
          icon={AlertTriangle}
          tone={overview.lowStockCount > 0 ? 'warning' : 'default'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Inventory health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <StockStatusBadge status={health.status} />
              <span className="text-muted-foreground text-sm">{health.label}</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Healthy</span>
                <span className="font-medium tabular-nums">{overview.healthyCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Low stock</span>
                <button
                  type="button"
                  className="font-medium tabular-nums hover:underline"
                  onClick={onViewLowStock}
                >
                  {overview.lowStockCount}
                </button>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Out of stock</span>
                <span className="font-medium tabular-nums">{overview.outOfStockCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mutations (24h)</span>
                <span className="font-medium tabular-nums">{overview.mutationsLast24h}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent mutations</CardTitle>
            <button
              type="button"
              className="text-primary text-sm hover:underline"
              onClick={onViewTimeline}
            >
              View timeline
            </button>
          </CardHeader>
          <CardContent>
            {mutationsQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (mutationsQuery.data?.length ?? 0) === 0 ? (
              <p className="text-muted-foreground text-sm">No mutations recorded yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mutationsQuery.data?.map((mutation) => (
                    <TableRow key={mutation.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/inventory/variants/${mutation.variantId}`}
                          className="font-mono text-sm hover:underline"
                        >
                          {mutation.sku}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {INVENTORY_EVENT_TYPE_LABELS[mutation.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {mutation.previousStock} → {mutation.newStock}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDateTime(mutation.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
