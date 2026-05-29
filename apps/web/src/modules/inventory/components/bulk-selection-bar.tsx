'use client';

import { useInventoryUiStore } from '../store/inventory-ui.store';
import { Button } from '@/components/ui/button';

export function BulkSelectionBar() {
  const selectedVariantIds = useInventoryUiStore((state) => state.selectedVariantIds);
  const clearSelection = useInventoryUiStore((state) => state.clearSelection);

  if (selectedVariantIds.length === 0) return null;

  return (
    <div className="bg-muted/50 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
      <p className="text-sm">
        <span className="font-medium">{selectedVariantIds.length}</span> SKU
        {selectedVariantIds.length === 1 ? '' : 's'} selected
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled title="Bulk adjustment coming soon">
          Bulk adjust (soon)
        </Button>
        <Button variant="ghost" size="sm" onClick={clearSelection}>
          Clear selection
        </Button>
      </div>
    </div>
  );
}
