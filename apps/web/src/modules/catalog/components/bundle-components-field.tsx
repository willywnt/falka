'use client';

import { useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { ImageThumb } from '@/components/image-thumb';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

import { useLabelVariantsQuery } from '../hooks/use-products';
import type { LabelVariant } from '../types';

export type BundleComponentDraft = {
  productVariantId: string;
  sku: string;
  name: string;
  quantity: number;
  /** Present on the edit screen (live stock); absent while creating. */
  availableStock?: number;
};

/** Search variants and edit a bundle's component lines (qty per bundle). Shared by create + edit. */
export function BundleComponentsField({
  value,
  onChange,
}: {
  value: BundleComponentDraft[];
  onChange: (next: BundleComponentDraft[]) => void;
}) {
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search.trim(), 300);
  const { data, isLoading } = useLabelVariantsQuery(debounced, 1, 8);

  const selectedIds = new Set(value.map((component) => component.productVariantId));
  const results = (data?.items ?? []).filter((item) => !selectedIds.has(item.variantId));

  function add(item: LabelVariant) {
    onChange([
      ...value,
      { productVariantId: item.variantId, sku: item.sku, name: item.name, quantity: 1 },
    ]);
    setSearch('');
  }

  function setQuantity(id: string, quantity: number) {
    onChange(
      value.map((component) =>
        component.productVariantId === id
          ? { ...component, quantity: Math.max(1, quantity) }
          : component,
      ),
    );
  }

  function remove(id: string) {
    onChange(value.filter((component) => component.productVariantId !== id));
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari varian untuk ditambahkan sebagai komponen…"
          className="pl-8"
        />
      </div>

      {search.trim() ? (
        <div className="max-h-44 overflow-y-auto rounded-lg border">
          {isLoading ? (
            <p className="text-muted-foreground p-3 text-sm">Mencari…</p>
          ) : results.length === 0 ? (
            <p className="text-muted-foreground p-3 text-sm">Tidak ada varian yang cocok.</p>
          ) : (
            <ul className="divide-y">
              {results.map((item) => (
                <li key={item.variantId}>
                  <button
                    type="button"
                    onClick={() => add(item)}
                    className="hover:bg-muted/50 flex w-full items-center gap-3 p-2.5 text-left text-sm"
                  >
                    <ImageThumb src={item.imageUrl} alt={item.name} />
                    <span className="min-w-0 flex-1">
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

      {value.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
          Belum ada komponen. Cari di atas untuk menambahkan isi bundel ini.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {value.map((component) => (
            <li
              key={component.productVariantId}
              className="flex items-center justify-between gap-3 p-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{component.name}</div>
                <div className="text-muted-foreground truncate text-xs">
                  {component.sku}
                  {component.availableStock !== undefined
                    ? ` · ${component.availableStock} tersedia`
                    : ''}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20">
                  <NumberInput
                    value={component.quantity}
                    onChange={(value_) => setQuantity(component.productVariantId, value_)}
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:text-destructive size-8"
                  onClick={() => remove(component.productVariantId)}
                >
                  <Trash2 className="size-4" />
                  <span className="sr-only">Hapus</span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
