'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { useDisposeDamagedMutation } from '../hooks/use-inventory';

/**
 * Dispose (write off) units from a variant's damaged bucket — e.g. binned after a
 * return. Available is untouched; the quantity is capped at what's damaged.
 */
export function WriteOffDamagedDialog({
  variantId,
  variantLabel,
  damagedStock,
  open,
  onOpenChange,
}: {
  variantId: string;
  variantLabel: string;
  damagedStock: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const dispose = useDisposeDamagedMutation(variantId);
  const [quantity, setQuantity] = useState(String(damagedStock));
  const [note, setNote] = useState('');

  const parsed = Number(quantity);
  const isValid = Number.isInteger(parsed) && parsed >= 1 && parsed <= damagedStock;

  async function handleSubmit() {
    if (!isValid) return;
    try {
      await dispose.mutateAsync({ quantity: parsed, note: note.trim() || undefined });
      toast.success('Stok rusak dihapus', {
        description: `Menghapus ${parsed} unit.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error('Gagal hapus stok rusak', {
        description: error instanceof Error ? error.message : 'Ada yang error, coba lagi.',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Hapus stok rusak</DialogTitle>
          <DialogDescription>{variantLabel}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/40 flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">Stok rusak saat ini</span>
            <span className="num font-semibold">{damagedStock}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="writeoff-qty">Jumlah yang dibuang</Label>
            <Input
              id="writeoff-qty"
              type="number"
              min={1}
              max={damagedStock}
              step={1}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Hanya mengurangi stok rusak — stok tersedia tidak berubah.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="writeoff-note">Catatan (opsional)</Label>
            <Textarea
              id="writeoff-note"
              rows={2}
              placeholder="mis. dibuang, tidak bisa diperbaiki"
              value={note}
              maxLength={500}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={dispose.isPending}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleSubmit()}
            disabled={!isValid || dispose.isPending}
          >
            <Trash2 className="size-4" />
            {dispose.isPending ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
