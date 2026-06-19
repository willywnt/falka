'use client';

import { useEffect, useMemo, useState, type ComponentType } from 'react';
import type { Route } from 'next';
import { useQuery } from '@tanstack/react-query';
import { Boxes, ClipboardCheck, Layers, ShoppingCart, Store, Truck } from 'lucide-react';

import { apiFetch } from '@/lib/api/fetch-client';
import { formatApiErrorMessage } from '@/lib/api/format-api-error';
import { apiRoutes } from '@/lib/api/routes';
import { stockOpnameKeys } from '@/modules/inventory/hooks/stock-opname-keys';
import type { StockOpnamesPage } from '@/modules/inventory/hooks/use-stock-opname';
import { useOrderByResiQuery } from '@/modules/orders/hooks/use-orders';
import { purchaseOrderKeys } from '@/modules/purchasing/hooks/purchase-order-keys';
import type { PurchaseOrderListItem } from '@/modules/purchasing/types';
import { saleKeys } from '@/modules/sales/hooks/sale-keys';
import { useSellableVariantsQuery, type SalesPage } from '@/modules/sales/hooks/use-sales';
import type { ScannedSaleItem } from '@/modules/sales/types';

import { codeCandidateFlags, matchCodeHits, MAX_CODE_HITS } from './entity-jump-match';

/*
 * Entity lookups for the command palette: a typed/scanned code or fragment
 * (sale, PO, opname, resi, SKU/product name) resolves to real records and
 * becomes "Lompat ke" jump entries. Matching is SQL-LIKE `contains`, so "001"
 * surfaces S00001/PO00012/…; products match by partial SKU OR name. Every
 * lookup is enabled-gated on the query's shape so nothing fetches until the
 * query actually looks like that kind of code.
 */

/** One palette "Lompat ke" hit — a real record the typed/scanned code points at. */
export type EntityJumpEntry = {
  id: string;
  title: string;
  icon: ComponentType<{ className?: string }>;
  href: Route;
};

const LOOKUP_STALE_TIME = 30_000;

/** Debounce the candidate code so lookups only fire once typing pauses. */
function useDebouncedCode(code: string, delayMs = 300): string {
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    if (!code) {
      setDebounced('');
      return;
    }
    const timer = setTimeout(() => setDebounced(code), delayMs);
    return () => clearTimeout(timer);
  }, [code, delayMs]);

  return debounced;
}

/**
 * Resolve a code-looking palette query to jump entries. Pass '' to turn the
 * whole thing off (the palette only passes space-free 3–64 char queries that
 * don't already match a menu entry).
 */
