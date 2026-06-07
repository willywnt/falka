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
import { Form } from '@/components/ui/form';

import { useAddVariantMutation } from '../hooks/use-products';
import { variantBlocksToLeaves } from '../utils/variants';
import { addVariantFormSchema, type AddVariantFormInput } from '../validators/add-variant';
import { EMPTY_VARIANT_BLOCK, VariantBlocksField } from './variant-blocks-field';

const DEFAULT_VALUES: AddVariantFormInput = { variants: [{ ...EMPTY_VARIANT_BLOCK }] };

export function AddVariantDialog({
  productId,
  open,
  onOpenChange,
}: {
  productId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const addMutation = useAddVariantMutation(productId);

  const form = useForm<AddVariantFormInput>({
    resolver: zodResolver(addVariantFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  async function onSubmit(values: AddVariantFormInput) {
    try {
      const created = await addMutation.mutateAsync(variantBlocksToLeaves(values.variants));
      toast.success('Varian ditambahkan', {
        description: `${created.length} ${created.length === 1 ? 'item' : 'item'} ditambahkan.`,
      });
      form.reset(DEFAULT_VALUES);
      onOpenChange(false);
    } catch (error) {
      toast.error('Gagal menambahkan varian', {
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
          <DialogTitle>Tambah varian</DialogTitle>
          <DialogDescription>
            Varian bisa berdiri sendiri, atau menampung beberapa subvarian (mis. warna atau ukuran).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <VariantBlocksField minBlocks={1} addLabel="Tambah varian lain" />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? 'Menambahkan...' : 'Tambah varian'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
