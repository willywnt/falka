'use client';

import type { Route } from 'next';
import { usePathname } from 'next/navigation';

import { resolveNavSectionLabel } from '@/components/layout/nav-config';

/*
 * Page-aware shortcuts for the Pandu dock. The chip set follows the active
 * section, so the assistant offers the next likely move where you already are
 * (on Inventaris: "yang menipis", "stok mati"). Every chip is a real route —
 * honest, like the rest of Pandu — and the resolver is pure so it unit-tests
 * without React.
 */

export interface PanduContextChip {
  readonly id: string;
  readonly label: string;
  readonly href: Route;
}

export interface PanduContext {
  readonly sectionLabel: string | undefined;
  readonly chips: readonly PanduContextChip[];
}

/** Route-prefix → its shortcuts. Longest matching prefix wins. */
const CONTEXT_CHIPS: ReadonlyArray<{ prefix: string; chips: readonly PanduContextChip[] }> = [
  {
    prefix: '/dashboard/inventory',
    chips: [
      { id: 'inv-low', label: 'Yang menipis', href: '/dashboard/inventory?status=low' as Route },
      { id: 'inv-reorder', label: 'Saran restok', href: '/dashboard/inventory/reorder' },
      { id: 'inv-dead', label: 'Stok mati', href: '/dashboard/reports/dead-stock' },
      { id: 'inv-opname', label: 'Opname', href: '/dashboard/inventory/opname' },
    ],
  },
  {
    prefix: '/dashboard/orders',
    chips: [
      { id: 'ord-paid', label: 'Perlu dikirim', href: '/dashboard/orders?status=PAID' as Route },
      { id: 'ord-board', label: 'Papan packing', href: '/dashboard/orders/board' },
      { id: 'ord-returns', label: 'Retur', href: '/dashboard/returns' },
    ],
  },
  {
    prefix: '/dashboard/sales',
    chips: [{ id: 'sale-new', label: 'Penjualan baru', href: '/dashboard/sales/new' }],
  },
  {
    prefix: '/dashboard/purchasing',
    chips: [
      { id: 'po-new', label: 'PO baru', href: '/dashboard/purchasing/new' },
      { id: 'po-suppliers', label: 'Pemasok', href: '/dashboard/suppliers' },
      { id: 'po-reorder', label: 'Saran restok', href: '/dashboard/inventory/reorder' },
    ],
  },
  {
    prefix: '/dashboard/suppliers',
    chips: [
      { id: 'sup-new-po', label: 'PO baru', href: '/dashboard/purchasing/new' },
      { id: 'sup-purchasing', label: 'Pembelian', href: '/dashboard/purchasing' },
    ],
  },
  {
    prefix: '/dashboard/returns',
    chips: [
      {
        id: 'ret-pending',
        label: 'Retur pending',
        href: '/dashboard/returns?status=PENDING' as Route,
      },
      { id: 'ret-orders', label: 'Pesanan', href: '/dashboard/orders' },
    ],
  },
  {
    prefix: '/dashboard/marketplace',
    chips: [
      { id: 'mkt-orders', label: 'Pesanan online', href: '/dashboard/orders' },
      { id: 'mkt-inventory', label: 'Inventaris', href: '/dashboard/inventory' },
    ],
  },
  {
    prefix: '/dashboard/products',
    chips: [
      { id: 'prod-bundles', label: 'Bundel', href: '/dashboard/bundles' },
      { id: 'prod-labels', label: 'Label QR', href: '/dashboard/labels' },
    ],
  },
  {
    prefix: '/dashboard/bundles',
    chips: [
      { id: 'bdl-products', label: 'Produk', href: '/dashboard/products' },
      { id: 'bdl-labels', label: 'Label QR', href: '/dashboard/labels' },
    ],
  },
  {
    prefix: '/dashboard/labels',
    chips: [
      { id: 'lbl-products', label: 'Produk', href: '/dashboard/products' },
      { id: 'lbl-bundles', label: 'Bundel', href: '/dashboard/bundles' },
    ],
  },
  {
    prefix: '/dashboard/reports',
    chips: [
      { id: 'rep-profit', label: 'Laba & channel', href: '/dashboard/reports/profit' },
      { id: 'rep-value', label: 'Nilai stok', href: '/dashboard/reports/inventory-value' },
      { id: 'rep-dead', label: 'Stok mati', href: '/dashboard/reports/dead-stock' },
    ],
  },
  {
    prefix: '/dashboard/recordings',
    chips: [
      { id: 'rec-record', label: 'Rekam packing', href: '/recordings' },
      { id: 'rec-board', label: 'Papan packing', href: '/dashboard/orders/board' },
    ],
  },
];

/**
 * The shortcuts for a path (longest-prefix match), minus any plain self-link to
 * the current page. A chip carrying a query string (e.g. `?low=1`) is a filter
 * action — useful even on the same path — so it is always kept.
 */
export function resolvePanduContextChips(pathname: string): readonly PanduContextChip[] {
  const match = CONTEXT_CHIPS.filter(
    (entry) => pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`),
  ).sort((a, b) => b.prefix.length - a.prefix.length)[0];

  return (match?.chips ?? []).filter((chip) => chip.href.includes('?') || chip.href !== pathname);
}

export function usePanduContext(): PanduContext {
  const pathname = usePathname();
  return {
    sectionLabel: resolveNavSectionLabel(pathname),
    chips: resolvePanduContextChips(pathname),
  };
}