export function useEntityJump(code: string): {
  entries: readonly EntityJumpEntry[];
  isLooking: boolean;
} {
  const debounced = useDebouncedCode(code.trim());
  const lower = debounced.toLowerCase();

  const {
    sale: saleEnabled,
    purchase: purchaseEnabled,
    opname: opnameEnabled,
  } = codeCandidateFlags(debounced);
  const isResiCandidate = debounced.length >= 6;
  const isVariantCandidate = debounced.length >= 3 && debounced.length <= 64;

  // Lazily look these up only when the code shape says it could be one. Sales
  // search server-side by code/customer (then we LIKE-match the code so only
  // code hits become jump entries); the PO dashboard list is small enough to
  // share its cache and match client-side.
  const salesQuery = useQuery({
    queryKey: [...saleKeys.all, 'lookup', lower] as const,
    queryFn: async () => {
      const result = await apiFetch<SalesPage>(apiRoutes.sales, {
        params: { page: 1, pageSize: MAX_CODE_HITS, search: debounced },
      });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    enabled: saleEnabled,
    staleTime: LOOKUP_STALE_TIME,
    retry: false,
  });

  const purchaseQuery = useQuery({
    queryKey: purchaseOrderKeys.list,
    queryFn: async () => {
      const result = await apiFetch<PurchaseOrderListItem[]>(apiRoutes.purchaseOrders);
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    enabled: purchaseEnabled,
    staleTime: LOOKUP_STALE_TIME,
    retry: false,
  });

  const opnameQuery = useQuery({
    queryKey: [...stockOpnameKeys.all, 'lookup', lower] as const,
    queryFn: async () => {
      // The opname list searches code/note server-side; we still LIKE-match the
      // code client-side so only code hits become jump entries.
      const result = await apiFetch<StockOpnamesPage>(`${apiRoutes.inventory}/opname`, {
        params: { page: 1, pageSize: 20, search: debounced },
      });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    enabled: opnameEnabled,
    staleTime: LOOKUP_STALE_TIME,
    retry: false,
  });

  // Any longer code might be a tracking number — the by-resi endpoint returns
  // null (not an error) when nothing matches.
  const orderQuery = useOrderByResiQuery(isResiCandidate ? debounced : null, isResiCandidate);

  // Products match by partial SKU OR name (the POS search endpoint, LIKE).
  const variantsQuery = useSellableVariantsQuery(
    isVariantCandidate ? debounced : '',
    1,
    MAX_CODE_HITS,
    isVariantCandidate,
  );

  // A scan additionally resolves an EXACT barcode/SKU to a variant OR a bundle —
  // the search endpoint can't see barcodes or bundles, so this stays.
  const scanQuery = useQuery({
    queryKey: [...saleKeys.all, 'palette-resolve', lower] as const,
    queryFn: async () => {
      const result = await apiFetch<ScannedSaleItem | null>(`${apiRoutes.sales}/variants/resolve`, {
        params: { code: debounced },
      });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    enabled: isVariantCandidate,
    staleTime: LOOKUP_STALE_TIME,
    retry: false,
  });

  // Match inside the memo so the (freshly-built) hit arrays don't re-trigger it
  // every render — it tracks the stable React-Query `.data` refs + shape flags.
  const salesData = salesQuery.data;
  const purchaseData = purchaseQuery.data;
  const opnameData = opnameQuery.data;
  const orderData = orderQuery.data;
  const variantData = variantsQuery.data;
  const scanData = scanQuery.data;

  const entries = useMemo<readonly EntityJumpEntry[]>(() => {
    const hits: EntityJumpEntry[] = [];

    const saleHits = saleEnabled ? matchCodeHits(salesData?.items, debounced) : [];
    const purchaseHits = purchaseEnabled ? matchCodeHits(purchaseData, debounced) : [];
    const opnameHits = opnameEnabled ? matchCodeHits(opnameData?.items, debounced) : [];
    const orderHit = isResiCandidate ? (orderData ?? null) : null;
    const variantHits = isVariantCandidate ? (variantData?.items ?? []) : [];
    const scanHit = isVariantCandidate ? (scanData ?? null) : null;

    for (const sale of saleHits) {
      hits.push({
        id: `jump:sale:${sale.id}`,
        title: `Buka penjualan ${sale.code}`,
        icon: Store,
        href: `/dashboard/sales/${sale.id}` as Route,
      });
    }
    for (const po of purchaseHits) {
      hits.push({
        id: `jump:purchase:${po.id}`,
        title: `Buka pembelian ${po.code}`,
        icon: Truck,
        href: `/dashboard/purchasing/${po.id}` as Route,
      });
    }
    for (const opname of opnameHits) {
      hits.push({
        id: `jump:opname:${opname.id}`,
        title: `Buka opname ${opname.code}`,
        icon: ClipboardCheck,
        href: `/dashboard/inventory/opname/${opname.id}` as Route,
      });
    }
    if (orderHit) {
      hits.push({
        id: `jump:order:${orderHit.id}`,
        title: `Buka pesanan ${orderHit.externalOrderId} · resi ${debounced}`,
        icon: ShoppingCart,
        href: `/dashboard/orders/${orderHit.id}` as Route,
      });
    }

    // Variants from the LIKE search; the inventory list pre-filters to the SKU
    // (the POS shapes don't expose the productId for a direct product link).
    const variantIds = new Set<string>();
    for (const variant of variantHits) {
      variantIds.add(variant.variantId);
      hits.push({
        id: `jump:variant:${variant.variantId}`,
        title: `Buka produk ${variant.name} · ${variant.sku}`,
        icon: Boxes,
        href: `/dashboard/inventory?search=${encodeURIComponent(variant.sku)}` as Route,
      });
    }

    if (scanHit) {
      if (scanHit.kind === 'bundle') {
        hits.push({
          id: `jump:bundle:${scanHit.bundle.id}`,
          title: `Buka bundel ${scanHit.bundle.name} · ${scanHit.bundle.sku}`,
          icon: Layers,
          href: `/dashboard/bundles?search=${encodeURIComponent(scanHit.bundle.sku)}` as Route,
        });
      } else if (!variantIds.has(scanHit.variant.variantId)) {
        // An exact barcode hit the search (SKU/name only) wouldn't have found.
        hits.push({
          id: `jump:variant:${scanHit.variant.variantId}`,
          title: `Buka produk ${scanHit.variant.name} · ${scanHit.variant.sku}`,
          icon: Boxes,
          href: `/dashboard/inventory?search=${encodeURIComponent(scanHit.variant.sku)}` as Route,
        });
      }
    }

    return hits;
  }, [
    saleEnabled,
    purchaseEnabled,
    opnameEnabled,
    isResiCandidate,
    isVariantCandidate,
    salesData,
    purchaseData,
    opnameData,
    orderData,
    variantData,
    scanData,
    debounced,
  ]);

  // isLoading = actually fetching with nothing cached yet (a disabled query is
  // "pending" too, so gate each one on its own shape check).
  const isLooking =
    (saleEnabled && salesQuery.isLoading) ||
    (purchaseEnabled && purchaseQuery.isLoading) ||
    (opnameEnabled && opnameQuery.isLoading) ||
    (isResiCandidate && orderQuery.isLoading) ||
    (isVariantCandidate && (variantsQuery.isLoading || scanQuery.isLoading));

  return { entries, isLooking };
}
