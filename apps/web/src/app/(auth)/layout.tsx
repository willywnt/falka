import Link from 'next/link';
import { APP_NAME } from '@falka/config/constants';

import { BrandBadge } from '@/components/brand-mark';
import { WaveHairline } from '@/components/maritime-art';

/** A believable Monday-morning queue — product proof, not feature copy. */
const QUEUE_ROWS = [
  { label: 'Pesanan siap dikirim', count: 7 },
  { label: 'Varian perlu restok', count: 2 },
  { label: 'Retur menunggu', count: 1 },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="bg-primary text-primary-foreground relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        {/* Calm water, not SaaS blur-blobs: two riak strokes low on the panel. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-10 space-y-4">
          <WaveHairline className="h-4 text-white/25" />
          <WaveHairline className="h-4 text-white/15" />
        </div>

        <Link href="/" className="relative flex items-center gap-2.5">
          <BrandBadge className="text-primary size-9 bg-white" markClassName="size-6" />
          <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
        </Link>

        <div className="relative space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight text-balance">
              Lihat lebih tajam, jualan lebih tenang.
            </h2>
            <p className="text-primary-foreground/70 max-w-sm text-pretty">
              Pesanan dari semua toko masuk, stok tetap sinkron, dan setiap paket punya video
              packing.
            </p>
            <p className="text-primary-foreground/60 max-w-sm text-sm text-pretty">
              Begini pagi kamu nanti — antrian kerja yang sudah dihitung.
            </p>
          </div>

          <p className="sr-only">
            Contoh antrian kerja Senin pagi: 7 pesanan siap dikirim, 2 varian perlu restok, 1 retur
            menunggu, dan omzet kemarin naik.
          </p>
          <div aria-hidden className="max-w-sm rounded-xl border border-white/15 bg-white/10 p-4">
            <p className="eyebrow text-primary-foreground/60">Antrian kerja · Senin pagi</p>
            <ul className="mt-2 divide-y divide-white/10">
              {QUEUE_ROWS.map((row) => (
                <li key={row.label} className="flex items-center justify-between gap-4 py-2.5">
                  <span className="text-primary-foreground/80 text-sm">{row.label}</span>
                  <span className="num text-sm font-medium">{row.count}</span>
                </li>
              ))}
            </ul>
            <p className="mt-1 flex items-center justify-between gap-4 border-t border-white/15 pt-3 text-xs">
              <span className="text-primary-foreground/60">Omzet kemarin</span>
              {/* Hand-rolled +/− pair: NumberDelta's signed colors are tuned for paper surfaces. */}
              <span className="num">
                <span className="text-primary-foreground">+Rp1,84 jt</span>{' '}
                <span className="text-primary-foreground/50">−2 retur</span>
              </span>
            </p>
          </div>
        </div>

        <p className="text-primary-foreground/50 relative text-xs">
          Dibuat untuk penjual Indonesia.
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <Link href="/" className="flex items-center justify-center gap-2 lg:hidden">
            <BrandBadge />
            <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
