'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Keeps a flat record of string filters in sync with the URL query string
 * (shareable / bookmarkable). Initial values come from the URL, then state →
 * URL via `router.replace` (no history spam). A value equal to its default is
 * dropped from the URL to keep it clean. Debounce the search input upstream and
 * feed the debounced value in via `setFilters`.
 */
export function useUrlFilters<T extends Record<string, string>>(defaults: T) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFiltersState] = useState<T>(() => {
    const initial = { ...defaults };
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const value = searchParams.get(key as string);
      if (value !== null) initial[key] = value as T[keyof T];
    }
    return initial;
  });

  const lastWritten = useRef<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const value = filters[key];
      if (value && value !== defaults[key]) params.set(key as string, value as string);
    }
    const qs = params.toString();
    if (qs === lastWritten.current) return;
    lastWritten.current = qs;
    const href = (qs ? `${pathname}?${qs}` : pathname) as Route;
    router.replace(href, { scroll: false });
  }, [filters, defaults, pathname, router]);

  const setFilters = useCallback((patch: Partial<T>) => {
    setFiltersState((current) => ({ ...current, ...patch }));
  }, []);

  return [filters, setFilters] as const;
}
