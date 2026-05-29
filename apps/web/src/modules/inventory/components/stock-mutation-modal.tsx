'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { type z } from 'zod';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import {
  useAdjustStockMutation,
  useReleaseStockMutation,
  useReserveStockMutation,
} from '../hooks/use-inventory';
import type { InventoryListItemDto } from '../types';
import { adjustStockSchema, releaseStockSchema, reserveStockSchema } from '../validators';

type MutationTab = 'adjust' | 'reserve' | 'release';

type StockMutationModalProps = {
  item: InventoryListItemDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: MutationTab;
};

const adjustFormSchema = adjustStockSchema;
const reserveFormSchema = reserveStockSchema;
const releaseFormSchema = releaseStockSchema;

type AdjustFormValues = z.infer<typeof adjustFormSchema>;
type ReserveFormValues = z.infer<typeof reserveFormSchema>;
type ReleaseFormValues = z.infer<typeof releaseFormSchema>;

export function StockMutationModal({
  item,
  open,
  onOpenChange,
  defaultTab = 'adjust',
}: StockMutationModalProps) {
  const [tab, setTab] = useState<MutationTab>(defaultTab);

  const adjustMutation = useAdjustStockMutation();
  const reserveMutation = useReserveStockMutation();
  const releaseMutation = useReleaseStockMutation();

  const adjustForm = useForm<AdjustFormValues>({
    resolver: zodResolver(adjustFormSchema),
    defaultValues: { targetAvailableStock: 0, reason: '' },
  });

  const reserveForm = useForm<ReserveFormValues>({
    resolver: zodResolver(reserveFormSchema),
    defaultValues: { quantity: 1, reason: '' },
  });

  const releaseForm = useForm<ReleaseFormValues>({
    resolver: zodResolver(releaseFormSchema),
    defaultValues: { quantity: 1, reason: '' },
  });

  useEffect(() => {
    if (open && item) {
      setTab(defaultTab);
      adjustForm.reset({ targetAvailableStock: item.availableStock, reason: '' });
      reserveForm.reset({ quantity: 1, reason: '' });
      releaseForm.reset({ quantity: 1, reason: '' });
    }
  }, [open, item, defaultTab, adjustForm, reserveForm, releaseForm]);

  async function onAdjustSubmit(values: AdjustFormValues) {
    if (!item) return;

    try {
      const result = await adjustMutation.mutateAsync({ variantId: item.variantId, ...values });
      toast.success(result.idempotentReplay ? 'Adjustment already applied' : 'Stock adjusted', {
        description: `${item.sku}: ${result.event.previousStock} → ${result.event.newStock}`,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error('Adjustment failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async function onReserveSubmit(values: ReserveFormValues) {
    if (!item) return;

    try {
      const result = await reserveMutation.mutateAsync({ variantId: item.variantId, ...values });
      toast.success(result.idempotentReplay ? 'Reservation already applied' : 'Stock reserved', {
        description: `${values.quantity} unit(s) reserved for ${item.sku}.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error('Reserve failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async function onReleaseSubmit(values: ReleaseFormValues) {
    if (!item) return;

    try {
      const result = await releaseMutation.mutateAsync({ variantId: item.variantId, ...values });
      toast.success(result.idempotentReplay ? 'Release already applied' : 'Stock released', {
        description: `${values.quantity} unit(s) released for ${item.sku}.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error('Release failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  const isPending =
    adjustMutation.isPending || reserveMutation.isPending || releaseMutation.isPending;

  const targetStock = adjustForm.watch('targetAvailableStock');
  const adjustDelta = item ? Number(targetStock) - item.availableStock : 0;
  const reserveQty = reserveForm.watch('quantity');
  const releaseQty = releaseForm.watch('quantity');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Stock mutation</DialogTitle>
          <DialogDescription>
            {item ? (
              <>
                Mutate inventory for <strong>{item.sku}</strong>. All changes create audit events.
              </>
            ) : (
              'Select an inventory row.'
            )}
          </DialogDescription>
        </DialogHeader>

        {item ? (
          <div className="space-y-4">
            <div className="bg-muted/50 grid grid-cols-2 gap-2 rounded-lg p-3 text-sm">
              <div>
                <span className="text-muted-foreground">Available</span>
                <p className="font-medium">{item.availableStock}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Reserved</span>
                <p className="font-medium">{item.reservedStock}</p>
              </div>
            </div>

            <Tabs value={tab} onValueChange={(value) => setTab(value as MutationTab)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="adjust">Adjust</TabsTrigger>
                <TabsTrigger value="reserve">Reserve</TabsTrigger>
                <TabsTrigger value="release">Release</TabsTrigger>
              </TabsList>

              <TabsContent value="adjust" className="mt-4">
                <Form {...adjustForm}>
                  <form
                    onSubmit={(event) => void adjustForm.handleSubmit(onAdjustSubmit)(event)}
                    className="space-y-4"
                  >
                    <FormField
                      control={adjustForm.control}
                      name="targetAvailableStock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New available stock</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} step={1} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {item ? (
                      <div className="bg-muted/40 rounded-lg border p-3 text-sm">
                        <p className="text-muted-foreground mb-2 font-medium">Preview</p>
                        <div className="grid grid-cols-3 gap-2 tabular-nums">
                          <div>
                            <span className="text-muted-foreground text-xs">Current</span>
                            <p className="font-medium">{item.availableStock}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">Adjustment</span>
                            <p className="font-medium">
                              {adjustDelta > 0 ? '+' : ''}
                              {adjustDelta}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">Result</span>
                            <p className="font-medium">{Number(targetStock)}</p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <FormField
                      control={adjustForm.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason</FormLabel>
                          <FormControl>
                            <Textarea rows={2} placeholder="Cycle count, receipt..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isPending}>
                        {adjustMutation.isPending ? 'Saving...' : 'Adjust'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="reserve" className="mt-4">
                <Form {...reserveForm}>
                  <form
                    onSubmit={(event) => void reserveForm.handleSubmit(onReserveSubmit)(event)}
                    className="space-y-4"
                  >
                    <FormField
                      control={reserveForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity to reserve</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={item.availableStock}
                              step={1}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {item ? (
                      <div className="bg-muted/40 rounded-lg border p-3 text-sm">
                        <p className="text-muted-foreground mb-1 text-xs">After reserve</p>
                        <p className="tabular-nums">
                          Available {item.availableStock - Number(reserveQty)} · Reserved{' '}
                          {item.reservedStock + Number(reserveQty)}
                        </p>
                      </div>
                    ) : null}

                    <FormField
                      control={reserveForm.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason</FormLabel>
                          <FormControl>
                            <Textarea rows={2} placeholder="Hold for order #..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isPending || item.availableStock === 0}>
                        {reserveMutation.isPending ? 'Saving...' : 'Reserve'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="release" className="mt-4">
                <Form {...releaseForm}>
                  <form
                    onSubmit={(event) => void releaseForm.handleSubmit(onReleaseSubmit)(event)}
                    className="space-y-4"
                  >
                    <FormField
                      control={releaseForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity to release</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={item.reservedStock}
                              step={1}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {item ? (
                      <div className="bg-muted/40 rounded-lg border p-3 text-sm">
                        <p className="text-muted-foreground mb-1 text-xs">After release</p>
                        <p className="tabular-nums">
                          Available {item.availableStock + Number(releaseQty)} · Reserved{' '}
                          {item.reservedStock - Number(releaseQty)}
                        </p>
                      </div>
                    ) : null}

                    <FormField
                      control={releaseForm.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason</FormLabel>
                          <FormControl>
                            <Textarea rows={2} placeholder="Order cancelled..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isPending || item.reservedStock === 0}>
                        {releaseMutation.isPending ? 'Saving...' : 'Release'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
