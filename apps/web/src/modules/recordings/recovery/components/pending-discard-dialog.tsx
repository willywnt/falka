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

export function PendingDiscardDialog({
  noResi,
  open,
  onOpenChange,
  onConfirm,
  isDiscarding = false,
}: {
  noResi: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDiscarding?: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Buang rekaman dari perangkat ini?</AlertDialogTitle>
          <AlertDialogDescription>
            {noResi ? (
              <>
                Rekaman untuk no. resi <span className="num font-medium">{noResi}</span> bakal
                dihapus dari perangkat ini. Nggak bisa dibalikin lagi.
              </>
            ) : (
              'Rekaman lokal ini bakal dihapus dari perangkat ini. Nggak bisa dibalikin lagi.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDiscarding}>Batal</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDiscarding}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isDiscarding ? 'Membuang…' : 'Buang'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
