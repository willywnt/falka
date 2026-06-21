import { Sparkline } from '@falka/web';

export function BesideHeroNumber() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div>
        <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Omzet 14 hari</div>
        <div className="num" style={{ fontSize: 22, fontWeight: 600 }}>
          Rp 11,2jt
        </div>
      </div>
      <Sparkline values={[18, 22, 19, 27, 24, 31, 29, 35, 33, 42, 38, 46, 44, 52]} />
    </div>
  );
}

export function Variants() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Sparkline values={[12, 15, 14, 19, 23, 21, 28, 32]} stroke="var(--signed-up)" width={160} height={40} />
      <Sparkline values={[48, 44, 39, 41, 33, 29, 26, 18]} stroke="var(--signed-down)" width={160} height={40} />
    </div>
  );
}
