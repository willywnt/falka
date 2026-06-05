'use client';

import { useMemo, useRef } from 'react';
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

import { useAddVariantMutation } from '../hooks/use-products';
import { suggestVariantName, suggestVariantSku } from '../utils/options';
import { buildAddVariantFormSchema, type AddVariantFormInput } from '../validators/create-product';

export function AddVariantDialog({
  productId,
  productName,
  optionTypes,
  open,
  onOpenChange,
}: {
  productId: string;
  productName: string;
  optionTypes: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const addMutation = useAddVariantMutation(productId);
  const schema = useMemo(() => buildAddVariantFormSchema(optionTypes), [optionTypes]);

  const defaultValues = useMemo<AddVariantFormInput>(
    () => ({
      sku: '',
      name: '',
      optionValues: optionTypes.map(() => ''),
      price: 0,
      cost: 0,
      lowStockThreshold: 0,
      initialStock: 0,
      leadTimeDays: 0,
      minOrderQty: 0,
    }),
    [optionTypes],
  );

  const form = useForm<AddVariantFormInput>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  // Stop auto-suggesting SKU/name once the user edits those fields by hand.
  const skuEdited = useRef(false);
  const nameEdited = useRef(false);

  function resetForm() {
    form.reset(defaultValues);
    skuEdited.current = false;
    nameEdited.current = false;
  }

  function applySuggestions(values: string[]) {
    if (!skuEdited.current) form.setValue('sku', suggestVariantSku(productName, values));
    if (!nameEdited.current) form.setValue('name', suggestVariantName(values));
  }

  async function onSubmit(values: AddVariantFormInput) {
    const options = optionTypes.map((name, index) => ({
      name,
      value: (values.optionValues[index] ?? '').trim(),
    }));

    try {
      await addMutation.mutateAsync({
        sku: values.sku,
        name: values.name,
        options: options.length > 0 ? options : undefined,
        price: values.price,
        cost: values.cost || undefined,
        lowStockThreshold: values.lowStockThreshold,
        initialStock: values.initialStock,
        alertEnabled: true,
        leadTimeDays: values.leadTimeDays || undefined,
        minOrderQty: values.minOrderQty || undefined,
      });
      toast.success('Variant added', { description: `${values.name} is now tracked.` });
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error('Could not add variant', {
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
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add variant</DialogTitle>
          <DialogDescription>Add another sellable variant to this product.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {optionTypes.length > 0 ? (
              <div className="space-y-3 rounded-lg border p-4">
                <p className="text-muted-foreground text-xs">
                  Set this variant&apos;s {optionTypes.join(' / ')} — it must be a new combination.
                  SKU and name are auto-filled from these.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {optionTypes.map((optionType, index) => (
                    <FormField
                      key={optionType}
                      control={form.control}
                      name={`optionValues.${index}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>{optionType}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={`e.g. ${optionType}`}
                              autoComplete="off"
                              {...field}
                              onChange={(event) => {
                                field.onChange(event);
                                const next = [...form.getValues('optionValues')];
                                next[index] = event.target.value;
                                applySuggestions(next);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>SKU</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="KAOS-BLK-L"
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Variant name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Black / L"
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
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (IDR)</FormLabel>
                    <FormControl>
                      <NumberInput min={0} step={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cost"
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
                name="initialStock"
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
                name="lowStockThreshold"
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? 'Adding...' : 'Add variant'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
