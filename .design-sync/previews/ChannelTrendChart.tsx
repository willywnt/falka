import { ChannelTrendChart } from '@falka/web';

export function StackedRevenue() {
  return (
    <div style={{ width: 560, height: 320 }}>
      <ChannelTrendChart
        series={[
          { key: 'POS', label: 'Offline', color: 'var(--chart-1)' },
          { key: 'SHOPEE', label: 'Shopee', color: 'var(--chart-3)' },
          { key: 'TOKOPEDIA', label: 'Tokopedia', color: 'var(--chart-2)' },
          { key: 'LAZADA', label: 'Lazada', color: 'var(--chart-4)' },
        ]}
        data={[
          { period: '2026-06-01', POS: 820_000, SHOPEE: 1_240_000, TOKOPEDIA: 640_000, LAZADA: 410_000 },
          { period: '2026-06-08', POS: 940_000, SHOPEE: 1_580_000, TOKOPEDIA: 720_000, LAZADA: 520_000 },
          { period: '2026-06-15', POS: 760_000, SHOPEE: 1_120_000, TOKOPEDIA: 880_000, LAZADA: 380_000 },
          { period: '2026-06-22', POS: 1_180_000, SHOPEE: 1_960_000, TOKOPEDIA: 1_040_000, LAZADA: 690_000 },
          { period: '2026-06-29', POS: 1_020_000, SHOPEE: 1_740_000, TOKOPEDIA: 960_000, LAZADA: 580_000 },
        ]}
      />
    </div>
  );
}
