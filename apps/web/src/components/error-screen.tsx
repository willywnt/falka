'use client';

import Link from 'next/link';

import { BrandBadge } from '@/components/brand-mark';
import { LighthouseArt } from '@/components/maritime-art';
import { Button } from '@/components/ui/button';

/** Shared body for the route error boundaries — calm "suar" voice, always a way back. */
export function ErrorScreen({
  reset,
  withBrand = false,
}: {
  reset: () => void;
  withBrand?: boolean;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 p-6 text-center">
      {withBrand ? <BrandBadge /> : null}
      <LighthouseArt className="text-muted-foreground/50" />
      <div className="space-y-1.5">
        <p className="eyebrow text-primary">Suar</p>
        <h1 className="text-xl font-semibold tracking-tight">Ada yang nyangkut</h1>
        <p className="text-muted-foreground mx-auto max-w-sm text-sm text-pretty">
          Terjadi kesalahan saat memuat halaman ini. Data kamu aman — coba muat ulang, ya.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={reset}>Coba lagi</Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Buka dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
