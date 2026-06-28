import { Button } from '@palka/web';

export function Variants() {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      <Button>Simpan</Button>
      <Button variant="secondary">Batal</Button>
      <Button variant="outline">Ekspor</Button>
      <Button variant="ghost">Lewati</Button>
      <Button variant="destructive">Hapus</Button>
      <Button variant="link">Selengkapnya</Button>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button size="sm">Kecil</Button>
      <Button size="default">Sedang</Button>
      <Button size="lg">Besar</Button>
    </div>
  );
}

export function States() {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button>Aktif</Button>
      <Button disabled>Nonaktif</Button>
    </div>
  );
}
