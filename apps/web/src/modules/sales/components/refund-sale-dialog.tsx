'use client';

import { useState } from 'react';
import { Undo2 } from 'lucide-react';
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
import { NumberInput } from '@/components/ui/number-input';
import { formatCurrency } from '@/lib/formatters';

import { useRefundSaleMutation } from '../hooks/use-sales';
import { refundLineAmount } from '../utils/sale-totals';
import type { SaleDetail, SaleItemDetail } from '../types';

function remainingQty(item: SaleItemDetail): number {
  return Math.max(0, item.quantity - item.refundedQuantity);
}

/**
 * Per-item refund: pick quantities, see the cash to hand back (same math as
 * the server), confirm. Refunded units return to sellable stock.
 */
export function RefundSaleDialog({
  sale,
  open,
  onOpenChange,
}: {
  sale: SaleDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [note, setNote] = useState('');
  const refundMutation = useRefundSaleMutation(sale.id);

  const refundableItems = sale.items.filter((item) => remainingQty(item) > 0);

  const selected = refundableItems
    .map((item) => ({ item, quantity: quantities[item.id] ?? 0 }))
    .filter((entry) => entry.quantity > 0);

  const previewTotal = selected.reduce(
    (sum, entry) =>
      sum +
      refundLineAmount(
        {
          unitPrice: Number(entry.item.unitPrice),
          quantity: entry.item.quantity,
          discountAmount: Number(entry.item.discountAmount),
        },
        entry.quantity,
        sale.taxRate,
        sale.taxInclusive,
      ),
    0,
  );

  function handleOpenChange(next: boolean) {
    if (!next) {
      setQuantities({});
      setNote('');
    }
    onOpenChange(next);
  }

  async function handleSubmit() {
    try {
      await refundMutation.mutateAsync({
        items: selected.map((entry) => ({ saleItemId: entry.item.id, quantity: entry.quantity })),
        note: note.trim() || undefined,
      });
      toast.success('Refund tercatat', {
        description: `${formatCurrency(previewTotal)} dikembalikan · stok bertambah lagi`,
      });
      handleOpenChange(false);
    } catch (error) {
      toast.error('Gagal memproses refund', {
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Refund penjualan <span className="num">{sale.code}</span>
          </DialogTitle>
          <DialogDescription>
            Pilih jumlah per item. Barang yang di-refund kembali ke stok tersedia, dan nilai uangnya
            dihitung dari harga net (setelah diskon{sale.taxRate > 0 ? ' + PPN' : ''}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {refundableItems.map((item) => {
            const max = remainingQty(item);
            const quantity = quantities[item.id] ?? 0;
            return (
              <div
                key={item.id}
                className="flex items-end justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-muted-foreground text-xs">
                    <span className="num">{item.sku}</span> · sisa bisa di-refund{' '}
                    <span className="num">{max}</span>
                    {item.refundedQuantity > 0 ? (
                      <>
                        {' '}
                        · <span className="num">{item.refundedQuantity}</span> sudah di-refund
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="w-20 shrink-0 space-y-1">
                  <Label htmlFor={`refund-qty-${item.id}`} className="text-xs">
                    Qty
                  </Label>
                  <NumberInput
                    id={`refund-qty-${item.id}`}
                    value={quantity}
                    onChange={(value) =>
                      setQuantities((prev) => ({
                        ...prev,
                        [item.id]: Math.min(max, Math.max(0, value)),
                      }))
                    }
                  />
                </div>
              </div>
            );
          })}

          <div className="space-y-1.5">
            <Label htmlFor="refund-note">Catatan (opsional)</Label>
            <Input
              id="refund-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Alasan refund…"
            />
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-muted-foreground text-sm">Uang dikembalikan</span>
            <span className="num text-lg font-semibold">{formatCurrency(previewTotal)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={selected.length === 0 || refundMutation.isPending}
          >
            <Undo2 className="size-4" />
            {refundMutation.isPending ? 'Memproses…' : 'Proses refund'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
