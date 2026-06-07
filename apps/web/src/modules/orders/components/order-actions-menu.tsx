'use client';

import { useState } from 'react';
import { Ban, MoreHorizontal, Tag, Truck } from 'lucide-react';
import { toast } from 'sonner';

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import {
  useCancelOrderMutation,
  useMarkOrderShippedMutation,
  useSetOrderResiMutation,
} from '../hooks/use-orders';
import type { OrderDetail } from '../types';

type ActiveDialog = 'ship' | 'resi' | 'cancel' | null;

/**
 * Manual overrides for an order pulled from a marketplace: mark it shipped, fix the
 * tracking number, or cancel (pre-ship) with a reason. Each drives the existing
 * reserve/ship/release stock lifecycle in the service.
 */
export function OrderActionsMenu({ order }: { order: OrderDetail }) {
  const [dialog, setDialog] = useState<ActiveDialog>(null);
  const [resi, setResi] = useState(order.noResi ?? '');
  const [reason, setReason] = useState('');

  const markShipped = useMarkOrderShippedMutation(order.id);
  const setOrderResi = useSetOrderResiMutation(order.id);
  const cancelOrder = useCancelOrderMutation(order.id);

  const canShip = order.status === 'PAID';
  const canEditResi = order.status === 'PAID' || order.status === 'SHIPPED';
  const canCancel = order.status === 'PAID' || order.status === 'PENDING';

  if (!canShip && !canEditResi && !canCancel) return null;

  const busy = markShipped.isPending || setOrderResi.isPending || cancelOrder.isPending;

  function close() {
    setDialog(null);
  }

  async function handleShip() {
    try {
      const trimmed = resi.trim();
      await markShipped.mutateAsync(trimmed ? { noResi: trimmed } : {});
      toast.success('Order marked shipped', { description: 'The reservation was consumed.' });
      close();
    } catch (error) {
      toast.error('Could not mark shipped', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async function handleSaveResi() {
    try {
      await setOrderResi.mutateAsync({ noResi: resi.trim() });
      toast.success('Tracking number updated');
      close();
    } catch (error) {
      toast.error('Could not update tracking number', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async function handleCancel() {
    try {
      const trimmed = reason.trim();
      await cancelOrder.mutateAsync(trimmed ? { reason: trimmed } : {});
      toast.success('Order cancelled', { description: 'Any reserved stock was released.' });
      close();
    } catch (error) {
      toast.error('Could not cancel order', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="size-4" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canShip ? (
            <DropdownMenuItem
              onSelect={() => {
                setResi(order.noResi ?? '');
                setDialog('ship');
              }}
            >
              <Truck className="size-4" />
              Mark as shipped
            </DropdownMenuItem>
          ) : null}
          {canEditResi ? (
            <DropdownMenuItem
              onSelect={() => {
                setResi(order.noResi ?? '');
                setDialog('resi');
              }}
            >
              <Tag className="size-4" />
              Edit tracking no.
            </DropdownMenuItem>
          ) : null}
          {canCancel ? (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => {
                setReason('');
                setDialog('cancel');
              }}
            >
              <Ban className="size-4" />
              Cancel order
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialog === 'ship'} onOpenChange={(open) => !open && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as shipped</DialogTitle>
            <DialogDescription>
              Consumes the stock reservation for this order. Add a tracking number now or leave it
              blank.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="ship-resi">Tracking number (optional)</Label>
            <Input
              id="ship-resi"
              value={resi}
              onChange={(event) => setResi(event.target.value)}
              placeholder="e.g. JX1234567890"
              maxLength={64}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => void handleShip()} disabled={busy}>
              <Truck className="size-4" />
              {markShipped.isPending ? 'Marking...' : 'Mark shipped'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'resi'} onOpenChange={(open) => !open && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit tracking number</DialogTitle>
            <DialogDescription>
              Set or correct this order&apos;s tracking number. A later marketplace pull may
              overwrite it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="edit-resi">Tracking number</Label>
            <Input
              id="edit-resi"
              value={resi}
              onChange={(event) => setResi(event.target.value)}
              placeholder="e.g. JX1234567890"
              maxLength={64}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={busy}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleSaveResi()}
              disabled={busy || resi.trim().length === 0}
            >
              {setOrderResi.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={dialog === 'cancel'} onOpenChange={(open) => !open && close()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel order {order.externalOrderId}?</AlertDialogTitle>
            <AlertDialogDescription>
              Any stock reserved for this order is released back to available. This can&apos;t be
              undone. Cancel only before the goods ship — after shipping, open a return instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Reason (optional)</Label>
            <Textarea
              id="cancel-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. Buyer requested cancellation"
              maxLength={500}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Keep order</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(event) => {
                event.preventDefault();
                void handleCancel();
              }}
            >
              {cancelOrder.isPending ? 'Cancelling...' : 'Cancel order'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
