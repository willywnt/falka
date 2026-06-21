import { Switch, Label } from '@falka/web';

export function States() {
  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Switch id="aktif" defaultChecked />
        <Label htmlFor="aktif">Aktif</Label>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Switch id="nonaktif" />
        <Label htmlFor="nonaktif">Nonaktif</Label>
      </div>
    </div>
  );
}

export function SettingRow() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: 320,
        gap: 16,
      }}
    >
      <div style={{ display: 'grid', gap: 2 }}>
        <Label htmlFor="sync">Sinkron stok ke marketplace</Label>
        <span style={{ fontSize: 12, color: 'var(--muted-foreground, #6b7280)' }}>
          Dorong stok otomatis ke Shopee &amp; Lazada
        </span>
      </div>
      <Switch id="sync" defaultChecked />
    </div>
  );
}

export function Disabled() {
  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Switch id="dis-on" defaultChecked disabled />
        <Label htmlFor="dis-on">Terkunci aktif</Label>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Switch id="dis-off" disabled />
        <Label htmlFor="dis-off">Terkunci nonaktif</Label>
      </div>
    </div>
  );
}
