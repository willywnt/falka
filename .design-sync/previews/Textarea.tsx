import { Textarea, Label } from '@falka/web';

export function Default() {
  return (
    <div style={{ display: 'grid', gap: 6, width: 320 }}>
      <Label htmlFor="catatan">Catatan pesanan</Label>
      <Textarea
        id="catatan"
        defaultValue="Tolong tambahkan bubble wrap dan kirim pakai kurir reguler ya. Terima kasih!"
      />
    </div>
  );
}

export function Placeholder() {
  return (
    <div style={{ display: 'grid', gap: 6, width: 320 }}>
      <Label htmlFor="deskripsi">Deskripsi produk</Label>
      <Textarea id="deskripsi" placeholder="Bahan, ukuran, perawatan, dan info lain…" />
    </div>
  );
}

export function Invalid() {
  return (
    <div style={{ display: 'grid', gap: 6, width: 320 }}>
      <Label htmlFor="alasan">Alasan retur</Label>
      <Textarea id="alasan" aria-invalid defaultValue="" placeholder="Wajib diisi" />
    </div>
  );
}

export function Disabled() {
  return (
    <div style={{ display: 'grid', gap: 6, width: 320 }}>
      <Label htmlFor="riwayat">Riwayat aktivitas</Label>
      <Textarea
        id="riwayat"
        disabled
        defaultValue="Stok disesuaikan +12 pcs oleh Andi pada 21 Jun 2026."
      />
    </div>
  );
}
