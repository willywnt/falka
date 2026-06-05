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
import type { ProductListItem } from '../types';
import { DeletionImpact } from './deletion-impact';

export function DeleteProductDialog({
  product,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: {
  product: ProductListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}) {
  const { data: blockers, isLoading } = useDeletionBlockersQuery(
    product?.id ?? '',
    null,
    open && Boolean(product),
  );

  if (!product) return null;

  const blocked = blockers?.blocked ?? false;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete product?</AlertDialogTitle>
          <AlertDialogDescription>
            This archives <span className="font-medium">{product.name}</span> and its{' '}
            {product.variantCount} variant{product.variantCount === 1 ? '' : 's'}. Stock history is
            kept; the product is hidden from your catalog.
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
            {isDeleting ? 'Deleting...' : 'Delete product'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
