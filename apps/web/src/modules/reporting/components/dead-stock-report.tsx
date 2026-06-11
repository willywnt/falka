'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Boxes, Coins, Download, Hourglass, PackageX, Snowflake } from 'lucide-react';

import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
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
import { ValueRankList } from '@/components/charts/bars';
import { formatCurrency } from '@/lib/formatters';
import { formatProductVariantLabel } from '@/lib/variant-label';

import { deadStockExportUrl, useDeadStockQuery } from '../hooks/use-reporting';
import type { DeadStockReport as DeadStockData, DeadStockRow } from '../types';

const STALE_OPTIONS = [30, 60, 90, 180] as const;

export function DeadStockReport() {
  const [staleDays, setStaleDays] = useState<number>(60);
  const { data, isLoading, error, refetch } = useDeadStockQuery(staleDays);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Nggak laku selama</span>
          <div className="flex items-center gap-1">
            {STALE_OPTIONS.map((days) => (
              <Button
                key={days}
                variant={staleDays === days ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStaleDays(days)}
              >
                {days} hari
              </Button>
            ))}
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={deadStockExportUrl(staleDays)} download>
            <Download className="size-4" />
            Ekspor CSV
          </a>
        </Button>
      </div>

      {error ? (
        <ErrorState
          title="Gagal memuat stok mati"
          description={error instanceof Error ? error.message : undefined}
          onRetry={() => void refetch()}
        />
      ) : isLoading || !data ? (
        <DeadStockSkeleton />
      ) : (
        <DeadStockContent data={data} staleDays={staleDays} />
      )}
    </div>
  );
}

function lastSoldLabel(row: DeadStockRow): string {
  if (row.daysSinceLastSale == null) return 'Belum pernah';
  return `${row.daysSinceLastSale} hari lalu`;
}

/** "Produk - grup · varian" — the row carries `variantName`, so adapt it to LabelledVariant. */
function productVariantLabel(row: DeadStockRow): string {
  return formatProductVariantLabel(row.productName, {
    variantGroup: row.variantGroup,
    name: row.variantName,
  });
}

function DeadStockContent({ data, staleDays }: { data: DeadStockData; staleDays: number }) {
  const { summary, rows } = data;

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-2">
          <EmptyState
            icon={Snowflake}
            title="Nggak ada stok mati 🎉"
            description={`Semua SKU yang masih ada stoknya laku dalam ${staleDays} hari terakhir. Modal kamu muter.`}
          />
        </CardContent>
      </Card>
    );
  }

  const costUnknownHint =
    summary.costUnknownCount > 0
      ? `${summary.costUnknownCount} SKU belum diisi modalnya — nggak ikut dihitung`
      : 'Semua SKU mati sudah ada modalnya';

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="SKU stok mati"
          value={summary.deadSkuCount.toLocaleString()}
          icon={PackageX}
          tone="amber"
          accentClassName={summary.deadSkuCount > 0 ? 'text-status-warn' : undefined}
          hint={`Nggak laku ≥ ${staleDays} hari`}
        />
        <StatCard
          label="Modal nyangkut"
          value={formatCurrency(summary.stuckValue)}
          icon={Coins}
          tone="amber"
          hint={costUnknownHint}
        />
        <StatCard
          label="Belum pernah laku"
          value={summary.neverSoldCount.toLocaleString()}
          icon={Hourglass}
          tone="violet"
          hint="Stok yang nggak pernah kejual sama sekali"
        />
        <StatCard
          label="Unit menganggur"
          value={summary.idleUnits.toLocaleString()}
          icon={Boxes}
          tone="sky"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Modal paling banyak nyangkut</CardTitle>
        </CardHeader>
        <CardContent>
          <ValueRankList
            rows={rows.slice(0, 12).map((row) => ({
              id: row.variantId,
              label: productVariantLabel(row),
              sublabel: row.sku,
              value: Number(row.stockValue),
              flagged: row.cost == null,
            }))}
            formatValue={(value) => formatCurrency(value)}
          />
          {rows.length > 12 ? (
            <p className="text-muted-foreground mt-3 text-xs">
              +{rows.length - 12} SKU lainnya ada di tabel bawah
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daftar stok mati</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Cards on phones, table on sm+. */}
          <ul className="space-y-3 sm:hidden">
            {rows.map((row) => (
              <li key={row.variantId} className="border-border/70 rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/dashboard/products/${row.productId}`}
                    className="min-w-0 font-medium hover:underline"
                  >
                    {productVariantLabel(row)}
                  </Link>
                  {row.status === 'NEVER_SOLD' ? (
                    <StatusBadge tone="neutral">Belum pernah</StatusBadge>
                  ) : null}
                </div>
                <p className="text-muted-foreground mt-0.5 text-xs">{row.sku}</p>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground text-xs">Stok</dt>
                    <dd className="num">{row.available}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Nilai nyangkut</dt>
                    <dd className="num font-medium">{formatCurrency(row.stockValue)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Modal/unit</dt>
                    <dd className="num">{row.cost == null ? '—' : formatCurrency(row.cost)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Terakhir laku</dt>
                    <dd className="num">{lastSoldLabel(row)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Stok</TableHead>
                  <TableHead className="text-right">Modal/unit</TableHead>
                  <TableHead className="text-right">Nilai nyangkut</TableHead>
                  <TableHead className="text-right">Terakhir laku</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.variantId}>
                    <TableCell>
                      <Link
                        href={`/dashboard/products/${row.productId}`}
                        className="font-medium hover:underline"
                      >
                        {productVariantLabel(row)}
                      </Link>
                      {row.status === 'NEVER_SOLD' ? (
                        <StatusBadge tone="neutral" className="ml-2">
                          Belum pernah
                        </StatusBadge>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{row.sku}</TableCell>
                    <TableCell className="num text-right">{row.available}</TableCell>
                    <TableCell className="text-muted-foreground num text-right">
                      {row.cost == null ? '—' : formatCurrency(row.cost)}
                    </TableCell>
                    <TableCell className="num text-right font-medium">
                      {formatCurrency(row.stockValue)}
                    </TableCell>
                    <TableCell className="text-muted-foreground num text-right">
                      {lastSoldLabel(row)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function DeadStockSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
