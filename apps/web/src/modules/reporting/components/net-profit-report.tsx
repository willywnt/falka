'use client';

import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Coins, LineChart, TrendingUp, Wallet } from 'lucide-react';

import { DateRangePicker } from '@/components/date-range-picker';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { StatCard } from '@/components/stat-card';
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
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { EXPENSE_CATEGORY_LABELS } from '@/modules/finance/types';

import { useNetProfitReportQuery } from '../hooks/use-reporting';
import { rangeToParams } from './report-range-controls';
import type { NetProfitReport as NetProfitReportData, ProfitPeriodGranularity } from '../types';

const GROUP_OPTIONS: { value: ProfitPeriodGranularity; label: string }[] = [
  { value: 'day', label: 'Harian' },
  { value: 'week', label: 'Mingguan' },
  { value: 'month', label: 'Bulanan' },
];

export function NetProfitReport() {
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  // Opex is mostly monthly (sewa/gaji), so a monthly trend is the sensible default here.
  const [groupBy, setGroupBy] = useState<ProfitPeriodGranularity>('month');
  const params = rangeToParams(range, groupBy);
  const { data, isLoading, error, refetch } = useNetProfitReportQuery(params);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <DateRangePicker value={range} onChange={setRange} placeholder="30 hari terakhir" />
        <div className="flex items-center gap-1">
          {GROUP_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={groupBy === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGroupBy(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <ErrorState title="Gagal memuat laporan" onRetry={() => void refetch()} />
      ) : data ? (
        <NetProfitContent data={data} />
      ) : null}
    </div>
  );
}

function NetProfitContent({ data }: { data: NetProfitReportData }) {
  const { summary } = data;
  const netNegative = Number(summary.netProfit) < 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Omzet (net)"
          value={formatCurrency(summary.grossRevenue)}
          icon={Coins}
          tone="sky"
        />
        <StatCard
          label="Laba kotor"
          value={formatCurrency(summary.grossProfit)}
          icon={LineChart}
          tone="primary"
        />
        <StatCard
          label="Biaya operasional"
          value={formatCurrency(summary.operatingExpenses)}
          icon={Wallet}
          tone="amber"
        />
        <StatCard
          label="Laba bersih"
          value={formatCurrency(summary.netProfit)}
          icon={TrendingUp}
          tone={netNegative ? 'rose' : 'emerald'}
          accentClassName={netNegative ? 'text-signed-down' : undefined}
          hint={summary.netMarginPct != null ? `Margin bersih ${summary.netMarginPct}%` : undefined}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Biaya per kategori</CardTitle>
        </CardHeader>
        <CardContent>
          {data.byCategory.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Belum ada biaya"
              description="Catat pengeluaran operasional agar laba bersih terhitung."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.byCategory.map((row) => (
                    <TableRow key={row.category}>
                      <TableCell>{EXPENSE_CATEGORY_LABELS[row.category]}</TableCell>
                      <TableCell className="num text-right font-medium">
                        {formatCurrency(row.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {data.byPeriod.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tren laba bersih</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periode</TableHead>
                    <TableHead className="text-right">Laba kotor</TableHead>
                    <TableHead className="text-right">Biaya</TableHead>
                    <TableHead className="text-right">Laba bersih</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.byPeriod.map((row) => (
                    <TableRow key={row.period}>
                      <TableCell className="num">{row.period}</TableCell>
                      <TableCell className="num text-right">
                        {formatCurrency(row.grossProfit)}
                      </TableCell>
                      <TableCell className="num text-right">
                        {formatCurrency(row.operatingExpenses)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'num text-right font-medium',
                          Number(row.netProfit) < 0 && 'text-signed-down',
                        )}
                      >
                        {formatCurrency(row.netProfit)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
