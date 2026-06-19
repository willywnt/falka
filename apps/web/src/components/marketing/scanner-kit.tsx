import { Check, QrCode, ScanLine, Smartphone } from 'lucide-react';

import { BuoyArt } from '@/components/maritime-art';
import { Reveal } from './reveal';
import { SectionHead } from './primitives';

const KIT = [
  {
    Icon: Smartphone,
    title: 'HP jadi pemindai',
    text: 'Pindai QR pemasangan sekali — HP-mu langsung jadi scanner nirkabel buat kasir, terima PO, dan opname.',
  },
  {
    Icon: QrCode,
    title: 'Label QR dari kertas A4',
    text: 'Cetak label per produk di printer biasa, tempel di rak, siap dipindai kapan saja.',
  },
  {
    Icon: ScanLine,
    title: 'Opname sambil jalan',
    text: 'Hitung fisik scan-per-scan: tiap pindai nambah satu, selisihnya langsung ketahuan.',
  },
];

const CORNERS = [
  'top-[-3px] left-[-3px] rounded-tl-lg border-t-[3px] border-l-[3px]',
  'top-[-3px] right-[-3px] rounded-tr-lg border-t-[3px] border-r-[3px]',
  'bottom-[-3px] left-[-3px] rounded-bl-lg border-b-[3px] border-l-[3px]',
  'bottom-[-3px] right-[-3px] rounded-br-lg border-b-[3px] border-r-[3px]',
];

/** "Cukup yang ada di genggamanmu" — phone-as-scanner, no special hardware. */
export function ScannerKit() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-24">
      <div aria-hidden className="text-primary/15 absolute top-10 right-4">
        <BuoyArt className="size-27" />
      </div>
      <Reveal>
        <SectionHead
          eyebrow="Perlengkapan minimal"
          title="Cukup yang ada di genggamanmu."
          sub="Nggak perlu scanner mahal atau printer barcode khusus — HP dan selembar A4 sudah jadi perkakas gudangmu."
        />
      </Reveal>

      <div className="mt-12 grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal>
          <div className="flex justify-center">
            {/* phone */}
            <div className="bob bg-sidebar relative w-[230px] rounded-[34px] p-2.25 shadow-2xl">
              <div className="bg-sidebar-foreground/25 absolute top-4 left-1/2 z-[2] h-1.25 w-13 -translate-x-1/2 rounded-full" />
              <div
                className="relative flex aspect-[9/17.5] items-center justify-center overflow-hidden rounded-[26px]"
                style={{
                  background: 'linear-gradient(160deg, oklch(0.28 0.03 250), oklch(0.2 0.02 250))',
                }}
              >
                <div className="relative size-[130px]">
                  {CORNERS.map((c, i) => (
                    <span key={i} className={`border-primary absolute size-6.5 ${c}`} />
                  ))}
                  <span className="absolute inset-3.5 text-white/90">
                    <QrCode className="size-full" strokeWidth={1.4} />
                  </span>
                  <div className="scan-beam" />
                </div>
                <div className="absolute right-3 bottom-4 left-3 flex items-center gap-2 rounded-xl bg-white/95 px-2.75 py-2 shadow-lg">
                  <span className="text-signed-up flex size-5.5 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_oklab,var(--signed-up)_18%,white)]">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  <span className="text-[0.7rem] text-[#1a1a1a]">
                    Terpindai · <span className="num font-semibold">KAOS-HTM-M</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="flex flex-col gap-3.5">
          {KIT.map(({ Icon, title, text }, i) => (
            <Reveal key={title} delayMs={i * 110}>
              <div className="bg-card flex items-start gap-4 rounded-2xl border p-5 shadow-sm">
                <span className="bg-primary/10 text-primary flex size-11.5 shrink-0 items-center justify-center rounded-xl">
                  <Icon className="size-5.5" />
                </span>
                <div>
                  <h3 className="font-semibold tracking-tight">{title}</h3>
                  <p className="text-muted-foreground mt-1.25 text-sm leading-relaxed text-pretty">
                    {text}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
