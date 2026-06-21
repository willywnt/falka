import { EmptyState, Button } from '@falka/web';
import { PackageSearch, Inbox, Plus } from 'lucide-react';

export function NoResults() {
  return (
    <div style={{ width: 460 }}>
      <EmptyState
        icon={PackageSearch}
        title="Belum ada produk"
        description="Belum ada produk yang cocok dengan pencarian. Coba ubah kata kunci atau tambah produk baru."
      />
    </div>
  );
}

export function WithAction() {
  return (
    <div style={{ width: 460 }}>
      <EmptyState
        icon={Inbox}
        title="Belum ada pesanan masuk"
        description="Pesanan dari marketplace dan kasir akan tampil di sini begitu ada transaksi."
        action={
          <Button size="sm">
            <Plus className="size-4" />
            Buat pesanan manual
          </Button>
        }
      />
    </div>
  );
}
