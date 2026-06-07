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
      toast.success('Pesanan ditandai terkirim', {
        description: 'Stok yang dipesan langsung dipotong.',
      });
      close();
    } catch (error) {
      toast.error('Gagal menandai terkirim', {
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
    }
  }

  async function handleSaveResi() {
    try {
      await setOrderResi.mutateAsync({ noResi: resi.trim() });
      toast.success('No. resi diperbarui');
      close();
    } catch (error) {
      toast.error('Gagal memperbarui no. resi', {
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
    }
  }

  async function handleCancel() {
    try {
      const trimmed = reason.trim();
      await cancelOrder.mutateAsync(trimmed ? { reason: trimmed } : {});
      toast.success('Pesanan dibatalkan', { description: 'Stok yang dipesan dilepas lagi.' });
      close();
    } catch (error) {
      toast.error('Gagal membatalkan pesanan', {
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="size-4" />
            Aksi
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
              Tandai terkirim
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
              Ubah no. resi
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
              Batalkan pesanan
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialog === 'ship'} onOpenChange={(open) => !open && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tandai terkirim</DialogTitle>
            <DialogDescription>
              Stok yang dipesan langsung dipotong. Isi no. resi sekarang atau kosongin dulu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="ship-resi">No. resi (opsional)</Label>
            <Input
              id="ship-resi"
              value={resi}
              onChange={(event) => setResi(event.target.value)}
              placeholder="mis. JX1234567890"
              maxLength={64}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={busy}>
              Batal
            </Button>
            <Button onClick={() => void handleShip()} disabled={busy}>
              <Truck className="size-4" />
              {markShipped.isPending ? 'Menandai...' : 'Tandai terkirim'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'resi'} onOpenChange={(open) => !open && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah no. resi</DialogTitle>
            <DialogDescription>
              Isi atau perbaiki no. resi pesanan ini. Tapi ingat, tarik pesanan dari marketplace
              berikutnya bisa menimpanya lagi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="edit-resi">No. resi</Label>
            <Input
              id="edit-resi"
              value={resi}
              onChange={(event) => setResi(event.target.value)}
              placeholder="mis. JX1234567890"
              maxLength={64}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={busy}>
              Batal
            </Button>
            <Button
              onClick={() => void handleSaveResi()}
              disabled={busy || resi.trim().length === 0}
            >
              {setOrderResi.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={dialog === 'cancel'} onOpenChange={(open) => !open && close()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan pesanan {order.externalOrderId}?</AlertDialogTitle>
            <AlertDialogDescription>
              Stok yang dipesan bakal dilepas lagi ke stok tersedia, dan ini nggak bisa dibatalkan.
              Cuma batalin kalau barang belum dikirim — kalau sudah dikirim, buka retur aja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Alasan (opsional)</Label>
            <Textarea
              id="cancel-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="mis. Pembeli minta dibatalkan"
              maxLength={500}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Nggak jadi</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(event) => {
                event.preventDefault();
                void handleCancel();
              }}
            >
              {cancelOrder.isPending ? 'Membatalkan...' : 'Batalkan pesanan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
