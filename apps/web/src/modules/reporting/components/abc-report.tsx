'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Banknote, Download, Layers } from 'lucide-react';

import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { StatCard, type StatTone } from '@/components/stat-card';
import { StatusBadge, type StatusTone } from '@/components/status-badge';
import { DateRangePicker } from '@/components/date-range-picker';
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
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

import { formatPct } from '../utils/format';
import { abcExportUrl, useAbcAnalysisQuery, type ProfitReportParams } from '../hooks/use-reporting';
import type { AbcClass, AbcReport as AbcData } from '../types';

/** Each Pareto class's label + colour, in one place. */
const CLASS_META: Record<AbcClass, { title: string; tone: StatTone; badge: StatusTone }> = {
  A: { title: 'Kelas A', tone: 'emerald', badge: 'ok' },
  B: { title: 'Kelas B', tone: 'sky', badge: 'info' },
  C: { title: 'Kelas C', tone: 'muted', badge: 'neutral' },
};

export function AbcReport() {
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const params: ProfitReportParams = {
    groupBy: 'day',
    ...(range?.from ? { from: format(range.from, 'yyyy-MM-dd') } : {}),
    ...(range?.to ? { to: format(range.to, 'yyyy-MM-dd') } : {}),
  };

  const { data, isLoading, error, refetch } = useAbcAnalysisQuery(params);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DateRangePicker value={range} onChange={setRange} placeholder="30 hari terakhir" />
        <Button variant="outline" size="sm" asChild>
          <a href={abcExportUrl(params)} download>
            <Download className="size-4" />
            Ekspor CSV
          </a>
        </Button>
      </div>

      {error ? (
        <ErrorState
          title="Gagal memuat analisis ABC"
          description={error instanceof Error ? error.message : undefined}
          onRetry={() => void refetch()}
        />
      ) : isLoading || !data ? (
        <AbcSkeleton />
      ) : (
        <AbcContent data={data} />
      )}
    </div>
  );
}

function AbcContent({ data }: { data: AbcData }) {
  if (data.rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-2">
          <EmptyState
            icon={Layers}
            title="Belum ada penjualan di rentang ini"
            description="Begitu ada penjualan kasir atau pesanan terkirim di periode ini, peringkat SKU langsung muncul di sini."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Omzet bersih"
          value={formatCurrency(data.totalRevenue)}
          icon={Banknote}
          tone="primary"
          hint={`${data.rows.length} SKU laku`}
        />
        {data.classes.map((cls) => {
          const meta = CLASS_META[cls.class];
          return (
            <StatCard
              key={cls.class}
              label={meta.title}
              value={`${cls.skuCount.toLocaleString()} SKU`}
              icon={Layers}
              tone={meta.tone}
              hint={`${formatPct(cls.revenueSharePct)} omzet · ${formatCurrency(cls.revenue)}`}
            />
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Peringkat SKU (Pareto)</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Cards on phones, table on sm+. */}
          <ul className="space-y-3 sm:hidden">
            {data.rows.map((row) => {
              const meta = CLASS_META[row.class];
              return (
                <li
                  key={row.variantId ?? row.sku}
                  className="border-border/70 rounded-lg border p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 font-medium">{row.name}</span>
                    <StatusBadge tone={meta.badge}>{row.class}</StatusBadge>
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">{row.sku}</p>
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground text-xs">Omzet</dt>
                      <dd className="num font-medium">{formatCurrency(row.revenue)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs">Unit</dt>
                      <dd className="num">{row.unitsSold}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs">Porsi</dt>
                      <dd className="num">{formatPct(row.revenueSharePct)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs">Kumulatif</dt>
                      <dd className="num">{formatPct(row.cumulativeSharePct)}</dd>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>

          <div className="hidden overflow-x-auto sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead className="text-right">Omzet</TableHead>
                  <TableHead className="text-right">Unit</TableHead>
                  <TableHead className="text-right">Porsi</TableHead>
                  <TableHead className="text-right">Kumulatif</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((row) => {
                  const meta = CLASS_META[row.class];
                  return (
                    <TableRow key={row.variantId ?? row.sku}>
                      <TableCell>
                        <span className="font-medium">{row.name}</span>
                        <span className="text-muted-foreground block text-xs">{row.sku}</span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone={meta.badge}>{row.class}</StatusBadge>
                      </TableCell>
                      <TableCell
                        className={cn(
                          'num text-right font-medium',
                          Number(row.revenue) < 0 && 'text-signed-down',
                        )}
                      >
                        {formatCurrency(row.revenue)}
                      </TableCell>
                      <TableCell className="text-muted-foreground num text-right">
                        {row.unitsSold}
                      </TableCell>
                      <TableCell className="text-muted-foreground num text-right">
                        {formatPct(row.revenueSharePct)}
                      </TableCell>
                      <TableCell className="text-muted-foreground num text-right">
                        {formatPct(row.cumulativeSharePct)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function AbcSkeleton() {
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
