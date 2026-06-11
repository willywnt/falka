'use client';

import Link from 'next/link';
import { Boxes, Coins, Download, Info, PackageSearch, Warehouse } from 'lucide-react';

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

import { inventoryValuationExportUrl, useInventoryValuationQuery } from '../hooks/use-reporting';
import type { InventoryValuationReport as InventoryValuationData } from '../types';

export function InventoryValuationReport() {
  const { data, isLoading, error, refetch } = useInventoryValuationQuery();

  if (error) {
    return (
      <ErrorState
        title="Gagal memuat nilai stok"
        description={error instanceof Error ? error.message : undefined}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <a href={inventoryValuationExportUrl()} download>
            <Download className="size-4" />
            Ekspor CSV
          </a>
        </Button>
      </div>

      {isLoading || !data ? <ValuationSkeleton /> : <ValuationContent data={data} />}
    </div>
  );
}

function ValuationContent({ data }: { data: InventoryValuationData }) {
  const { summary, byProduct } = data;
  const costUnknownHint =
    summary.costUnknownVariants > 0
      ? `${summary.costUnknownVariants} SKU masih ada stok tapi modalnya belum diisi — nggak ikut dihitung`
      : 'Semua SKU yang masih ada stok sudah ada modalnya';

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total nilai stok"
          value={formatCurrency(summary.totalStockValue)}
          icon={Coins}
          tone="emerald"
          hint="Stok yang ada dihitung pakai modal rata-rata"
        />
        <StatCard
          label="Unit yang ada"
          value={summary.availableUnits.toLocaleString()}
          icon={Warehouse}
          tone="sky"
        />
        <StatCard
          label="SKU bernilai"
          value={summary.valuedVariants.toLocaleString()}
          icon={Boxes}
          tone="violet"
          hint={`dari ${summary.totalVariants.toLocaleString()} total varian`}
        />
        <StatCard
          label="Belum ada modal"
          value={summary.costUnknownVariants.toLocaleString()}
          icon={PackageSearch}
          tone="amber"
          accentClassName={summary.costUnknownVariants > 0 ? 'text-status-warn' : undefined}
          hint={
            <span className="inline-flex items-center gap-1">
              <Info className="size-3" />
              {costUnknownHint}
            </span>
          }
        />
      </div>

      {byProduct.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Konsentrasi nilai stok</CardTitle>
          </CardHeader>
          <CardContent>
            <ValueRankList
              rows={byProduct.slice(0, 12).map((row) => ({
                id: row.productId,
                label: row.productName,
                sublabel: row.category ?? undefined,
                value: Number(row.stockValue),
                flagged: row.costUnknownVariants > 0,
              }))}
              formatValue={(value) => formatCurrency(value)}
            />
            {byProduct.length > 12 ? (
              <p className="text-muted-foreground mt-3 text-xs">
                +{byProduct.length - 12} produk lainnya ada di tabel bawah
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Per produk</CardTitle>
        </CardHeader>
        <CardContent>
          {byProduct.length === 0 ? (
            <EmptyState
              icon={Warehouse}
              title="Belum ada stok"
              description="Begitu produk punya stok dan modalnya sudah diisi, nilainya muncul di sini."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Varian</TableHead>
                  <TableHead className="text-right">Unit</TableHead>
                  <TableHead className="text-right">Nilai stok</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byProduct.map((row) => (
                  <TableRow key={row.productId}>
                    <TableCell>
                      <Link
                        href={`/dashboard/products/${row.productId}`}
                        className="font-medium hover:underline"
                      >
                        {row.productName}
                      </Link>
                      {row.costUnknownVariants > 0 ? (
                        <StatusBadge tone="warn" className="ml-2">
                          {row.costUnknownVariants} tanpa modal
                        </StatusBadge>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {row.category ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground num text-right">
                      {row.variantCount}
                    </TableCell>
                    <TableCell className="num text-right">{row.availableUnits}</TableCell>
                    <TableCell className="num text-right font-medium">
                      {formatCurrency(row.stockValue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function ValuationSkeleton() {
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
