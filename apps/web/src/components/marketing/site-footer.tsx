import { APP_NAME } from '@palka/config/constants';

import { BrandBadge } from '@/components/brand-mark';
import { GullArt, LighthouseArt } from '@/components/maritime-art';
import { FooterSignup } from './footer-signup';
import { RiakWaves, SuarDot } from './primitives';

const FOOT_COLS = [
  {
    head: 'Produk',
    links: ['Stok akurat', 'Sinkron channel', 'Kasir offline', 'Bukti packing', 'Laporan & margin'],
  },
  { head: 'Marketplace', links: ['Shopee', 'Tokopedia', 'TikTok Shop', 'Lazada'] },
  { head: 'Sumber daya', links: ['Cara kerja', 'FAQ', 'Dokumentasi', 'Status layanan'] },
  { head: 'Perusahaan', links: [`Tentang ${APP_NAME}`, 'Kontak', 'Kebijakan privasi'] },
];

/** Harbour footer — lighthouse beam, drifting gulls, waves, link columns. */
export function SiteFooter() {
  return (
    <footer className="bg-sidebar text-sidebar-foreground relative overflow-hidden">
      <div aria-hidden className="text-highlight absolute top-7 right-10">
        <LighthouseArt beam className="size-32" />
      </div>
      <div
        aria-hidden
        className="text-sidebar-foreground/35 pointer-events-none absolute inset-0 overflow-hidden"
      >
        <span className="crossing absolute top-[54px]" style={{ animationDuration: '26s' }}>
          <GullArt className="size-6.5" />
        </span>
        <span
          className="crossing absolute top-[90px] opacity-60"
          style={{ animationDuration: '34s', animationDelay: '6s' }}
        >
          <GullArt className="size-4.5" />
        </span>
      </div>
      <RiakWaves heightClass="h-37" className="opacity-40" />

      <div className="relative mx-auto max-w-6xl px-6 pt-17">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <span className="inline-flex items-center gap-2.75">
              <BrandBadge className="size-9.5 rounded-xl" />
              <span className="text-[1.3rem] font-bold tracking-tight">{APP_NAME}</span>
            </span>
            <p className="text-sidebar-foreground/75 mt-4 max-w-[300px] text-[0.92rem] leading-relaxed text-pretty">
              {APP_NAME} digital untuk stok tokomu. Inventaris, kasir, dan bukti packing — buat
              seller Indonesia yang ingin jualan lebih tenang.
            </p>
            <FooterSignup />
          </div>
          {FOOT_COLS.map((c) => (
            <div key={c.head}>
              <p className="eyebrow text-sidebar-foreground/55">{c.head}</p>
              <ul className="mt-3.5 flex flex-col gap-2.5">
                {c.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sidebar-foreground/80 hover:text-sidebar-foreground text-[0.88rem]"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-sidebar-foreground/15 text-sidebar-foreground/60 mt-13 flex flex-wrap items-center justify-between gap-4 border-t py-5.5 text-[0.82rem]">
          <span>© 2026 {APP_NAME}. Semua hak dilindungi.</span>
          <span className="inline-flex items-center gap-2">
            Dipandu cahaya suar <SuarDot />
          </span>
        </div>
      </div>
    </footer>
  );
}
