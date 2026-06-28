import { CompositionBar } from '@palka/web';

export function StockComposition() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: 360 }}>
      <div>
        <div style={{ fontSize: 13, marginBottom: 6 }}>Kaos Polos Premium — Hitam / L</div>
        <CompositionBar
          segments={[
            { label: 'Tersedia', value: 124, color: 'var(--signed-up)' },
            { label: 'Dipesan', value: 38, color: 'var(--highlight)' },
            { label: 'Rusak', value: 6, color: 'var(--signed-down)' },
          ]}
        />
      </div>
      <div>
        <div style={{ fontSize: 13, marginBottom: 6 }}>Celana Chino — Krem / 32</div>
        <CompositionBar
          segments={[
            { label: 'Tersedia', value: 9, color: 'var(--signed-up)' },
            { label: 'Dipesan', value: 27, color: 'var(--highlight)' },
            { label: 'Rusak', value: 2, color: 'var(--signed-down)' },
          ]}
        />
      </div>
    </div>
  );
}

export function ChannelMix() {
  return (
    <div style={{ width: 360 }}>
      <CompositionBar
        segments={[
          { label: 'Shopee', value: 4_820_000, color: 'var(--chart-3)' },
          { label: 'Tokopedia', value: 3_140_000, color: 'var(--chart-2)' },
          { label: 'Lazada', value: 1_960_000, color: 'var(--chart-4)' },
          { label: 'Offline', value: 1_280_000, color: 'var(--chart-1)' },
        ]}
      />
    </div>
  );
}
