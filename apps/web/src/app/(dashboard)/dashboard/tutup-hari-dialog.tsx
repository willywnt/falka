'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { format, subDays } from 'date-fns';
import { ChevronRight, Copy, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

import { ErrorState } from '@/components/error-state';
import { NumberDelta } from '@/components/number-delta';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrdersQuery } from '@/modules/orders/hooks/use-orders';
import { useProfitReportQuery } from '@/modules/reporting/hooks/use-reporting';
import type { ProfitBySku, ProfitMetrics } from '@/modules/reporting/types';
import { useReturnsQuery } from '@/modules/returns/hooks/use-returns';
import { formatCurrency } from '@/lib/formatters';

/** Margin % for display — same rendering as the profit report ('—' when unknown). */
function formatPct(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)}%`;
}

function recapDateLabel(): string {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

/** Plain-text recap for WhatsApp/clipboard — only numbers the profit report already computed. */
function buildRecapText(summary: ProfitMetrics, topSku: ProfitBySku | undefined): string {
  const lines = [
    `Rekap toko — ${recapDateLabel()}`,
    `Omzet (net): ${formatCurrency(summary.grossRevenue)}`,
    `Unit terjual: ${summary.unitsSold}`,
    `Margin kotor: ${formatPct(summary.grossMarginPct)}`,
  ];
  if (topSku) lines.push(`SKU teratas: ${topSku.name}`);
  lines.push('— dikirim dari Falka');
  return lines.join('\n');
}

/**
 * "Tutup hari" — a 2-minute end-of-day ritual: today's numbers vs kemarin, what
 * carries over to tomorrow, and a WhatsApp-ready recap. Everything comes from
 * existing queries (profit report + the same orders/returns counts the Briefing
 * warms) — no invented metrics.
 */
export function TutupHariDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tutup hari</DialogTitle>
          <DialogDescription>
            Rekap singkat sebelum kamu tutup toko — {recapDateLabel()}.
          </DialogDescription>
        </DialogHeader>
        <TutupHariBody />
      </DialogContent>
    </Dialog>
  );
}

/** Mounted only while the dialog is open (Radix unmounts closed content), so the queries run on demand. */
function TutupHariBody() {
  const now = new Date();
  const todayParam = format(now, 'yyyy-MM-dd');
  const yesterdayParam = format(subDays(now, 1), 'yyyy-MM-dd');

  const todayReport = useProfitReportQuery({ from: todayParam, to: todayParam, groupBy: 'day' });
  const yesterdayReport = useProfitReportQuery({
    from: yesterdayParam,
    to: yesterdayParam,
    groupBy: 'day',
  });
  // Same keys the home Briefing warms — page 1 / size 1, only meta.total is read.
  const paidOrders = useOrdersQuery(1, 1, { status: 'PAID' });
  const pendingReturns = useReturnsQuery('PENDING', 1, 1);

  const isLoading =
    todayReport.isPending ||
    yesterdayReport.isPending ||
    paidOrders.isPending ||
    pendingReturns.isPending;
  const hasError =
    todayReport.isError || yesterdayReport.isError || paidOrders.isError || pendingReturns.isError;

  function retryFailed() {
    if (todayReport.isError) void todayReport.refetch();
    if (yesterdayReport.isError) void yesterdayReport.refetch();
    if (paidOrders.isError) void paidOrders.refetch();
    if (pendingReturns.isError) void pendingReturns.refetch();
  }

  if (isLoading) return <TutupHariSkeleton />;

  if (hasError) {
    return <ErrorState title="Gagal memuat rekap hari ini" onRetry={retryFailed} />;
  }

  const report = todayReport.data;
  const yesterdaySummary = yesterdayReport.data?.summary;
  const paidCount = paidOrders.data?.meta.total;
  const pendingReturnCount = pendingReturns.data?.meta.total;
  if (!report || !yesterdaySummary || paidCount === undefined || pendingReturnCount === undefined) {
    return <TutupHariSkeleton />;
  }

  const summary = report.summary;
  const revenueDelta = Number(summary.grossRevenue) - Number(yesterdaySummary.grossRevenue);
  const topSku = report.topSku[0];

  function shareToWhatsApp() {
    const text = buildRecapText(summary, topSku);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }

  async function copyRecap() {
    try {
      await navigator.clipboard.writeText(buildRecapText(summary, topSku));
      toast.success('Rekap disalin — tinggal tempel di WA.');
    } catch {
      toast.error('Gagal menyalin — coba bagikan langsung ke WhatsApp.');
    }
  }

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <p className="eyebrow text-muted-foreground">Hari ini</p>
        <div className="space-y-1 rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Omzet (net)</p>
          <p className="num-display">{formatCurrency(summary.grossRevenue)}</p>
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <NumberDelta
              value={revenueDelta}
              format={(abs) => formatCurrency(abs)}
              arrow
              showZero
            />
            vs kemarin
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border p-3">
            <p className="text-muted-foreground text-xs">Unit terjual</p>
            <p className="num text-lg font-semibold">{summary.unitsSold}</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-muted-foreground text-xs">Margin kotor</p>
            <p className="num text-lg font-semibold">{formatPct(summary.grossMarginPct)}</p>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <p className="eyebrow text-muted-foreground">Yang terbawa ke besok</p>
        {paidCount === 0 && pendingReturnCount === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-2.5 text-sm">
            Laut tenang — nggak ada yang nyangkut. Selamat istirahat!
          </p>
        ) : (
          <div className="space-y-2">
            {paidCount > 0 ? (
              <CarryOverRow
                count={paidCount}
                label="pesanan dibayar, belum dikirim"
                href={'/dashboard/orders?status=PAID' as Route}
              />
            ) : null}
            {pendingReturnCount > 0 ? (
              <CarryOverRow
                count={pendingReturnCount}
                label="retur menunggu diproses"
                href={'/dashboard/returns?status=PENDING' as Route}
              />
            ) : null}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <p className="eyebrow text-muted-foreground">Rekap WA</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" onClick={shareToWhatsApp}>
            <MessageCircle className="size-4" />
            Bagikan ke WhatsApp
          </Button>
          <Button type="button" variant="outline" onClick={() => void copyRecap()}>
            <Copy className="size-4" />
            Salin teks
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          Angka dari laporan laba (net, retur sudah dihitung).
        </p>
      </section>
    </div>
  );
}

function CarryOverRow({ count, label, href }: { count: number; label: string; href: Route }) {
  return (
    <Link
      href={href}
      className="hover:bg-muted/50 flex min-h-10 items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="num min-w-7 shrink-0 text-right text-base font-semibold">{count}</span>
        <span className="min-w-0 truncate text-sm">{label}</span>
      </span>
      <ChevronRight className="text-muted-foreground size-4 shrink-0" />
    </Link>
  );
}

function TutupHariSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
}
