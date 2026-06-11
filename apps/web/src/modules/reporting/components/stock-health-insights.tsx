'use client';

import { useCallback, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { AbcReport } from './abc-report';
import { DeadStockReport } from './dead-stock-report';

type StockHealthTab = 'dead-stock' | 'abc';

/**
 * Two stock-prioritization lenses under one page: which inventory is sitting dead
 * (capital stuck) and which SKUs actually carry the revenue (ABC/Pareto). Each tab
 * owns its own controls — dead stock filters by an idle-days threshold (a snapshot),
 * ABC by a date range — so they don't share a filter bar. The active tab is mirrored
 * to `?tab` so refresh/back/share lands on the same view.
 */
export function StockHealthInsights() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialTab: StockHealthTab = searchParams.get('tab') === 'abc' ? 'abc' : 'dead-stock';

  const [tab, setTab] = useState<StockHealthTab>(initialTab);

  const changeTab = useCallback(
    (next: StockHealthTab) => {
      setTab(next);
      const nextParams = new URLSearchParams(searchParams.toString());
      if (next === 'abc') nextParams.set('tab', 'abc');
      else nextParams.delete('tab');
      const qs = nextParams.toString();
      router.replace((qs ? `${pathname}?${qs}` : pathname) as Route, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => changeTab(value as StockHealthTab)}
      className="space-y-6"
    >
      <TabsList>
        <TabsTrigger value="dead-stock">Stok mati</TabsTrigger>
        <TabsTrigger value="abc">ABC</TabsTrigger>
      </TabsList>

      <TabsContent value="dead-stock">
        <DeadStockReport />
      </TabsContent>
      <TabsContent value="abc">
        <AbcReport />
      </TabsContent>
    </Tabs>
  );
}
