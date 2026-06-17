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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { useCreateSupplierMutation, useUpdateSupplierMutation } from '../hooks/use-suppliers';
import type { SupplierListItem } from '../types';

const supplierFormSchema = z.object({
  name: z.string().trim().min(1, 'Nama pemasok wajib diisi').max(120),
  phone: z.string().trim().max(40),
  defaultLeadTimeDays: z.coerce.number().int().nonnegative().max(365),
  defaultMinOrderQty: z.coerce.number().int().nonnegative().max(1_000_000),
  note: z.string().trim().max(500),
  isActive: z.boolean(),
});

type SupplierFormInput = z.infer<typeof supplierFormSchema>;

function toDefaults(supplier: SupplierListItem | null): SupplierFormInput {
  return {
    name: supplier?.name ?? '',
    phone: supplier?.phone ?? '',
    defaultLeadTimeDays: supplier?.defaultLeadTimeDays ?? 0,
    defaultMinOrderQty: supplier?.defaultMinOrderQty ?? 0,
    note: supplier?.note ?? '',
    isActive: supplier?.isActive ?? true,
  };
}

export function SupplierFormDialog({
  supplier,
  open,
  onOpenChange,
}: {
  /** Edit an existing supplier, or null to create a new one. */
  supplier: SupplierListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = Boolean(supplier);
  const createMutation = useCreateSupplierMutation();
  const updateMutation = useUpdateSupplierMutation(supplier?.id ?? '');
  const pending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<SupplierFormInput>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: toDefaults(supplier),
  });

  // Reset to the target supplier each time the dialog opens (create vs edit).
  useEffect(() => {
    if (open) form.reset(toDefaults(supplier));
  }, [open, supplier, form]);

  async function onSubmit(values: SupplierFormInput) {
    // Empty string / 0 mean "unset" → null, so the reorder fallback skips them.
    const payload = {
      name: values.name,
      phone: values.phone.trim() || null,
      note: values.note.trim() || null,
      defaultLeadTimeDays: values.defaultLeadTimeDays || null,
      defaultMinOrderQty: values.defaultMinOrderQty || null,
    };

    try {
      if (supplier) {
        await updateMutation.mutateAsync({ ...payload, isActive: values.isActive });
      } else {
        await createMutation.mutateAsync(payload);
      }
      toast.success(isEdit ? 'Pemasok diperbarui' : 'Pemasok ditambahkan', {
        description: `${values.name} tersimpan.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error('Gagal menyimpan pemasok', {
        description: error instanceof Error ? error.message : 'Coba lagi.',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Ubah pemasok' : 'Tambah pemasok'}</DialogTitle>
          <DialogDescription>
            Lead time & MOQ jadi cadangan untuk laporan reorder ketika varian belum punya nilainya
            sendiri.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Nama pemasok</FormLabel>
                  <FormControl>
                    <Input placeholder="PT Sumber Rejeki" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>No. telepon (opsional)</FormLabel>
                  <FormControl>
                    <Input placeholder="08xxxxxxxxxx" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="defaultLeadTimeDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead time (hari)</FormLabel>
                    <FormControl>
                      <NumberInput min={0} step={1} {...field} />
                    </FormControl>
                    <FormDescription>0 = tidak diset.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultMinOrderQty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MOQ default</FormLabel>
                    <FormControl>
                      <NumberInput min={0} step={1} {...field} />
                    </FormControl>
                    <FormDescription>0 = tanpa minimum.</FormDescription>
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
                    <Textarea rows={2} placeholder="Kontak, termin, dll." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEdit ? (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="supplier-active"
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked)}
                      />
                      <Label htmlFor="supplier-active" className="text-sm font-normal">
                        {field.value ? 'Aktif' : 'Nonaktif'}
                      </Label>
                    </div>
                    <FormDescription>
                      Pemasok nonaktif tidak muncul di pilihan PO/varian.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? 'Menyimpan...' : isEdit ? 'Simpan perubahan' : 'Tambah pemasok'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
