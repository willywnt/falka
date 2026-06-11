import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Scanner HP',
  description: 'Sambungkan ke station dan scan barcode resi atau label produk.',
};

export default function MobileScannerLayout({ children }: { children: React.ReactNode }) {
  // No Toaster here — the app-wide one (Providers) already renders; a second
  // instance made every toast appear twice (top + bottom) on the phone.
  return (
    <div className="bg-background text-foreground min-h-dvh">
      <Suspense fallback={<div className="text-muted-foreground p-6 text-sm">Memuat…</div>}>
        {children}
      </Suspense>
    </div>
  );
}
