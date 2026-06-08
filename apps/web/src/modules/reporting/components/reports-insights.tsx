'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { DateRange } from 'react-day-picker';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { ChannelPerformanceReport } from './channel-performance-report';
import { ProfitReport } from './profit-report';
import { ReportRangeControls, rangeToParams } from './report-range-controls';
import { channelPerformanceExportUrl, profitExportUrl } from '../hooks/use-reporting';
import type { ProfitPeriodGranularity } from '../types';

type ReportTab = 'laba' | 'channel';

/**
 * The merged Laba + Channel insight page: one shared date-range/grouping filter
 * and a per-tab CSV export, switching between the profit view (laba/margin/SKU)
 * and the channel-comparison view. Reads `?tab=channel` for the initial tab so
 * the old /reports/channels link lands on the right view.
 */
export function ReportsInsights() {
  const searchParams = useSearchParams();
  const initialTab: ReportTab = searchParams.get('tab') === 'channel' ? 'channel' : 'laba';

  const [tab, setTab] = useState<ReportTab>(initialTab);
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [groupBy, setGroupBy] = useState<ProfitPeriodGranularity>('day');

  const params = rangeToParams(range, groupBy);
  const exportUrl =
    tab === 'channel' ? channelPerformanceExportUrl(params) : profitExportUrl(params);

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as ReportTab)} className="space-y-6">
      <TabsList>
        <TabsTrigger value="laba">Laba &amp; margin</TabsTrigger>
        <TabsTrigger value="channel">Per channel</TabsTrigger>
      </TabsList>

      <ReportRangeControls
        range={range}
        onRangeChange={setRange}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        exportUrl={exportUrl}
      />

      <TabsContent value="laba">
        <ProfitReport params={params} onSeeChannels={() => setTab('channel')} />
      </TabsContent>
      <TabsContent value="channel">
        <ChannelPerformanceReport params={params} />
      </TabsContent>
    </Tabs>
  );
}
