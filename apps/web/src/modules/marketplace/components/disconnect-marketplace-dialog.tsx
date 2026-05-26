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
          <AlertDialogTitle>Disconnect marketplace store?</AlertDialogTitle>
          <AlertDialogDescription>
            This will deactivate{' '}
            <span className="font-medium">{connection.shopName}</span> (
            {getMarketplaceProviderLabel(connection.provider)}). Credentials stay encrypted in your
            account and can be reconnected later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDisconnecting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isDisconnecting}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDisconnecting ? 'Disconnecting...' : 'Disconnect store'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
