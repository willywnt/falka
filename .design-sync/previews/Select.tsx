import { Select, Label } from '@falka/web';

export function Default() {
  return (
    <div style={{ display: 'grid', gap: 6, width: 240 }}>
      <Label htmlFor="kategori">Kategori produk</Label>
      <Select id="kategori" defaultValue="pakaian">
        <option value="pakaian">Pakaian</option>
        <option value="aksesoris">Aksesoris</option>
        <option value="sepatu">Sepatu</option>
        <option value="tas">Tas</option>
      </Select>
    </div>
  );
}

export function Channel() {
  return (
    <div style={{ display: 'grid', gap: 6, width: 240 }}>
      <Label htmlFor="kanal">Kanal penjualan</Label>
      <Select id="kanal" defaultValue="shopee">
        <option value="pos">Kasir (POS)</option>
        <option value="shopee">Shopee</option>
        <option value="tokopedia">Tokopedia</option>
        <option value="lazada">Lazada</option>
      </Select>
    </div>
  );
}

export function Disabled() {
  return (
    <div style={{ display: 'grid', gap: 6, width: 240 }}>
      <Label htmlFor="gudang">Gudang</Label>
      <Select id="gudang" defaultValue="utama" disabled>
        <option value="utama">Gudang Utama</option>
      </Select>
    </div>
  );
}
