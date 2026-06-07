'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { useCreateProductMutation } from '../hooks/use-products';
import { variantBlocksToLeaves } from '../utils/variants';
import { createProductFormSchema, type CreateProductFormInput } from '../validators/create-product';
import { VariantBlocksField } from './variant-blocks-field';

// Start with no variant so the user consciously adds one (or creates the product on its own).
const DEFAULT_VALUES: CreateProductFormInput = {
  name: '',
  category: '',
  description: '',
  variants: [],
};

export function ProductFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createMutation = useCreateProductMutation();

  const form = useForm<CreateProductFormInput>({
    resolver: zodResolver(createProductFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  async function onSubmit(values: CreateProductFormInput) {
    try {
      await createMutation.mutateAsync({
        name: values.name,
        description: values.description.trim() || undefined,
        category: values.category.trim() || undefined,
        variants: variantBlocksToLeaves(values.variants),
      });
      toast.success('Produk dibuat', { description: `${values.name} kini ada di katalog kamu.` });
      form.reset(DEFAULT_VALUES);
      onOpenChange(false);
    } catch (error) {
      toast.error('Gagal membuat produk', {
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) form.reset(DEFAULT_VALUES);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] !max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Produk baru</DialogTitle>
          <DialogDescription>
            Tambahkan satu varian atau lebih sekarang, atau hapus semua untuk membuat produk tanpa
            varian.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Nama produk</FormLabel>
                    <FormControl>
                      <Input placeholder="Kaos Polos Cotton" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori (opsional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Apparel" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi (opsional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Deskripsi singkat" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <p className="text-sm font-medium">Varian</p>
              <p className="text-muted-foreground text-xs">
                Tiap varian adalah SKU mandiri, atau grup subvarian (mis. warna).
              </p>
            </div>

            <VariantBlocksField minBlocks={0} addLabel="Tambah varian" />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Membuat...' : 'Buat produk'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
