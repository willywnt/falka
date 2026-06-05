'use client';

import { useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';

import { useCreateProductMutation } from '../hooks/use-products';
import { suggestVariantName, suggestVariantSku } from '../utils/options';
import { MAX_OPTION_TYPES } from '../validators/options';
import { createProductFormSchema, type CreateProductFormInput } from '../validators/create-product';

const DEFAULT_VALUES: CreateProductFormInput = {
  name: '',
  category: '',
  description: '',
  options: [],
  variant: {
    sku: '',
    name: '',
    price: 0,
    cost: 0,
    lowStockThreshold: 0,
    initialStock: 0,
    leadTimeDays: 0,
    minOrderQty: 0,
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
  const optionFields = useFieldArray({ control: form.control, name: 'options' });

  // Stop auto-suggesting the first variant's SKU/name once edited by hand.
  const skuEdited = useRef(false);
  const nameEdited = useRef(false);

  function resetForm() {
    form.reset(DEFAULT_VALUES);
    skuEdited.current = false;
    nameEdited.current = false;
  }

  function applySuggestions(productName: string, values: string[]) {
    if (values.every((value) => !value.trim())) return;
    const sku = suggestVariantSku(productName, values);
    if (!skuEdited.current && sku) form.setValue('variant.sku', sku);
    const name = suggestVariantName(values);
    if (!nameEdited.current && name) form.setValue('variant.name', name);
  }

  function optionValues(): string[] {
    return form.getValues('options').map((option) => option.value);
  }

  async function onSubmit(values: CreateProductFormInput) {
    const options = values.options
      .map((option) => ({ name: option.name.trim(), value: option.value.trim() }))
      .filter((option) => option.name && option.value);
    const optionTypes = options.map((option) => option.name);

    try {
      await createMutation.mutateAsync({
        name: values.name,
        description: values.description.trim() || undefined,
        category: values.category.trim() || undefined,
        optionTypes: optionTypes.length > 0 ? optionTypes : undefined,
        variant: {
          sku: values.variant.sku,
          name: values.variant.name,
          options: options.length > 0 ? options : undefined,
          price: values.variant.price,
          cost: values.variant.cost || undefined,
          lowStockThreshold: values.variant.lowStockThreshold,
          initialStock: values.variant.initialStock,
          alertEnabled: true,
          leadTimeDays: values.variant.leadTimeDays || undefined,
          minOrderQty: values.variant.minOrderQty || undefined,
        },
      });
      toast.success('Product created', { description: `${values.name} is now in your catalog.` });
      resetForm();
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
        if (!next) resetForm();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New product</DialogTitle>
          <DialogDescription>
            Create a product with its first variant. Stock and pricing are tracked per variant.
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
                      <Input
                        placeholder="Kaos Polos Cotton"
                        autoComplete="off"
                        {...field}
                        onChange={(event) => {
                          field.onChange(event);
                          applySuggestions(event.target.value, optionValues());
                        }}
                      />
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

            <div className="space-y-3 rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Options (optional)</p>
                <p className="text-muted-foreground text-xs">
                  Add dimensions like Model or Warna to group variants. Leave empty for a simple
                  product.
                </p>
              </div>

              {optionFields.fields.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-muted-foreground grid grid-cols-[1fr_1fr_auto] gap-2 text-xs">
                    <span>Option name</span>
                    <span>First variant value</span>
                    <span className="w-8" />
                  </div>
                  {optionFields.fields.map((optionField, index) => (
                    <div
                      key={optionField.id}
                      className="grid grid-cols-[1fr_1fr_auto] items-start gap-2"
                    >
                      <FormField
                        control={form.control}
                        name={`options.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Model"
                                autoComplete="off"
                                aria-label="Option name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`options.${index}.value`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="16"
                                autoComplete="off"
                                aria-label="First variant value"
                                {...field}
                                onChange={(event) => {
                                  field.onChange(event);
                                  const next = optionValues();
                                  next[index] = event.target.value;
                                  applySuggestions(form.getValues('name'), next);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-0.5"
                        onClick={() => {
                          optionFields.remove(index);
                          applySuggestions(form.getValues('name'), optionValues());
                        }}
                      >
                        <X className="size-4" />
                        <span className="sr-only">Remove option</span>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={optionFields.fields.length >= MAX_OPTION_TYPES}
                onClick={() => optionFields.append({ name: '', value: '' })}
              >
                <Plus className="size-4" />
                Add option
              </Button>
            </div>

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
                        <Input
                          placeholder="KAOS-BLK-M"
                          autoComplete="off"
                          {...field}
                          onChange={(event) => {
                            skuEdited.current = true;
                            field.onChange(event);
                          }}
                        />
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
                        <Input
                          placeholder="Black / M"
                          autoComplete="off"
                          {...field}
                          onChange={(event) => {
                            nameEdited.current = true;
                            field.onChange(event);
                          }}
                        />
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
