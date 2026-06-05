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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { useCreateProductMutation } from '../hooks/use-products';
import { createProductFormSchema, type CreateProductFormInput } from '../validators/create-product';

const DEFAULT_VALUES: CreateProductFormInput = {
  name: '',
  category: '',
  description: '',
  addVariant: true,
  variant: {
    sku: '',
    name: '',
    price: 0,
    cost: 0,
    lowStockThreshold: 0,
    initialStock: 0,
  },
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
  const addVariant = form.watch('addVariant');

  async function onSubmit(values: CreateProductFormInput) {
    try {
      await createMutation.mutateAsync({
        name: values.name,
        description: values.description.trim() || undefined,
        category: values.category.trim() || undefined,
        variant: values.addVariant
          ? {
              sku: values.variant.sku,
              name: values.variant.name,
              price: values.variant.price,
              cost: values.variant.cost || undefined,
              lowStockThreshold: values.variant.lowStockThreshold,
              initialStock: values.variant.initialStock,
              alertEnabled: true,
            }
          : undefined,
      });
      toast.success('Product created', { description: `${values.name} is now in your catalog.` });
      form.reset(DEFAULT_VALUES);
      onOpenChange(false);
    } catch (error) {
      toast.error('Could not create product', {
        description: error instanceof Error ? error.message : 'Unknown error',
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
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New product</DialogTitle>
          <DialogDescription>
            Create a product. You can add its first variant now or later from the product page.
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
                    <FormLabel required>Product name</FormLabel>
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
                    <FormLabel>Category (optional)</FormLabel>
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
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Short description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="addVariant"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Add a first variant now</FormLabel>
                    <FormDescription>
                      Turn off to create the product on its own and add variants later.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {addVariant ? (
              <div className="space-y-4 rounded-lg border p-4">
                <p className="text-sm font-medium">First variant</p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="variant.sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="KAOS-BLK-M" autoComplete="off" {...field} />
                        </FormControl>
                        <FormDescription>Unique per account.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="variant.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Variant name</FormLabel>
                        <FormControl>
                          <Input placeholder="Black / M" autoComplete="off" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="variant.price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Price (IDR)</FormLabel>
                        <FormControl>
                          <NumberInput min={0} step={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="variant.cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost (IDR)</FormLabel>
                        <FormControl>
                          <NumberInput min={0} step={1} {...field} />
                        </FormControl>
                        <FormDescription>Modal price — drives stock value.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="variant.initialStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial stock</FormLabel>
                        <FormControl>
                          <NumberInput min={0} step={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="variant.lowStockThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Low-stock at</FormLabel>
                        <FormControl>
                          <NumberInput min={0} step={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <p className="text-muted-foreground text-xs">
                  Lead time and reorder settings can be set later by editing the variant.
                </p>
              </div>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create product'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
