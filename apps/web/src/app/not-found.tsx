import type { Metadata } from 'next';
import Link from 'next/link';

import { BrandBadge } from '@/components/brand-mark';
import { LighthouseArt } from '@/components/maritime-art';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Halaman tidak ditemukan',
};

export default function NotFound() {
  return (
    <main className="bg-background flex min-h-screen flex-col items-center justify-center gap-5 p-6 text-center">
      <BrandBadge />
      <LighthouseArt className="text-muted-foreground/50" />
      <div className="space-y-1.5">
        <p className="eyebrow text-primary">Suar</p>
        <h1 className="text-xl font-semibold tracking-tight">Halaman ini tidak ada di peta</h1>
        <p className="text-muted-foreground mx-auto max-w-sm text-sm text-pretty">
          Alamatnya mungkin salah ketik, atau halamannya sudah dipindahkan. Yuk, kembali ke perairan
          yang tenang.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild>
          <Link href="/dashboard">Buka dashboard</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Ke beranda</Link>
        </Button>
      </div>
    </main>
  );
}
