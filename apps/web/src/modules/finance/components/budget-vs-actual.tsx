'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Target } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { useHasPermission } from '@/modules/users/hooks/use-org';

import { useBudgetReportQuery } from '../hooks/use-budgets';
import { EXPENSE_CATEGORY_LABELS, type BudgetReport } from '../types';
import { BudgetFormDialog } from './budget-form-dialog';

function currentMonthLabel(): string {
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date());
}

export function BudgetVsActual() {
  const month = format(new Date(), 'yyyy-MM');
  const { data, isLoading, error, refetch } = useBudgetReportQuery(month);
  const { allowed: canManage } = useHasPermission('finance.manage');
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Card className="gap-4 py-4">
      <CardHeader className="flex flex-col gap-2 px-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="text-muted-foreground size-4" />
            Anggaran vs realisasi · {currentMonthLabel()}
          </CardTitle>
          <CardDescription className="text-xs">
            Anggaran bulanan per kategori vs pengeluaran bulan ini.
          </CardDescription>
        </div>
        {canManage ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="sm:shrink-0"
          >
            Atur anggaran
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="px-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error || !data ? (
          <ErrorState
            title="Gagal memuat anggaran"
            onRetry={() => void refetch()}
            className="p-5"
          />
        ) : data.rows.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Belum ada anggaran"
            description="Tetapkan anggaran bulanan per kategori untuk memantau overspend tiap bulan."
            action={
              canManage ? (
                <Button onClick={() => setDialogOpen(true)}>Atur anggaran</Button>
              ) : undefined
            }
          />
        ) : (
          <BudgetTable report={data} />
        )}
      </CardContent>

      <BudgetFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </Card>
  );
}

function BudgetTable({ report }: { report: BudgetReport }) {
  const overCount = report.rows.filter((row) => row.over).length;

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Anggaran</TableHead>
              <TableHead className="text-right">Realisasi</TableHead>
              <TableHead className="text-right">Sisa</TableHead>
              <TableHead className="w-40">Terpakai</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.rows.map((row) => {
              const remainingNegative = Number(row.remaining) < 0;
              return (
                <TableRow key={row.category}>
                  <TableCell>{EXPENSE_CATEGORY_LABELS[row.category]}</TableCell>
                  <TableCell className="num text-right">{formatCurrency(row.budget)}</TableCell>
                  <TableCell className="num text-right font-medium">
                    {formatCurrency(row.actual)}
                  </TableCell>
                  <TableCell
                    className={cn('num text-right', remainingNegative && 'text-signed-down')}
                  >
                    {formatCurrency(row.remaining)}
                  </TableCell>
                  <TableCell>
                    <UsageBar pctUsed={row.pctUsed} over={row.over} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-muted-foreground text-xs">
        Total anggaran{' '}
        <span className="num text-foreground font-medium">
          {formatCurrency(report.totalBudget)}
        </span>{' '}
        · realisasi{' '}
        <span className="num text-foreground font-medium">
          {formatCurrency(report.totalActual)}
        </span>
        {overCount > 0 ? ` · ${overCount} kategori lewat anggaran` : ''}
      </p>
    </div>
  );
}

function UsageBar({ pctUsed, over }: { pctUsed: number | null; over: boolean }) {
  const pct = pctUsed ?? 0;
  return (
    <div className="flex items-center gap-2">
      <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
        <div
          className={cn(
            'h-full rounded-full',
            over ? 'bg-destructive' : pct >= 80 ? 'bg-highlight' : 'bg-primary',
          )}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
      <span className={cn('num w-10 text-right text-xs', over && 'text-signed-down')}>
        {pctUsed != null ? `${Math.round(pctUsed)}%` : '—'}
      </span>
    </div>
  );
}
