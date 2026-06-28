import { ChannelDonutChart } from '@palka/web';

export function RevenueShare() {
  return (
    <div style={{ width: 300, height: 240 }}>
      <ChannelDonutChart
        centerPrimary="Rp 11,2jt"
        centerSecondary="Omzet 7 hari"
        data={[
          { name: 'Shopee', value: 4_820_000, color: 'var(--chart-3)' },
          { name: 'Tokopedia', value: 3_140_000, color: 'var(--chart-2)' },
          { name: 'Lazada', value: 1_960_000, color: 'var(--chart-4)' },
          { name: 'Offline', value: 1_280_000, color: 'var(--chart-1)' },
        ]}
      />
    </div>
  );
}

export function TwoChannels() {
  return (
    <div style={{ width: 280, height: 240 }}>
      <ChannelDonutChart
        centerPrimary="Rp 6,5jt"
        centerSecondary="Bulan ini"
        data={[
          { name: 'Toko offline', value: 4_200_000, color: 'var(--chart-1)' },
          { name: 'TikTok Shop', value: 2_300_000, color: 'var(--chart-5)' },
        ]}
      />
    </div>
  );
}
