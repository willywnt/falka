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
import type { SaleListItem, ScannedSaleItem } from '@/modules/sales/types';

/*
 * Entity lookups for the command palette: a typed/scanned code (sale, PO,
 * opname, resi, SKU/barcode) resolves to a real record and becomes a
 * "Lompat ke" jump entry. Every lookup is enabled-gated on the code's shape so
 * nothing fetches until the query actually looks like that kind of code.
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

  const isSaleCode = /^s\d{3,}$/i.test(debounced);
  const isPurchaseCode = /^po\d{3,}$/i.test(debounced);
  const isOpnameCode = /^op\d{3,}$/i.test(debounced);
  const isResiCandidate = debounced.length >= 6;
  const isVariantCandidate = debounced.length >= 3 && debounced.length <= 64;

  // The sales/PO dashboards already fetch these full lists under the same query
  // keys — we share their cache and only fetch lazily when the code shape says
  // it could be one, then match the code client-side.
  const salesQuery = useQuery({
    queryKey: saleKeys.list,
    queryFn: async () => {
      const result = await apiFetch<SaleListItem[]>(apiRoutes.sales);
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    enabled: isSaleCode,
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
    enabled: isPurchaseCode,
    staleTime: LOOKUP_STALE_TIME,
    retry: false,
  });

  const opnameQuery = useQuery({
    queryKey: [...stockOpnameKeys.all, 'lookup', lower] as const,
    queryFn: async () => {
      // `search` is forward-compatible (the API ignores it until it learns the
      // param); the hit is verified client-side either way.
      const result = await apiFetch<StockOpnamesPage>(`${apiRoutes.inventory}/opname`, {
        params: { page: 1, pageSize: 5, search: debounced },
      });
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
    enabled: isOpnameCode,
    staleTime: LOOKUP_STALE_TIME,
    retry: false,
  });

  // Any longer code might be a tracking number — the by-resi endpoint returns
  // null (not an error) when nothing matches.
  const orderQuery = useOrderByResiQuery(isResiCandidate ? debounced : null, isResiCandidate);

  // Any code might be a SKU/barcode — the POS resolver answers a variant OR a
  // bundle, or null.
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

  const saleHit = isSaleCode
    ? salesQuery.data?.find((sale) => sale.code.toLowerCase() === lower)
    : undefined;
  const purchaseHit = isPurchaseCode
    ? purchaseQuery.data?.find((po) => po.code.toLowerCase() === lower)
    : undefined;
  const opnameHit = isOpnameCode
    ? opnameQuery.data?.items.find((opname) => opname.code.toLowerCase() === lower)
    : undefined;
  const orderHit = isResiCandidate ? (orderQuery.data ?? null) : null;
  const scanHit = isVariantCandidate ? (scanQuery.data ?? null) : null;

  const entries = useMemo<readonly EntityJumpEntry[]>(() => {
    const hits: EntityJumpEntry[] = [];

    if (saleHit) {
      hits.push({
        id: `jump:sale:${saleHit.id}`,
        title: `Buka penjualan ${saleHit.code}`,
        icon: Store,
        href: `/dashboard/sales/${saleHit.id}` as Route,
      });
    }
    if (purchaseHit) {
      hits.push({
        id: `jump:purchase:${purchaseHit.id}`,
        title: `Buka pembelian ${purchaseHit.code}`,
        icon: Truck,
        href: `/dashboard/purchasing/${purchaseHit.id}` as Route,
      });
    }
    if (opnameHit) {
      hits.push({
        id: `jump:opname:${opnameHit.id}`,
        title: `Buka opname ${opnameHit.code}`,
        icon: ClipboardCheck,
        href: `/dashboard/inventory/opname/${opnameHit.id}` as Route,
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
    if (scanHit) {
      if (scanHit.kind === 'variant') {
        // The POS resolver doesn't expose the productId, so jump to the
        // inventory list pre-filtered to the resolved SKU.
        hits.push({
          id: `jump:variant:${scanHit.variant.variantId}`,
          title: `Buka produk ${scanHit.variant.name} · ${scanHit.variant.sku}`,
          icon: Boxes,
          href: `/dashboard/inventory?search=${encodeURIComponent(scanHit.variant.sku)}` as Route,
        });
      } else {
        hits.push({
          id: `jump:bundle:${scanHit.bundle.id}`,
          title: `Buka bundel ${scanHit.bundle.name} · ${scanHit.bundle.sku}`,
          icon: Layers,
          href: `/dashboard/bundles?search=${encodeURIComponent(scanHit.bundle.sku)}` as Route,
        });
      }
    }

    return hits;
  }, [saleHit, purchaseHit, opnameHit, orderHit, scanHit, debounced]);

  // isLoading = actually fetching with nothing cached yet (a disabled query is
  // "pending" too, so gate each one on its own shape check).
  const isLooking =
    (isSaleCode && salesQuery.isLoading) ||
    (isPurchaseCode && purchaseQuery.isLoading) ||
    (isOpnameCode && opnameQuery.isLoading) ||
    (isResiCandidate && orderQuery.isLoading) ||
    (isVariantCandidate && scanQuery.isLoading);

  return { entries, isLooking };
}
