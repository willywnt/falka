'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Calculator, Percent } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { formatCurrency } from '@/lib/formatters';
import { useHasPermission } from '@/modules/users/hooks/use-org';

import {
  useDeriveFeesMutation,
  useFeeConfigQuery,
  useUpdateFeeConfigMutation,
} from '../hooks/use-fee-config';
import type { FeeConfig } from '../types';

function currentMonthLabel(): string {
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date());
}

export function FeeConfigPanel() {
  const { data, isLoading, error, refetch } = useFeeConfigQuery();
  const { allowed: canManage } = useHasPermission('finance.manage');

  return (
    <Card className="gap-4 py-4">
      <CardHeader className="gap-1 px-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Percent className="text-muted-foreground size-4" />
          Fee otomatis (estimasi)
        </CardTitle>
        <CardDescription className="text-xs">
          Estimasi fee QRIS &amp; komisi marketplace dari rate yang kamu set (bukan fee asli dari
          channel). &ldquo;Hitung fee bulan ini&rdquo; mencatatnya ke buku, sekali per bulan.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error || !data ? (
          <ErrorState
            title="Gagal memuat konfigurasi fee"
            onRetry={() => void refetch()}
            className="p-5"
          />
        ) : (
          <FeeConfigForm config={data} canManage={canManage} />
        )}
      </CardContent>
    </Card>
  );
}

function FeeConfigForm({ config, canManage }: { config: FeeConfig; canManage: boolean }) {
  const updateConfig = useUpdateFeeConfigMutation();
  const deriveFees = useDeriveFeesMutation();

  const [qrisRate, setQrisRate] = useState(config.qrisFeeRate);
  const [connRates, setConnRates] = useState<Record<string, string>>({});
  const [deriveOpen, setDeriveOpen] = useState(false);

  // Mirror the loaded config into editable local state whenever it changes.
  useEffect(() => {
    setQrisRate(config.qrisFeeRate);
    setConnRates(
      Object.fromEntries(config.connections.map((c) => [c.connectionId, c.commissionRate])),
    );
  }, [config]);

  const qrisChanged = Number(qrisRate || 0) !== Number(config.qrisFeeRate);
  const changedConnections = config.connections.filter(
    (c) => Number(connRates[c.connectionId] ?? '0') !== Number(c.commissionRate),
  );
  const dirty = qrisChanged || changedConnections.length > 0;

  async function handleSave() {
    try {
      await updateConfig.mutateAsync({
        ...(qrisChanged ? { qrisFeeRate: Number(qrisRate || 0) } : {}),
        ...(changedConnections.length > 0
          ? {
              connectionRates: changedConnections.map((c) => ({
                connectionId: c.connectionId,
                commissionRate: Number(connRates[c.connectionId] ?? '0'),
              })),
            }
          : {}),
      });
      toast.success('Rate fee disimpan');
    } catch (saveError) {
      toast.error('Gagal menyimpan rate', {
        description: saveError instanceof Error ? saveError.message : 'Coba lagi.',
      });
    }
  }

  async function handleDerive() {
    const month = format(new Date(), 'yyyy-MM');
    const label = currentMonthLabel();
    try {
      const result = await deriveFees.mutateAsync({ month });
      if (Number(result.totalFee) > 0) {
        const parts: string[] = [];
        if (Number(result.qris.fee) > 0) parts.push(`QRIS ${formatCurrency(result.qris.fee)}`);
        const commission = result.commissions.reduce((sum, c) => sum + Number(c.fee), 0);
        if (commission > 0) parts.push(`komisi ${formatCurrency(commission)}`);
        toast.success(`Fee ${label}: ${formatCurrency(result.totalFee)}`, {
          description: parts.join(' · '),
        });
      } else {
        toast.info(`Belum ada fee untuk ${label}`, {
          description: 'Set rate di atas atau belum ada transaksi bulan ini.',
        });
      }
    } catch (deriveError) {
      toast.error('Gagal menghitung fee', {
        description: deriveError instanceof Error ? deriveError.message : 'Coba lagi.',
      });
    } finally {
      setDeriveOpen(false);
    }
  }

  const hasRate =
    Number(config.qrisFeeRate) > 0 || config.connections.some((c) => Number(c.commissionRate) > 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:max-w-xs">
        <Label htmlFor="qris-fee-rate" className="text-sm">
          Fee QRIS (% dari transaksi QRIS)
        </Label>
        <Input
          id="qris-fee-rate"
          type="number"
          inputMode="decimal"
          min={0}
          max={100}
          step={0.01}
          value={qrisRate}
          disabled={!canManage}
          onChange={(event) => setQrisRate(event.target.value)}
        />
      </div>

      {config.connections.length > 0 ? (
        <div className="space-y-2">
          <p className="eyebrow text-muted-foreground">Komisi per channel (%)</p>
          <div className="space-y-2">
            {config.connections.map((connection) => (
              <div key={connection.connectionId} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{connection.shopName}</div>
                  <div className="text-muted-foreground text-xs capitalize">
                    {connection.provider.toLowerCase()}
                  </div>
                </div>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step={0.01}
                  className="w-28"
                  aria-label={`Komisi ${connection.shopName} persen`}
                  value={connRates[connection.connectionId] ?? ''}
                  disabled={!canManage}
                  onChange={(event) =>
                    setConnRates((prev) => ({
                      ...prev,
                      [connection.connectionId]: event.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Percent}
          title="Belum ada channel marketplace"
          description="Hubungkan toko marketplace untuk mengestimasi komisinya."
        />
      )}

      {canManage ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="outline"
            onClick={() => void handleSave()}
            disabled={!dirty || updateConfig.isPending}
          >
            {updateConfig.isPending ? 'Menyimpan...' : 'Simpan rate'}
          </Button>
          <Button onClick={() => setDeriveOpen(true)} disabled={!hasRate || deriveFees.isPending}>
            <Calculator className="size-4" />
            Hitung fee bulan ini
          </Button>
        </div>
      ) : null}

      <AlertDialog open={deriveOpen} onOpenChange={setDeriveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hitung fee {currentMonthLabel()}?</AlertDialogTitle>
            <AlertDialogDescription>
              Estimasi fee QRIS &amp; komisi marketplace dicatat sebagai biaya bulan ini (dari rate
              yang tersimpan). Aman diklik ulang — angkanya diperbarui, bukan digandakan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDerive()} disabled={deriveFees.isPending}>
              Hitung sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
