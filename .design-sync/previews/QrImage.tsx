import { QrImage } from '@falka/web';

export function Label() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
        border: '1px solid var(--border, #e3dccd)',
        width: 200,
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 600 }}>Kaos Polos — Hitam / L</span>
      <QrImage value="KAOS-HITAM-L" size={144} />
      <span style={{ fontSize: 13, color: 'var(--muted-foreground, #6b7682)', fontFamily: 'var(--font-mono, monospace)' }}>
        KAOS-HITAM-L
      </span>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20 }}>
      <QrImage value="8991002101234" size={96} />
      <QrImage value="8991002101234" size={144} />
    </div>
  );
}
