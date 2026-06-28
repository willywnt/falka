import { ErrorState } from '@palka/web';

export function Default() {
  return (
    <div style={{ width: 440 }}>
      <ErrorState onRetry={() => {}} />
    </div>
  );
}

export function CustomCopy() {
  return (
    <div style={{ width: 440 }}>
      <ErrorState
        title="Gagal memuat laporan laba"
        description="Server lagi sibuk. Tunggu sebentar lalu coba lagi, ya."
        onRetry={() => {}}
      />
    </div>
  );
}

export function NoRetry() {
  return (
    <div style={{ width: 440 }}>
      <ErrorState
        title="Koneksi marketplace terputus"
        description="Sambungkan ulang toko di pengaturan untuk melanjutkan sinkronisasi stok."
      />
    </div>
  );
}
