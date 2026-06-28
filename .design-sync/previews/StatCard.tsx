import { StatCard } from '@palka/web';
import { Wallet, Package, TrendingUp } from 'lucide-react';

export function Grid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 220px)', gap: 16 }}>
      <StatCard label="Omzet hari ini" value="Rp 4,82jt" icon={Wallet} tone="primary" delta={12.4} hint="vs kemarin" />
      <StatCard label="Pesanan" value="38" icon={Package} tone="sky" delta={-3} hint="vs kemarin" />
      <StatCard label="Margin" value="24,1%" icon={TrendingUp} tone="emerald" hint="bulan ini" />
    </div>
  );
}

export function Single() {
  return (
    <div style={{ width: 240 }}>
      <StatCard label="Saldo kas" value="Rp 12,4jt" icon={Wallet} tone="primary" hint="per hari ini" />
    </div>
  );
}
