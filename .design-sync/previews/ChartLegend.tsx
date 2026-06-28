import { ChartLegend } from '@palka/web';

export function ChannelSeries() {
  return (
    <div style={{ width: 420 }}>
      <ChartLegend
        items={[
          { label: 'Offline', color: 'var(--chart-1)' },
          { label: 'Shopee', color: 'var(--chart-3)' },
          { label: 'Tokopedia', color: 'var(--chart-2)' },
          { label: 'Lazada', color: 'var(--chart-4)' },
          { label: 'TikTok Shop', color: 'var(--chart-5)' },
        ]}
      />
    </div>
  );
}

export function OmzetLaba() {
  return (
    <div style={{ width: 280 }}>
      <ChartLegend
        items={[
          { label: 'Omzet', color: 'var(--primary)' },
          { label: 'Laba', color: 'var(--signed-up)' },
        ]}
      />
    </div>
  );
}
