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
  label,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: {
  productId: string;
  /** Leaf ids to archive — one row, or every leaf of a group. */
  variantIds: string[];
  /** Reads inside "This archives …", e.g. `“Hitam”` or `the “iPhone 16” group`. */
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
            Delete {count === 1 ? 'variant' : `${count} subvariants`}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This archives {label}. Stock history is kept; the SKU{count === 1 ? '' : 's'} free up
            for reuse.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <DeletionImpact blockers={blockers} isLoading={isLoading} />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isDeleting || isLoading || blocked}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
