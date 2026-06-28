import { BrandBadge } from '@palka/web';

export function Sidebar() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 12,
        background: 'var(--sidebar, #16242f)',
        width: 260,
      }}
    >
      <BrandBadge />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#f4efe6' }}>Palka</span>
        <span style={{ fontSize: 12, color: '#9fb0bd' }}>Toko Palka Demo</span>
      </div>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <BrandBadge className="size-8" />
      <BrandBadge className="size-10" markClassName="size-6" />
      <BrandBadge className="size-12" markClassName="size-7" />
    </div>
  );
}
