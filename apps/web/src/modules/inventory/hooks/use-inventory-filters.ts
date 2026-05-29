'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useDebouncedValue } from '@/hooks/use-debounced-value';

import {
  parseInventorySearchParams,
  serializeInventorySearchParams,
  toProductsListQuery,
  toVariantsListQuery,
  type InventoryUrlFilters,
} from '../utils/inventory-url';

const SEARCH_DEBOUNCE_MS = 300;

export function useInventoryFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<InventoryUrlFilters>(() =>
    parseInventorySearchParams(searchParams),
  );
  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') ?? '');
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);
  const lastWritten = useRef<string | null>(null);

  useEffect(() => {
    const next = serializeInventorySearchParams({ ...filters, search: debouncedSearch });
    const current = searchParams.toString();

    if (next === current) {
      lastWritten.current = next;
      return;
    }

    if (current !== lastWritten.current) return;

    lastWritten.current = next;
    const href = (next ? `${pathname}?${next}` : pathname) as Route;
    router.replace(href, { scroll: false });
  }, [filters, debouncedSearch, pathname, router, searchParams]);

  useEffect(() => {
    const current = searchParams.toString();
    if (current === lastWritten.current) return;

    const parsed = parseInventorySearchParams(searchParams);
    lastWritten.current = current;
    setFilters(parsed);
    setSearchInput(parsed.search);
  }, [searchParams]);

  const patchFilters = useCallback((patch: Partial<InventoryUrlFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  const setSearchInputWithReset = useCallback((value: string) => {
    setSearchInput(value);
    setFilters((current) => ({ ...current, page: 1 }));
  }, []);

  const productsQuery = useMemo(
    () => toProductsListQuery({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  );

  const variantsQuery = useMemo(
    () => toVariantsListQuery({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  );

  return {
    filters,
    patchFilters,
    searchInput,
    setSearchInput: setSearchInputWithReset,
    debouncedSearch,
    productsQuery,
    variantsQuery,
  };
}
