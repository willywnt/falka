'use client';

import { Search, X } from 'lucide-react';

import type { InventoryUrlFilters } from '../utils/inventory-url';
import { ACTIVE_STATUS_FILTERS, STOCK_STATUS_FILTERS } from '../validators/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const STOCK_STATUS_LABELS: Record<(typeof STOCK_STATUS_FILTERS)[number], string> = {
  ALL: 'All stock',
  HEALTHY: 'Healthy',
  LOW_STOCK: 'Low stock',
  OUT_OF_STOCK: 'Out of stock',
};

const ACTIVE_LABELS: Record<(typeof ACTIVE_STATUS_FILTERS)[number], string> = {
  ALL: 'All status',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

export function InventoryFiltersBar({
  searchInput,
  onSearchChange,
  filters,
  onPatch,
  showStockFilter = false,
}: {
  searchInput: string;
  onSearchChange: (value: string) => void;
  filters: InventoryUrlFilters;
  onPatch: (patch: Partial<InventoryUrlFilters>) => void;
  showStockFilter?: boolean;
}) {
  const hasFilters =
    filters.search || filters.brand || filters.active !== 'ALL' || filters.stockStatus !== 'ALL';

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative max-w-md flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={searchInput}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search SKU, barcode, product..."
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="border-input bg-background h-9 rounded-md border px-3 text-sm"
          value={filters.active}
          onChange={(event) =>
            onPatch({
              active: event.target.value as InventoryUrlFilters['active'],
              page: 1,
            })
          }
        >
          {ACTIVE_STATUS_FILTERS.map((value) => (
            <option key={value} value={value}>
              {ACTIVE_LABELS[value]}
            </option>
          ))}
        </select>

        {showStockFilter ? (
          <select
            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
            value={filters.stockStatus}
            onChange={(event) =>
              onPatch({
                stockStatus: event.target.value as InventoryUrlFilters['stockStatus'],
                page: 1,
              })
            }
          >
            {STOCK_STATUS_FILTERS.map((value) => (
              <option key={value} value={value}>
                {STOCK_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        ) : null}

        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSearchChange('');
              onPatch({
                search: '',
                brand: undefined,
                active: 'ALL',
                stockStatus: 'ALL',
                page: 1,
              });
            }}
          >
            <X className="size-4" />
            Clear
          </Button>
        ) : null}
      </div>
    </div>
  );
}
