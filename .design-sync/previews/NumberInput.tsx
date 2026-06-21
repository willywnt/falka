import * as React from 'react';
import { NumberInput, Label } from '@falka/web';

export function Default() {
  const [qty, setQty] = React.useState(24);
  return (
    <div style={{ display: 'grid', gap: 6, width: 200 }}>
      <Label htmlFor="qty">Jumlah stok</Label>
      <NumberInput value={qty} onChange={setQty} />
    </div>
  );
}

export function EmptyZero() {
  const [qty, setQty] = React.useState(0);
  return (
    <div style={{ display: 'grid', gap: 6, width: 200 }}>
      <Label htmlFor="reorder">Qty pesan ulang</Label>
      <NumberInput value={qty} onChange={setQty} />
    </div>
  );
}

export function Disabled() {
  const [qty] = React.useState(150);
  return (
    <div style={{ display: 'grid', gap: 6, width: 200 }}>
      <Label htmlFor="incoming">Stok dalam perjalanan</Label>
      <NumberInput value={qty} onChange={() => {}} disabled />
    </div>
  );
}
