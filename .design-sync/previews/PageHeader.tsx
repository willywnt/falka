import { PageHeader, Button } from '@palka/web';
import { Plus, Download } from 'lucide-react';

export function WithActions() {
  return (
    <div style={{ width: 720 }}>
      <PageHeader
        eyebrow="Katalog"
        title="Produk"
        description="Kelola produk, varian, dan stok yang tersedia di toko serta marketplace."
      >
        <Button variant="outline" size="sm">
          <Download className="size-4" />
          Ekspor
        </Button>
        <Button size="sm">
          <Plus className="size-4" />
          Produk baru
        </Button>
      </PageHeader>
    </div>
  );
}

export function TitleOnly() {
  return (
    <div style={{ width: 720 }}>
      <PageHeader
        eyebrow="Laporan"
        title="Laba & margin"
        description="Ringkasan omzet, HPP, dan margin bersih setelah retur dan PPN."
      />
    </div>
  );
}

export function WithBreadcrumb() {
  return (
    <div style={{ width: 720 }}>
      <PageHeader
        breadcrumb="Toko Palka Demo · Gudang Pusat"
        eyebrow="Stok"
        title="Stock opname"
        description="Hitung ulang stok fisik dan rekonsiliasi selisih dengan sistem."
      >
        <Button size="sm">Mulai sesi</Button>
      </PageHeader>
    </div>
  );
}
