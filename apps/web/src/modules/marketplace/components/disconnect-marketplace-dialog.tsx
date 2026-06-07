'use client';

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

import { getMarketplaceProviderLabel } from '../utils/provider-display';
import type { MarketplaceConnectionListItem } from '../types';

export function DisconnectMarketplaceDialog({
  connection,
  open,
  onOpenChange,
  onConfirm,
  isDisconnecting,
}: {
  connection: MarketplaceConnectionListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDisconnecting?: boolean;
}) {
  if (!connection) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Putuskan koneksi toko marketplace?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium">{connection.shopName}</span> (
            {getMarketplaceProviderLabel(connection.provider)}) akan dinonaktifkan. Kredensialnya
            tetap tersimpan terenkripsi di akunmu, jadi bisa dihubungkan lagi kapan saja.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDisconnecting}>Batal</AlertDialogCancel>
          <AlertDialogAction
            disabled={isDisconnecting}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDisconnecting ? 'Memutuskan...' : 'Putuskan koneksi'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
