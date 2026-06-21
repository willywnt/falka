import { Separator } from '@falka/web';

export function Horizontal() {
  return (
    <div style={{ width: 300, fontSize: 14 }}>
      <div style={{ display: 'grid', gap: 2 }}>
        <span style={{ fontWeight: 600 }}>Ringkasan penjualan</span>
        <span style={{ fontSize: 12, color: 'var(--muted-foreground, #6b7280)' }}>
          Hari ini • 18 transaksi
        </span>
      </div>
      <Separator className="my-3" />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: 'var(--muted-foreground, #6b7280)' }}>Omzet bersih</span>
        <span style={{ fontWeight: 600 }}>Rp 4.280.000</span>
      </div>
    </div>
  );
}

export function Vertical() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, height: 40, fontSize: 14 }}>
      <span>Kasir</span>
      <Separator orientation="vertical" />
      <span>Pesanan</span>
      <Separator orientation="vertical" />
      <span>Inventaris</span>
    </div>
  );
}

export function StatsRow() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        height: 56,
        fontSize: 14,
      }}
    >
      <div style={{ display: 'grid', gap: 2, textAlign: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 700 }}>248</span>
        <span style={{ fontSize: 12, color: 'var(--muted-foreground, #6b7280)' }}>SKU</span>
      </div>
      <Separator orientation="vertical" />
      <div style={{ display: 'grid', gap: 2, textAlign: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 700 }}>12</span>
        <span style={{ fontSize: 12, color: 'var(--muted-foreground, #6b7280)' }}>Menipis</span>
      </div>
      <Separator orientation="vertical" />
      <div style={{ display: 'grid', gap: 2, textAlign: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 700 }}>3</span>
        <span style={{ fontSize: 12, color: 'var(--muted-foreground, #6b7280)' }}>Habis</span>
      </div>
    </div>
  );
}
