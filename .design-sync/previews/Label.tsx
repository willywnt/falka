import { Label, Input } from '@palka/web';

export function WithInput() {
  return (
    <div style={{ display: 'grid', gap: 6, width: 280 }}>
      <Label htmlFor="nama-produk">Nama produk</Label>
      <Input id="nama-produk" defaultValue="Kaos Polos Premium" />
    </div>
  );
}

export function DisabledField() {
  return (
    <div style={{ display: 'grid', gap: 6, width: 280 }}>
      <Label htmlFor="pemasok">Pemasok</Label>
      <Input id="pemasok" defaultValue="CV Sandang Jaya" disabled />
    </div>
  );
}
