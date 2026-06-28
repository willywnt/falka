import { ValueRankList } from '@palka/web';

const rupiah = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

export function TopProducts() {
  return (
    <div style={{ width: 380 }}>
      <ValueRankList
        formatValue={rupiah}
        rows={[
          { id: '1', label: 'Kaos Polos Premium', sublabel: 'Hitam / L', value: 4_820_000 },
          { id: '2', label: 'Celana Chino Slim', sublabel: 'Krem / 32', value: 3_640_000 },
          { id: '3', label: 'Kemeja Flanel', sublabel: 'Merah / M', value: 2_910_000 },
          { id: '4', label: 'Jaket Bomber', sublabel: 'Navy / XL', value: 1_750_000 },
          { id: '5', label: 'Topi Baseball', sublabel: 'Hitam', value: 980_000 },
        ]}
      />
    </div>
  );
}

export function WithFlagged() {
  return (
    <div style={{ width: 380 }}>
      <ValueRankList
        formatValue={(n) => `${n.toLocaleString('id-ID')} unit`}
        rows={[
          { id: '1', label: 'Sandal Karet', sublabel: 'Cokelat / 40', value: 142 },
          { id: '2', label: 'Kaos Kaki Pack', sublabel: 'Putih', value: 118 },
          { id: '3', label: 'Sepatu Sneakers', sublabel: 'Putih / 42', value: 64, flagged: true },
          { id: '4', label: 'Tas Selempang', sublabel: 'Hitam', value: 31, flagged: true },
        ]}
      />
    </div>
  );
}
