'use client';

import { Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency, formatDateTime } from '@/lib/formatters';

import type { SaleDetail } from '../types';
import { paymentMethodLabel } from './pos-terminal';

/**
 * A 58mm-style struk for a counter sale, printable via the shared
 * `[data-print-root]` isolation (same mechanism as the QR label sheets).
 * Deliberately black-on-white regardless of theme — it's a paper artifact.
 */
export function ReceiptDialog({
  sale,
  open,
  onOpenChange,
}: {
  sale: SaleDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Struk penjualan</DialogTitle>
          <DialogDescription>
            Cetak atau simpan sebagai bukti pembayaran untuk pembeli.
          </DialogDescription>
        </DialogHeader>

        <div
          data-print-root
          className="mx-auto w-64 rounded-md border bg-white p-4 font-mono text-[11px] leading-relaxed text-zinc-900"
        >
          <div className="text-center">
            <p className="text-sm font-bold tracking-tight">Falka</p>
            <p>Struk penjualan</p>
          </div>

          <div className="my-2 border-t border-dashed border-zinc-400" />

          <div className="flex justify-between">
            <span>No.</span>
            <span>{sale.code}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span>Tanggal</span>
            <span suppressHydrationWarning className="text-right">
              {formatDateTime(sale.createdAt)}
            </span>
          </div>
          {sale.customerName ? (
            <div className="flex justify-between gap-2">
              <span>Pelanggan</span>
              <span className="max-w-36 truncate text-right">{sale.customerName}</span>
            </div>
          ) : null}

          <div className="my-2 border-t border-dashed border-zinc-400" />

          <div className="space-y-1.5">
            {sale.items.map((item) => (
              <div key={item.id}>
                <p className="break-words">
                  {item.name}
                  {item.bundleName ? ` (${item.bundleName})` : ''}
                </p>
                <div className="flex justify-between">
                  <span>
                    {item.quantity} x {formatCurrency(item.unitPrice)}
                  </span>
                  <span>{formatCurrency(item.lineTotal)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="my-2 border-t border-dashed border-zinc-400" />

          {Number(sale.discountAmount) > 0 || Number(sale.taxAmount) > 0 ? (
            <>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(sale.subtotalAmount)}</span>
              </div>
              {Number(sale.discountAmount) > 0 ? (
                <div className="flex justify-between">
                  <span>Diskon</span>
                  <span>-{formatCurrency(sale.discountAmount)}</span>
                </div>
              ) : null}
              {Number(sale.taxAmount) > 0 ? (
                <div className="flex justify-between">
                  <span>
                    PPN {sale.taxRate}%{sale.taxInclusive ? ' (termasuk)' : ''}
                  </span>
                  <span>{formatCurrency(sale.taxAmount)}</span>
                </div>
              ) : null}
            </>
          ) : null}

          <div className="flex justify-between text-xs font-bold">
            <span>Total</span>
            <span>{formatCurrency(sale.totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Pembayaran</span>
            <span>{paymentMethodLabel(sale.paymentMethod)}</span>
          </div>

          {sale.status === 'VOID' ? (
            <p className="mt-2 text-center font-bold">*** DIBATALKAN ***</p>
          ) : null}

          <div className="my-2 border-t border-dashed border-zinc-400" />
          <p className="text-center">Terima kasih sudah belanja!</p>
        </div>

        <DialogFooter>
          <Button onClick={() => window.print()}>
            <Printer className="size-4" />
            Cetak struk
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
