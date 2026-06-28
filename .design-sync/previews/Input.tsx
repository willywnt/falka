import { Input, Label } from '@palka/web';

export function Default() {
  return (
    <div style={{ display: 'grid', gap: 6, width: 280 }}>
      <Label htmlFor="sku">SKU varian</Label>
      <Input id="sku" defaultValue="KAOS-PLN-HTM-L" />
    </div>
  );
}

export function Placeholder() {
  return (
    <div style={{ display: 'grid', gap: 6, width: 280 }}>
      <Label htmlFor="cari">Cari produk</Label>
      <Input id="cari" placeholder="Nama, SKU, atau barcode…" />
    </div>
  );
}

export function Invalid() {
  return (
    <div style={{ display: 'grid', gap: 6, width: 280 }}>
      <Label htmlFor="harga">Harga jual</Label>
      <Input id="harga" defaultValue="-12000" aria-invalid />
    </div>
  );
}

export function Disabled() {
  return (
    <div style={{ display: 'grid', gap: 6, width: 280 }}>
      <Label htmlFor="kode">Kode pesanan</Label>
      <Input id="kode" defaultValue="S00482" disabled />
    </div>
  );
}
