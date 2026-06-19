import { Lock } from 'lucide-react';

import { BrandMark } from '@/components/brand-mark';
import { GullArt, LighthouseArt } from '@/components/maritime-art';
import { RiakWaves, SuarDot } from './primitives';
import { Reveal } from './reveal';

/** Pandu — the harbour-pilot AI, shown as a night-harbour "segera hadir" scene. */
export function PanduSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <Reveal>
        <div className="bg-sidebar text-sidebar-foreground relative overflow-hidden rounded-3xl p-7 sm:p-10 lg:p-13">
          {/* sweeping lighthouse beam */}
          <div aria-hidden className="text-highlight absolute top-6 right-7.5">
            <LighthouseArt beam className="size-30" />
          </div>
          {/* drifting gull */}
          <div
            aria-hidden
            className="text-sidebar-foreground/40 pointer-events-none absolute inset-0 overflow-hidden"
          >
            <span className="crossing absolute top-10" style={{ animationDuration: '22s' }}>
              <GullArt className="size-7.5" />
            </span>
          </div>
          <RiakWaves heightClass="h-37" className="opacity-40" />

          <div className="relative grid items-center gap-11 lg:grid-cols-2">
            <div>
              <p className="eyebrow text-highlight inline-flex items-center gap-2">
                <SuarDot /> Segera hadir · Pandu
              </p>
              <h2 className="mt-3.5 max-w-[460px] text-2xl font-semibold tracking-tight text-balance sm:text-3xl lg:text-[2.5rem] lg:leading-[1.08]">
                Pandu — pandu pelabuhanmu.
              </h2>
              <p className="text-sidebar-foreground/80 mt-4 max-w-[440px] text-[1.02rem] leading-relaxed text-pretty">
                Seperti pandu yang membaca arus sebelum kapal masuk dermaga, Pandu membaca angka
                stokmu — dan menyarankan langkah sebelum kamu kehabisan. Ia yang mengawasi muatan,
                kamu yang pegang kemudi.
              </p>
            </div>

            {/* chat preview */}
            <div className="bg-sidebar-foreground/[0.07] border-sidebar-foreground/15 rounded-2xl border p-4.5 backdrop-blur-sm">
              <div className="flex items-start gap-2.75">
                <span className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <BrandMark className="size-5" />
                </span>
                <div className="flex-1">
                  <p className="flex items-center gap-1.5 text-[0.7rem] font-bold">
                    Pandu <span className="bg-highlight pandu-breath size-1.5 rounded-full" />
                  </p>
                  <div className="bg-sidebar-foreground/10 mt-2 rounded-xl rounded-tl-sm px-3.25 py-2.75 text-sm leading-relaxed">
                    Stok <span className="num font-semibold">Kaos hitam · M</span> habis{' '}
                    <span className="text-highlight">±2 hari lagi</span>. Buatkan PO{' '}
                    <span className="num font-semibold">60</span> pcs ke Supplier Andika?
                  </div>
                  <div className="mt-2.75 flex gap-2">
                    <span className="bg-primary text-primary-foreground rounded-lg px-3.25 py-1.75 text-[0.78rem] font-semibold">
                      Buat PO
                    </span>
                    <span className="border-sidebar-foreground/20 rounded-lg border px-3.25 py-1.75 text-[0.78rem] font-semibold">
                      Nanti
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sidebar-foreground/50 mt-3.5 flex items-center gap-1.5 text-[0.7rem]">
                <Lock className="size-2.75" /> Pratinjau — Pandu masih dalam pelayaran.
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
