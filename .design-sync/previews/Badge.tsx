import { Badge } from '@falka/web';
import { Check, Package, TriangleAlert } from 'lucide-react';

export function Variants() {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <Badge>Lunas</Badge>
      <Badge variant="secondary">5 tersisa</Badge>
      <Badge variant="destructive">Stok habis</Badge>
      <Badge variant="outline">Draf</Badge>
    </div>
  );
}

export function WithIcons() {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <Badge>
        <Check />
        Tersinkron
      </Badge>
      <Badge variant="secondary">
        <Package />
        Dikemas
      </Badge>
      <Badge variant="destructive">
        <TriangleAlert />
        Perlu cek
      </Badge>
    </div>
  );
}

export function InContext() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, width: 300 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Kaos Polos — Hitam / L</span>
        <Badge variant="secondary">12 pcs</Badge>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Celana Chino — Krem / 32</span>
        <Badge variant="destructive">Habis</Badge>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Topi Trucker — Navy</span>
        <Badge>Aktif</Badge>
      </div>
    </div>
  );
}
