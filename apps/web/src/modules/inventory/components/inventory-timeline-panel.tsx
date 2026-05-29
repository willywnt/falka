'use client';

import { InventoryEventType } from '@prisma/client';

import { useInventoryHistoryQuery } from '../hooks/use-inventory';
import { InventoryEventsTable } from './inventory-events-table';
import { Skeleton } from '@/components/ui/skeleton';

import type { InventoryUrlFilters } from '../utils/inventory-url';

const EVENT_TYPE_OPTIONS = ['ALL', ...Object.values(InventoryEventType)] as const;

export function InventoryTimelinePanel({
  variantId,
  filters,
  onPatch,
  variants,
}: {
  variantId: string | null;
  filters: InventoryUrlFilters;
  onPatch: (patch: Partial<InventoryUrlFilters>) => void;
  variants: Array<{ id: string; sku: string; name: string }>;
}) {
  const eventType =
    filters.sortBy &&
    EVENT_TYPE_OPTIONS.includes(filters.sortBy as (typeof EVENT_TYPE_OPTIONS)[number])
      ? (filters.sortBy as InventoryEventType)
      : undefined;

  const historyQuery = useInventoryHistoryQuery(variantId, {
    limit: 50,
    type: eventType,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="timeline-variant">
            Variant
          </label>
          <select
            id="timeline-variant"
            className="border-input bg-background flex h-10 max-w-md rounded-md border px-3 py-2 text-sm"
            value={variantId ?? ''}
            onChange={(event) => onPatch({ variantId: event.target.value || undefined, page: 1 })}
          >
            <option value="">Select a SKU...</option>
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.sku} — {variant.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="timeline-type">
            Event type
          </label>
          <select
            id="timeline-type"
            className="border-input bg-background flex h-10 rounded-md border px-3 py-2 text-sm"
            value={filters.sortBy ?? 'ALL'}
            onChange={(event) =>
              onPatch({
                sortBy: event.target.value === 'ALL' ? undefined : event.target.value,
              })
            }
          >
            {EVENT_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type === 'ALL' ? 'All types' : type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!variantId ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">Select a variant</p>
          <p className="text-muted-foreground mt-1 text-sm">
            View the operational audit timeline for a specific SKU.
          </p>
        </div>
      ) : historyQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : historyQuery.error ? (
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm">
          Failed to load timeline.
        </div>
      ) : (
        <div className="space-y-3">
          {historyQuery.data ? (
            <p className="text-muted-foreground text-sm">
              Audit trail for <span className="font-mono font-medium">{historyQuery.data.sku}</span>{' '}
              — {historyQuery.data.events.length} events
            </p>
          ) : null}
          <InventoryEventsTable events={historyQuery.data?.events ?? []} />
        </div>
      )}
    </div>
  );
}
