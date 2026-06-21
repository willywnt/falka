import { RevenueTrendChart } from '@falka/web';

export function OmzetVsLaba() {
  return (
    <div style={{ width: 560, height: 320 }}>
      <RevenueTrendChart
        data={[
          { period: '2026-06-01', revenue: 3_110_000, profit: 742_000 },
          { period: '2026-06-08', revenue: 3_760_000, profit: 904_000 },
          { period: '2026-06-15', revenue: 3_140_000, profit: 688_000 },
          { period: '2026-06-22', revenue: 4_870_000, profit: 1_215_000 },
          { period: '2026-06-29', revenue: 4_300_000, profit: 1_032_000 },
          { period: '2026-07-06', revenue: 5_240_000, profit: 1_360_000 },
        ]}
      />
    </div>
  );
}
