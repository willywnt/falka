import { StatusBadge } from '@palka/web';

export function Tones() {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <StatusBadge tone="ok">Lunas</StatusBadge>
      <StatusBadge tone="info">Diproses</StatusBadge>
      <StatusBadge tone="warn">Perlu cek</StatusBadge>
      <StatusBadge tone="urgent">Segera</StatusBadge>
      <StatusBadge tone="danger">Dibatalkan</StatusBadge>
      <StatusBadge tone="neutral">Draf</StatusBadge>
    </div>
  );
}

export function InContext() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, width: 280 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Pesanan #S00482</span>
        <StatusBadge tone="ok">Lunas</StatusBadge>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Pesanan #S00483</span>
        <StatusBadge tone="warn">Menunggu bayar</StatusBadge>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Pesanan #S00484</span>
        <StatusBadge tone="danger">Dibatalkan</StatusBadge>
      </div>
    </div>
  );
}
