import { TrackBar } from '@falka/web';

export function ShareCells() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 320 }}>
      {[
        { label: 'Shopee', pct: 64 },
        { label: 'Tokopedia', pct: 41 },
        { label: 'Lazada', pct: 23 },
        { label: 'Toko offline', pct: 12 },
      ].map((row) => (
        <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, width: 96, flexShrink: 0 }}>{row.label}</span>
          <TrackBar pct={row.pct} />
          <span className="num" style={{ fontSize: 12, width: 36, textAlign: 'right' }}>
            {row.pct}%
          </span>
        </div>
      ))}
    </div>
  );
}

export function Colored() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 280 }}>
      <TrackBar pct={88} color="var(--signed-up)" />
      <TrackBar pct={52} color="var(--highlight)" />
      <TrackBar pct={18} color="var(--signed-down)" />
    </div>
  );
}
