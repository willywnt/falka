'use client';

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
import { Switch } from '@/components/ui/switch';

import { useAddVariantMutation } from '../hooks/use-products';
import { buildAddVariantsPayload, suggestVariantSku } from '../utils/variants';
import { addVariantFormSchema, type AddVariantFormInput } from '../validators/add-variant';

const EMPTY_SUBVARIANT = {
  name: '',
  sku: '',
  price: 0,
  cost: 0,
  initialStock: 0,
  lowStockThreshold: 0,
};

const DEFAULT_VALUES: AddVariantFormInput = {
  variantName: '',
  hasOptions: false,
  single: { sku: '', price: 0, cost: 0, initialStock: 0, lowStockThreshold: 0 },
  subvariants: [],
};

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
  const subvariants = useFieldArray({ control: form.control, name: 'subvariants' });
  const hasOptions = form.watch('hasOptions');

  function suggestEmptySkus(variantName: string) {
    if (!form.getValues('hasOptions')) {
      if (!form.getValues('single.sku').trim()) {
        form.setValue('single.sku', suggestVariantSku(variantName));
      }
      return;
    }
    form.getValues('subvariants').forEach((row, index) => {
      if (row.name.trim() && !row.sku.trim()) {
        form.setValue(`subvariants.${index}.sku`, suggestVariantSku(variantName, row.name));
      }
    });
  }

  function onToggleOptions(next: boolean) {
    form.setValue('hasOptions', next);
    if (next && form.getValues('subvariants').length === 0) {
      subvariants.append({ ...EMPTY_SUBVARIANT });
    }
  }

  async function onSubmit(values: AddVariantFormInput) {
    const payload = buildAddVariantsPayload({
      variantName: values.variantName,
      hasOptions: values.hasOptions,
      single: values.single,
      subvariants: values.subvariants,
    });

    try {
      const created = await addMutation.mutateAsync(payload);
      toast.success('Variant added', {
        description: `${values.variantName} — ${created.length} ${
          created.length === 1 ? 'item' : 'items'
        } added.`,
      });
      form.reset(DEFAULT_VALUES);
      onOpenChange(false);
    } catch (error) {
      toast.error('Could not add variant', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  const subvariantsError = form.formState.errors.subvariants?.message;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) form.reset(DEFAULT_VALUES);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add variant</DialogTitle>
          <DialogDescription>
            A variant can stand on its own, or hold several subvariants (e.g. colors or sizes).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="variantName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Variant name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="iPhone 16"
                      autoComplete="off"
                      {...field}
                      onChange={(event) => {
                        field.onChange(event);
                        suggestEmptySkus(event.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasOptions"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>This variant has options</FormLabel>
                    <FormDescription>
                      Turn on to add subvariants like colors or sizes, each with its own SKU &
                      stock.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={onToggleOptions} />
                  </FormControl>
                </FormItem>
              )}
            />

            {hasOptions ? (
              <div className="space-y-3">
                {subvariants.fields.map((row, index) => (
                  <div key={row.id} className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-start gap-2">
                      <FormField
                        control={form.control}
                        name={`subvariants.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel required>Option name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Hitam"
                                autoComplete="off"
                                {...field}
                                onChange={(event) => {
                                  field.onChange(event);
                                  if (!form.getValues(`subvariants.${index}.sku`).trim()) {
                                    form.setValue(
                                      `subvariants.${index}.sku`,
                                      suggestVariantSku(
                                        form.getValues('variantName'),
                                        event.target.value,
                                      ),
                                    );
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`subvariants.${index}.sku`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel required>SKU</FormLabel>
                            <FormControl>
                              <Input placeholder="IPHONE-16-HITAM" autoComplete="off" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-6 shrink-0"
                        onClick={() => subvariants.remove(index)}
                      >
                        <X className="size-4" />
                        <span className="sr-only">Remove subvariant</span>
                      </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-4">
                      <FormField
                        control={form.control}
                        name={`subvariants.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price</FormLabel>
                            <FormControl>
                              <NumberInput min={0} step={1} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`subvariants.${index}.cost`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cost</FormLabel>
                            <FormControl>
                              <NumberInput min={0} step={1} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`subvariants.${index}.initialStock`}
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
                        name={`subvariants.${index}.lowStockThreshold`}
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
                  </div>
                ))}

                {typeof subvariantsError === 'string' ? (
                  <p className="text-destructive text-sm">{subvariantsError}</p>
                ) : null}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => subvariants.append({ ...EMPTY_SUBVARIANT })}
                >
                  <Plus className="size-4" />
                  Add option
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="single.sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="IPHONE-16" autoComplete="off" {...field} />
                      </FormControl>
                      <FormDescription>Unique per account.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="single.price"
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
                  name="single.cost"
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
                  name="single.initialStock"
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
                  name="single.lowStockThreshold"
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
            )}

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
