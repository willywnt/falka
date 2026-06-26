'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { useCreateExpenseMutation, useUpdateExpenseMutation } from '../hooks/use-expenses';
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, type ExpenseListItem } from '../types';
import { EXPENSE_CATEGORY_VALUES } from '../validators/expense';

const expenseFormSchema = z.object({
  category: z.enum(EXPENSE_CATEGORY_VALUES),
  amount: z.coerce.number().positive('Jumlah harus lebih dari 0').max(1_000_000_000_000),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  note: z.string().trim().max(500),
});

type ExpenseFormInput = z.infer<typeof expenseFormSchema>;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function toDefaults(expense: ExpenseListItem | null): ExpenseFormInput {
  return {
    category: expense?.category ?? 'ADVERTISING',
    amount: expense ? Number(expense.amount) : 0,
    date: expense ? expense.date.slice(0, 10) : todayIso(),
    note: expense?.note ?? '',
  };
}

export function ExpenseFormDialog({
  expense,
  open,
  onOpenChange,
}: {
  /** Edit an existing expense, or null to create a new one. */
  expense: ExpenseListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = Boolean(expense);
  const createMutation = useCreateExpenseMutation();
  const updateMutation = useUpdateExpenseMutation(expense?.id ?? '');
  const pending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<ExpenseFormInput>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: toDefaults(expense),
  });

  useEffect(() => {
    if (open) form.reset(toDefaults(expense));
  }, [open, expense, form]);

  async function onSubmit(values: ExpenseFormInput) {
    const payload = {
      category: values.category,
      amount: values.amount,
      date: new Date(values.date),
      note: values.note.trim() || null,
    };

    try {
      if (expense) await updateMutation.mutateAsync(payload);
      else await createMutation.mutateAsync(payload);
      toast.success(isEdit ? 'Biaya diperbarui' : 'Biaya dicatat', {
        description: `${EXPENSE_CATEGORY_LABELS[values.category]} tersimpan.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error('Gagal menyimpan biaya', {
        description: error instanceof Error ? error.message : 'Coba lagi.',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Ubah biaya' : 'Catat biaya'}</DialogTitle>
          <DialogDescription>
            Biaya operasional (iklan, packaging, ongkir, gaji, dll.) yang dikurangkan dari laba
            kotor di laporan Laba bersih.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Kategori</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.value)}
                    >
                      {EXPENSE_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {EXPENSE_CATEGORY_LABELS[category]}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Jumlah (Rp)</FormLabel>
                    <FormControl>
                      <NumberInput min={0} step={1000} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Tanggal</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan (opsional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="mis. Iklan FB minggu ini" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? 'Menyimpan...' : isEdit ? 'Simpan perubahan' : 'Catat biaya'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
