'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/error-state';

import { useBudgetsQuery, useUpsertBudgetsMutation } from '../hooks/use-budgets';
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS } from '../types';

export function BudgetFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Atur anggaran bulanan</DialogTitle>
          <DialogDescription>
            Anggaran per kategori, berlaku tiap bulan. Kosongkan (0) untuk tanpa anggaran.
          </DialogDescription>
        </DialogHeader>
        {open ? <BudgetForm onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function BudgetForm({ onDone }: { onDone: () => void }) {
  const { data, isLoading, error, refetch } = useBudgetsQuery();
  const upsert = useUpsertBudgetsMutation();
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!data) return;
    const saved = Object.fromEntries(data.map((budget) => [budget.category, budget.amount]));
    setValues(
      Object.fromEntries(EXPENSE_CATEGORIES.map((category) => [category, saved[category] ?? ''])),
    );
  }, [data]);

  async function handleSave() {
    try {
      await upsert.mutateAsync({
        budgets: EXPENSE_CATEGORIES.map((category) => ({
          category,
          amount: Number(values[category] || 0),
        })),
      });
      toast.success('Anggaran disimpan');
      onDone();
    } catch (saveError) {
      toast.error('Gagal menyimpan anggaran', {
        description: saveError instanceof Error ? saveError.message : 'Coba lagi.',
      });
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-full" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState title="Gagal memuat anggaran" onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
        {EXPENSE_CATEGORIES.map((category) => (
          <div key={category} className="flex items-center gap-3">
            <Label htmlFor={`budget-${category}`} className="flex-1 text-sm font-normal">
              {EXPENSE_CATEGORY_LABELS[category]}
            </Label>
            <Input
              id={`budget-${category}`}
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              className="w-40"
              placeholder="0"
              value={values[category] ?? ''}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, [category]: event.target.value }))
              }
            />
          </div>
        ))}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Batal
        </Button>
        <Button type="button" onClick={() => void handleSave()} disabled={upsert.isPending}>
          {upsert.isPending ? 'Menyimpan...' : 'Simpan anggaran'}
        </Button>
      </DialogFooter>
    </div>
  );
}
