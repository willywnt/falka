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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { NumberInput } from '@/components/ui/number-input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import {
  useCreateExpenseTemplateMutation,
  useUpdateExpenseTemplateMutation,
} from '../hooks/use-expense-templates';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseTemplateListItem,
} from '../types';
import { EXPENSE_CATEGORY_VALUES } from '../validators/expense';

const templateFormSchema = z.object({
  category: z.enum(EXPENSE_CATEGORY_VALUES),
  amount: z.coerce.number().positive('Jumlah harus lebih dari 0').max(1_000_000_000_000),
  dayOfMonth: z.coerce.number().int().min(1, 'Tanggal 1–31').max(31, 'Tanggal 1–31'),
  note: z.string().trim().max(500),
  isActive: z.boolean(),
});

type TemplateFormInput = z.infer<typeof templateFormSchema>;

function toDefaults(template: ExpenseTemplateListItem | null): TemplateFormInput {
  return {
    category: template?.category ?? 'RENT',
    amount: template ? Number(template.amount) : 0,
    dayOfMonth: template?.dayOfMonth ?? 1,
    note: template?.note ?? '',
    isActive: template?.isActive ?? true,
  };
}

export function ExpenseTemplateFormDialog({
  template,
  open,
  onOpenChange,
}: {
  /** Edit an existing template, or null to create a new one. */
  template: ExpenseTemplateListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = Boolean(template);
  const createMutation = useCreateExpenseTemplateMutation();
  const updateMutation = useUpdateExpenseTemplateMutation(template?.id ?? '');
  const pending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<TemplateFormInput>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: toDefaults(template),
  });

  useEffect(() => {
    if (open) form.reset(toDefaults(template));
  }, [open, template, form]);

  async function onSubmit(values: TemplateFormInput) {
    const payload = {
      category: values.category,
      amount: values.amount,
      dayOfMonth: values.dayOfMonth,
      note: values.note.trim() || null,
      isActive: values.isActive,
    };

    try {
      if (template) await updateMutation.mutateAsync(payload);
      else await createMutation.mutateAsync(payload);
      toast.success(isEdit ? 'Template diperbarui' : 'Template berulang dibuat', {
        description: `${EXPENSE_CATEGORY_LABELS[values.category]} tersimpan.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error('Gagal menyimpan template', {
        description: error instanceof Error ? error.message : 'Coba lagi.',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Ubah template berulang' : 'Template berulang'}</DialogTitle>
          <DialogDescription>
            Biaya bulanan tetap (sewa, gaji, dll.). Tombol &ldquo;Buat bulan ini&rdquo; mencatatnya
            sebagai biaya untuk bulan berjalan.
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
                name="dayOfMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Tanggal tiap bulan</FormLabel>
                    <FormControl>
                      <NumberInput min={1} max={31} step={1} {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      1–31 (disesuaikan ke akhir bulan)
                    </FormDescription>
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
                    <Textarea rows={2} placeholder="mis. Sewa ruko bulanan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Aktif</FormLabel>
                    <FormDescription className="text-xs">
                      Hanya template aktif yang dicatat saat &ldquo;Buat bulan ini&rdquo;.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label="Template aktif"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? 'Menyimpan...' : isEdit ? 'Simpan perubahan' : 'Buat template'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
