import { LowStockBadge } from '@palka/web';

export function Default() {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <LowStockBadge threshold={5} />
    </div>
  );
}

export function InTableRow() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, width: 360 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Kaos Polos — Hitam / L</span>
        <LowStockBadge threshold={5} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Topi Rajut — Abu</span>
        <LowStockBadge threshold={10} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Tumbler Stainless 500ml</span>
        <LowStockBadge threshold={3} />
      </div>
    </div>
  );
}
