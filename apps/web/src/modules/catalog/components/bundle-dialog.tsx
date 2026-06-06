'use client';

import { useEffect, useState } from 'react';
import { Boxes, Loader2, Plus, Search, Trash2 } from 'lucide-react';
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
import { EmptyState } from '@/components/empty-state';

import { useBundleQuery, useLabelVariantsQuery, useSetBundleMutation } from '../hooks/use-products';
import type { ProductVariantItem } from '../types';

type DraftComponent = {
  componentVariantId: string;
  sku: string;
  name: string;
  quantity: number;
};

function BundleDialogBody({
  productId,
  variant,
  onClose,
}: {
  productId: string;
  variant: ProductVariantItem;
  onClose: () => void;
}) {
  const bundleQuery = useBundleQuery(productId, variant.id, true);
  const setMutation = useSetBundleMutation(productId, variant.id);

  const [components, setComponents] = useState<DraftComponent[]>([]);
  const [search, setSearch] = useState('');
  const searchQuery = useLabelVariantsQuery(search.trim(), 1, 8);

  // Seed the draft from the saved bundle once it loads.
  useEffect(() => {
    if (bundleQuery.data) {
      setComponents(
        bundleQuery.data.components.map((component) => ({
          componentVariantId: component.componentVariantId,
          sku: component.sku,
          name: component.name,
          quantity: component.quantity,
        })),
      );
    }
  }, [bundleQuery.data]);

  const selectedIds = new Set(components.map((component) => component.componentVariantId));
  const results = (searchQuery.data?.items ?? []).filter(
    (item) => item.variantId !== variant.id && !selectedIds.has(item.variantId),
  );

  function addComponent(componentVariantId: string, sku: string, name: string) {
    setComponents((prev) => [...prev, { componentVariantId, sku, name, quantity: 1 }]);
    setSearch('');
  }

  function setQuantity(componentVariantId: string, quantity: number) {
    setComponents((prev) =>
      prev.map((component) =>
        component.componentVariantId === componentVariantId
          ? { ...component, quantity: Math.max(1, quantity || 1) }
          : component,
      ),
    );
  }

  function removeComponent(componentVariantId: string) {
    setComponents((prev) =>
      prev.filter((component) => component.componentVariantId !== componentVariantId),
    );
  }

  async function handleSave() {
    try {
      await setMutation.mutateAsync({
        components: components.map((component) => ({
          componentVariantId: component.componentVariantId,
          quantity: component.quantity,
        })),
      });
      toast.success(
        components.length === 0 ? 'Bundle cleared' : 'Bundle saved',
        components.length === 0
          ? undefined
          : { description: 'Selling this variant now decrements its components.' },
      );
      onClose();
    } catch (error) {
      toast.error('Could not save bundle', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search a variant to add as a component…"
            className="pl-8"
          />
        </div>
        {search.trim() ? (
          <div className="max-h-44 overflow-y-auto rounded-lg border">
            {searchQuery.isLoading ? (
              <p className="text-muted-foreground p-3 text-sm">Searching…</p>
            ) : results.length === 0 ? (
              <p className="text-muted-foreground p-3 text-sm">No matching variants.</p>
            ) : (
              <ul className="divide-y">
                {results.map((item) => (
                  <li key={item.variantId}>
                    <button
                      type="button"
                      onClick={() => addComponent(item.variantId, item.sku, item.name)}
                      className="hover:bg-muted/50 flex w-full items-center justify-between gap-2 p-2.5 text-left text-sm"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{item.name}</span>
                        <span className="text-muted-foreground block truncate text-xs">
                          {item.productName} · {item.sku}
                        </span>
                      </span>
                      <Plus className="text-muted-foreground size-4 shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>

      {components.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Not a bundle yet"
          description="Add component variants above. Selling this variant will decrement each component's stock instead of its own."
        />
      ) : (
        <ul className="divide-y rounded-lg border">
          {components.map((component) => (
            <li
              key={component.componentVariantId}
              className="flex items-center justify-between gap-3 p-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{component.name}</div>
                <div className="text-muted-foreground truncate text-xs">{component.sku}</div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={component.quantity}
                  onChange={(event) =>
                    setQuantity(component.componentVariantId, Number(event.target.value))
                  }
                  className="h-8 w-16 text-right tabular-nums"
                  aria-label="Quantity per bundle"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive size-8"
                  onClick={() => removeComponent(component.componentVariantId)}
                >
                  <Trash2 className="size-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={setMutation.isPending}>
          Cancel
        </Button>
        <Button onClick={() => void handleSave()} disabled={setMutation.isPending}>
          {setMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {components.length === 0 ? 'Clear bundle' : 'Save bundle'}
        </Button>
      </DialogFooter>
    </div>
  );
}

type BundleDialogProps = {
  productId: string;
  variant: ProductVariantItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BundleDialog({ productId, variant, open, onOpenChange }: BundleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bundle components</DialogTitle>
          <DialogDescription>
            {variant
              ? `Define what "${variant.name}" consumes when sold. Components are decremented; the bundle keeps no stock of its own.`
              : null}
          </DialogDescription>
        </DialogHeader>
        {variant ? (
          <BundleDialogBody
            productId={productId}
            variant={variant}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
