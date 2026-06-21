'use client';

import { Fragment, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Layers, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import { useUpdateProductMutation, useUpdateVariantDetailsMutation } from '../hooks/use-products';
import type { ProductDetail } from '../types';
import type { UpdateProductInput } from '../validators/update-product';
import type { UpdateVariantDetailsInput } from '../validators/update-variant-details';
import { buildVariantBlocks } from '../utils/variants';

const MAX_MONEY = 9_999_999_999;

const editSchema = z.object({
  name: z.string().trim().min(1, 'Nama produk wajib diisi').max(200),
  category: z.string().trim().max(100),
  description: z.string().trim().max(2000),
  variants: z.array(
    z.object({
      variantId: z.string(),
      sku: z.string(),
      variantGroup: z.string().trim().max(200),
      name: z.string().trim().min(1, 'Nama varian wajib diisi').max(200),
      barcode: z.string().trim().max(64),
      price: z.coerce.number().nonnegative('Harga minimal 0').max(MAX_MONEY),
      cost: z.coerce.number().nonnegative('Modal minimal 0').max(MAX_MONEY),
    }),
  ),
});
type EditValues = z.infer<typeof editSchema>;

/**
 * Inline product editor: turns the detail view into editable inputs for product
 * name/category/description and each variant's name/price/cost/barcode (+ group
 * name). SKU stays read-only (it's the import match key); stock + planning fields
 * keep their own actions. Saving diffs against the original and patches only what
 * changed (updateProduct + updateVariantDetails per variant), behind a confirm.
 */
export function ProductEditForm({
  product,
  onDone,
}: {
  product: ProductDetail;
  onDone: () => void;
}) {
  const updateProduct = useUpdateProductMutation(product.id);
  const updateVariantDetails = useUpdateVariantDetailsMutation(product.id);
  const [confirm, setConfirm] = useState<'save' | 'discard' | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: product.name,
      category: product.category ?? '',
      description: product.description ?? '',
      variants: product.variants.map((variant) => ({
        variantId: variant.id,
        sku: variant.sku,
        variantGroup: variant.variantGroup ?? '',
        name: variant.name,
        barcode: variant.barcode ?? '',
        price: Number(variant.price),
        cost: variant.cost != null ? Number(variant.cost) : 0,
      })),
    },
  });

  // Stable block STRUCTURE from the original — so renaming a group doesn't reshuffle rows.
  const blocks = useMemo(() => buildVariantBlocks(product.variants), [product]);
  const indexByVariantId = useMemo(
    () => new Map(product.variants.map((variant, index) => [variant.id, index] as const)),
    [product],
  );

  function setGroupName(variantIds: string[], value: string) {
    for (const id of variantIds) {
      const index = indexByVariantId.get(id);
      if (index !== undefined) {
        form.setValue(`variants.${index}.variantGroup`, value, { shouldDirty: true });
      }
    }
  }

  async function doSave(values: EditValues) {
    setSaving(true);
    try {
      const productPatch: UpdateProductInput = {};
      if (values.name !== product.name) productPatch.name = values.name;
      const category = values.category.trim() || null;
      if (category !== (product.category ?? null)) productPatch.category = category;
      const description = values.description.trim() || null;
      if (description !== (product.description ?? null)) productPatch.description = description;

      const original = new Map(product.variants.map((variant) => [variant.id, variant]));
      const variantUpdates: { variantId: string; input: UpdateVariantDetailsInput }[] = [];
      for (const formVariant of values.variants) {
        const orig = original.get(formVariant.variantId);
        if (!orig) continue;
        const input: UpdateVariantDetailsInput = {};
        if (formVariant.name !== orig.name) input.name = formVariant.name;
        const group = formVariant.variantGroup.trim();
        if (group && group !== (orig.variantGroup ?? '')) input.variantGroup = group;
        const barcode = formVariant.barcode.trim();
        if (barcode && barcode !== (orig.barcode ?? '')) input.barcode = barcode;
        if (formVariant.price !== Number(orig.price)) input.price = formVariant.price;
        const origCost = orig.cost != null ? Number(orig.cost) : 0;
        if (formVariant.cost !== origCost) input.cost = formVariant.cost;
        if (Object.keys(input).length > 0) {
          variantUpdates.push({ variantId: formVariant.variantId, input });
        }
      }

      if (Object.keys(productPatch).length === 0 && variantUpdates.length === 0) {
        toast('Tidak ada perubahan');
        onDone();
        return;
      }

      if (Object.keys(productPatch).length > 0) await updateProduct.mutateAsync(productPatch);
      for (const update of variantUpdates) await updateVariantDetails.mutateAsync(update);

      toast.success('Produk diperbarui', {
        description: `${variantUpdates.length} varian diubah.`,
      });
      onDone();
    } catch (error) {
      toast.error('Gagal menyimpan', {
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (form.formState.isDirty) setConfirm('discard');
    else onDone();
  }

  function variantFields(variantId: string) {
    const index = indexByVariantId.get(variantId);
    if (index === undefined) return null;
    const sku = product.variants[index]?.sku ?? '';

    return (
      <div className="bg-card space-y-3 rounded-lg border p-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name={`variants.${index}.name`}
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Nama varian</FormLabel>
                <FormControl>
                  <Input autoComplete="off" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <FormLabel>SKU</FormLabel>
            <div className="text-muted-foreground flex h-9 items-center font-mono text-sm">
              {sku}
            </div>
          </FormItem>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <FormField
            control={form.control}
            name={`variants.${index}.price`}
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Harga (Rp)</FormLabel>
                <FormControl>
                  <NumberInput {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`variants.${index}.cost`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modal (Rp)</FormLabel>
                <FormControl>
                  <NumberInput {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`variants.${index}.barcode`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Barcode</FormLabel>
                <FormControl>
                  <Input autoComplete="off" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-semibold tracking-tight">Edit produk</h2>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
              Batal
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(() => setConfirm('save'))}
              disabled={saving}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {saving ? 'Menyimpan…' : 'Simpan'}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detail produk</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Nama produk</FormLabel>
                    <FormControl>
                      <Input autoComplete="off" {...field} />
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
                    <FormLabel>Kategori</FormLabel>
                    <FormControl>
                      <Input autoComplete="off" placeholder="Apparel" {...field} />
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
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Deskripsi singkat" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="space-y-3">
          <p className="text-sm font-medium">
            Varian <span className="text-muted-foreground">· {product.variants.length}</span>
          </p>
          <p className="text-muted-foreground text-xs">
            SKU tidak bisa diubah di sini. Stok lewat “Sesuaikan”, dan field lain lewat “Ubah
            informasi tambahan”.
          </p>
          {blocks.map((block) => {
            if (block.kind === 'single') {
              return <div key={block.variant.id}>{variantFields(block.variant.id)}</div>;
            }
            const first = block.variants[0];
            const firstIndex = first ? indexByVariantId.get(first.id) : undefined;
            return (
              <div key={`group-${block.name}`} className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Layers className="text-muted-foreground size-4 shrink-0" />
                  {firstIndex !== undefined ? (
                    <Input
                      value={form.watch(`variants.${firstIndex}.variantGroup`) ?? ''}
                      onChange={(event) =>
                        setGroupName(
                          block.variants.map((variant) => variant.id),
                          event.target.value,
                        )
                      }
                      placeholder="Nama grup"
                      className="max-w-xs font-medium"
                    />
                  ) : null}
                </div>
                <div className="space-y-3 sm:pl-6">
                  {block.variants.map((variant) => (
                    <Fragment key={variant.id}>{variantFields(variant.id)}</Fragment>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(next) => {
          if (!next) setConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === 'discard' ? 'Buang perubahan?' : 'Simpan perubahan?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === 'discard'
                ? 'Perubahan yang belum disimpan akan hilang.'
                : 'Perubahan akan langsung diterapkan ke produk dan variannya.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                confirm === 'discard' && 'bg-destructive hover:bg-destructive/90 text-white',
              )}
              onClick={() => {
                const mode = confirm;
                setConfirm(null);
                if (mode === 'discard') onDone();
                else void doSave(form.getValues());
              }}
            >
              {confirm === 'discard' ? 'Ya, buang' : 'Ya, simpan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  );
}
