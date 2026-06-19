import { Anchor, Check, RefreshCw } from 'lucide-react';

import { BoatArt, GullArt } from '@/components/maritime-art';
import { Reveal } from './reveal';
import { SectionHead } from './primitives';

const PORTS = [
  {
    Icon: Anchor,
    tag: 'Dermaga',
    title: 'Naik ke anjungan',
    text: 'Buat akun, susun produk & varianmu. Rapi dan terhitung sejak baris pertama.',
  },
  {
    Icon: RefreshCw,
    tag: 'Tambatkan',
    title: 'Kaitkan & cetak label',
    text: 'Sambungkan channel jualanmu, lalu cetak label QR di kertas A4.',
  },
  {
    Icon: Check,
    tag: 'Berlayar',
    title: 'Jalan otomatis',
    text: 'Stok, kasir, dan bukti packing sinkron sendiri. Kamu tinggal pegang kemudi.',
  },
];

/** "Angkat sauh" — the 3-step start told as a nautical voyage. */
export function Voyage() {
  return (
    <section className="bg-sea-glass relative overflow-hidden border-y">
      {/* drifting gulls */}
      <div
        aria-hidden
        className="text-muted-foreground pointer-events-none absolute inset-0 overflow-hidden"
      >
        <span className="crossing absolute top-[70px] opacity-30">
          <GullArt className="size-10" />
        </span>
        <span
          className="crossing absolute top-[104px] opacity-[0.18]"
          style={{ animationDuration: '24s', animationDelay: '3s' }}
        >
          <GullArt className="size-7" />
        </span>
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <SectionHead
            center
            eyebrow="Angkat sauh"
            title="Dari dermaga ke laut lepas, tiga langkah."
            sub="Nggak perlu migrasi rumit atau alat mahal — siap berlayar di hari yang sama."
          />
        </Reveal>

        <div className="relative mt-14">
          {/* route line + sailing boat (desktop) */}
          <div
            aria-hidden
            className="absolute top-[30px] right-[16.6%] left-[16.6%] hidden h-0.5 lg:block"
          >
            <div className="border-primary/45 absolute inset-0 border-t-2 border-dashed" />
            <span className="sailing text-primary absolute top-[-22px] -translate-x-1/2">
              <BoatArt className="size-8.5" />
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {PORTS.map(({ Icon, tag, title, text }, i) => (
              <Reveal key={tag} delayMs={i * 130}>
                <div className="relative text-center">
                  <span className="bg-card border-primary/40 text-primary relative z-[1] inline-flex size-15.5 items-center justify-center rounded-full border-2 shadow-sm">
                    <Icon className="size-6.5" />
                  </span>
                  <p className="eyebrow text-primary mt-4">{tag}</p>
                  <h3 className="mt-1.5 font-semibold tracking-tight">{title}</h3>
                  <p className="text-muted-foreground mx-auto mt-2 max-w-[270px] text-sm leading-relaxed text-pretty">
                    {text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
