'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
  parseRecordingsLibrarySearchParams,
  serializeRecordingsLibrarySearchParams,
  toAppSearchParamsString,
} from '../utils/recording-library-url';
import type { ListRecordingsQuery } from '../validators/list-recordings';

const SEARCH_DEBOUNCE_MS = 300;

export function useRecordingLibraryFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState<Omit<ListRecordingsQuery, 'search'>>(
    () => parseRecordingsLibrarySearchParams(searchParams).query,
  );
  const [searchInput, setSearchInput] = useState(
    () => parseRecordingsLibrarySearchParams(searchParams).search,
  );
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);
  const lastWrittenParams = useRef<string | null>(null);

  useEffect(() => {
    const serialized = serializeRecordingsLibrarySearchParams(query, debouncedSearch);
    const currentParams = toAppSearchParamsString(searchParams);
    const fullParams = searchParams.toString();

    if (serialized === currentParams) {
      lastWrittenParams.current = serialized;

      if (fullParams !== serialized) {
        const href = (serialized ? `${pathname}?${serialized}` : pathname) as Route;
        router.replace(href, { scroll: false });
      }

      return;
    }

    if (currentParams !== lastWrittenParams.current) return;

    lastWrittenParams.current = serialized;
    const href = (serialized ? `${pathname}?${serialized}` : pathname) as Route;
    router.replace(href, { scroll: false });
  }, [query, debouncedSearch, pathname, router, searchParams]);

  useEffect(() => {
    const currentParams = toAppSearchParamsString(searchParams);
    if (currentParams === lastWrittenParams.current) return;

    const parsed = parseRecordingsLibrarySearchParams(searchParams);
    lastWrittenParams.current = currentParams;
    setQuery(parsed.query);
    setSearchInput(parsed.search);
  }, [searchParams]);

  const listQuery = useMemo(
    () => ({
      ...query,
      search: debouncedSearch.trim() || undefined,
    }),
    [query, debouncedSearch],
  );

  const setSearchInputWithReset = useCallback((value: string) => {
    setSearchInput(value);
    setQuery((current) => ({ ...current, page: 1 }));
  }, []);

  return {
    query,
    setQuery,
    searchInput,
    setSearchInput: setSearchInputWithReset,
    debouncedSearch,
    listQuery,
  };
}
