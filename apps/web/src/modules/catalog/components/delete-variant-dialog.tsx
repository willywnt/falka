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

import { useDeletionBlockersQuery } from '../hooks/use-products';
import { DeletionImpact } from './deletion-impact';

export function DeleteVariantDialog({
  productId,
  variantIds,
  kind,
  label,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: {
  productId: string;
  /** Leaf ids to archive — one row, or every leaf of a group. */
  variantIds: string[];
  /** Drives the title: a standalone/grouped variant, or a single subvariant. */
  kind: 'variant' | 'subvariant';
  /** Display name, e.g. "iPhone 16" or "iPhone 16 · Hitam". */
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}) {
  const { data: blockers, isLoading } = useDeletionBlockersQuery(
    productId,
    variantIds,
    open && variantIds.length > 0,
  );

  const count = variantIds.length;
  const blocked = blockers?.blocked ?? false;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Hapus {kind === 'subvariant' ? 'subvarian' : 'varian'}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Ini mengarsipkan <span className="font-medium">{label}</span>
            {count > 1 ? ` beserta ${count} subvariannya` : ''}. Riwayat stok tetap disimpan;{' '}
            {count === 1 ? 'SKU-nya bisa' : 'SKU-nya bisa'} dipakai lagi.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <DeletionImpact blockers={blockers} isLoading={isLoading} />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
          <AlertDialogAction
            disabled={isDeleting || isLoading || blocked}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Menghapus...' : 'Hapus'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
