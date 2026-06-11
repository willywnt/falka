'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useScannerPairingStore } from '../store/scanner-pairing.store';

type RecordingCountdownModalProps = {
  onCancel: () => void;
  onStartNow: () => void;
};

export function RecordingCountdownModal({ onCancel, onStartNow }: RecordingCountdownModalProps) {
  const open = useScannerPairingStore((s) => s.countdownOpen);
  const barcode = useScannerPairingStore((s) => s.countdownBarcode);
  const seconds = useScannerPairingStore((s) => s.countdownSeconds);
  const blockReason = useScannerPairingStore((s) => s.blockReason);

  const canStart = !blockReason;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-xs"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-1 px-6 pt-6 text-center">
          <DialogTitle className="text-base">
            {blockReason ? 'Tidak bisa memulai rekaman' : 'Memulai rekaman'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Hitung mundur sebelum rekaman dimulai untuk no. resi yang dipindai
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 text-center" role="status" aria-live="polite">
          <p className="font-mono text-sm font-semibold tracking-wide">{barcode}</p>

          {blockReason ? (
            <p className="text-destructive mt-4 text-sm">{blockReason}</p>
          ) : (
            <p className="text-primary num mt-4 text-7xl leading-none font-bold" key={seconds}>
              {seconds}
            </p>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 border-t px-6 py-4 sm:flex-col">
          {canStart ? (
            <Button type="button" className="w-full" onClick={onStartNow}>
              Mulai sekarang
            </Button>
          ) : null}
          <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
            Batal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
