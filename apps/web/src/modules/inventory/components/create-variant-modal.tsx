'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
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

import { useCreateVariantMutation } from '../hooks/use-inventory';
import type { ProductListItemDto } from '../types';
import { createProductVariantFormSchema } from '../validators';

const createVariantModalSchema = createProductVariantFormSchema.extend({
  productId: z.string().cuid('Select a product'),
});

type CreateVariantModalInput = z.infer<typeof createVariantModalSchema>;

type CreateVariantModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: ProductListItemDto[];
  defaultProductId?: string;
};

function resolveDefaultProductId(
  products: ProductListItemDto[],
  defaultProductId?: string,
): string {
  if (defaultProductId && products.some((product) => product.id === defaultProductId)) {
    return defaultProductId;
  }
  return products[0]?.id ?? '';
}

export function CreateVariantModal({
  open,
  onOpenChange,
  products,
  defaultProductId,
}: CreateVariantModalProps) {
  const createMutation = useCreateVariantMutation();
  const wasOpenRef = useRef(false);

  const form = useForm<CreateVariantModalInput>({
    resolver: zodResolver(createVariantModalSchema),
    defaultValues: {
      productId: '',
      sku: '',
      barcode: '',
      name: '',
      price: 0,
      initialStock: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    wasOpenRef.current = open;

    if (justOpened) {
      form.reset({
        productId: resolveDefaultProductId(products, defaultProductId),
        sku: '',
        barcode: '',
        name: '',
        price: 0,
        initialStock: 0,
        isActive: true,
      });
      return;
    }

    if (!open || products.length === 0) return;

    const productId = resolveDefaultProductId(products, defaultProductId);
    const currentProductId = form.getValues('productId');

    if (!currentProductId || !products.some((product) => product.id === currentProductId)) {
      form.setValue('productId', productId, { shouldValidate: true });
    }
  }, [open, defaultProductId, products, form]);

  async function onSubmit(values: CreateVariantModalInput) {
    try {
      await createMutation.mutateAsync({
        productId: values.productId,
        sku: values.sku,
        barcode: values.barcode?.trim() || undefined,
        name: values.name,
        price: values.price,
        cost: values.cost,
        initialStock: values.initialStock,
        isActive: values.isActive,
      });
      toast.success('Variant created', {
        description: `SKU ${values.sku} added with ${values.initialStock} initial stock.`,
      });
      form.reset({
        productId: values.productId,
        sku: '',
        barcode: '',
        name: '',
        price: 0,
        initialStock: 0,
        isActive: true,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to create variant', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create variant (SKU)</DialogTitle>
          <DialogDescription>
            Sellable SKUs sync to marketplaces individually. Stock is tracked in internal inventory.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={(event) => void form.handleSubmit(onSubmit)(event)} className="space-y-4">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                    >
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input placeholder="IPH15-BLK-128" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variant name</FormLabel>
                  <FormControl>
                    <Input placeholder="Black 128GB" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="initialStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial stock</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="barcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barcode (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="EAN/UPC" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || products.length === 0}>
                {createMutation.isPending ? 'Creating...' : 'Create variant'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
