import {
  Boxes,
  PackageCheck,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  ScanLine,
  ScrollText,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';

import { RiakWaves, SectionHead } from './primitives';
import { Reveal } from './reveal';

const SMALL = [
  {
    Icon: RefreshCw,
    title: 'Sinkron semua channel',
    text: 'Kaitkan sekali, stok ikut update di tiap marketplace.',
  },
  {
    Icon: ShoppingCart,
    title: 'Pesanan potong stok',
    text: 'Dibayar masuk, stok berkurang, channel lain update.',
  },
  {
    Icon: PackageCheck,
    title: 'Video packing per resi',
    text: 'Scan, rekam, kirim — bukti yang menutup komplain.',
  },
  {
    Icon: TrendingUp,
    title: 'Saran restok pintar',
    text: 'Tahu seberapa cepat laku & berapa harus dipesan.',
  },
  {
    Icon: ScrollText,
    title: 'Riwayat stok lengkap',
    text: 'Tiap perubahan bisa dicari & diekspor.',
  },
  { Icon: RotateCcw, title: 'Retur & RMA rapi', text: 'Yang layak jual balik masuk hitungan.' },
  {
    Icon: ReceiptText,
    title: 'Pembelian & PO',
    text: 'Buat PO, terima sambil scan, modal terhitung.',
  },
  {
    Icon: ScanLine,
    title: 'Stok opname terkendali',
    text: 'Hitung fisik, selisih beres dengan jejaknya.',
  },
];

const CHANNEL_DOTS = [
  'oklch(0.66 0.2 35)',
  'oklch(0.62 0.17 150)',
  'oklch(0.5 0.02 250)',
  'oklch(0.55 0.18 295)',
];

/** "Satu kapal, semua perkakas" — bento grid with one hull-navy hero feature. */
export function FeatureBento() {
  return (
    <section id="fitur" className="mx-auto max-w-6xl px-6 py-24">
      <Reveal>
        <SectionHead
          eyebrow="Satu kapal, semua perkakas"
          title="Semua yang tokomu butuhkan, dalam satu lambung."
        />
      </Reveal>

      <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:auto-rows-[158px] lg:grid-cols-4">
        {/* hero feature */}
        <Reveal className="sm:col-span-2 lg:row-span-2">
          <div className="bg-sidebar text-sidebar-foreground relative flex h-full flex-col overflow-hidden rounded-2xl p-6.5">
            <RiakWaves heightClass="h-30" className="opacity-45" />
            <div className="relative">
              <span className="bg-primary/30 flex size-11.5 items-center justify-center rounded-xl">
                <Boxes className="size-5.5" />
              </span>
              <h3 className="mt-4.5 text-2xl font-semibold tracking-tight">
                Satu angka stok yang benar
              </h3>
              <p className="text-sidebar-foreground/75 mt-2.5 max-w-[340px] text-[0.95rem] leading-relaxed text-pretty">
                StockLedger jadi sumber kebenaran tunggal — semua channel, kasir, dan gudang membaca
                angka yang sama. Nggak ada lagi oversell atau tebak-tebakan.
              </p>
            </div>
            <div className="relative mt-auto flex items-end gap-3.5 pt-6">
              <div>
                <span className="num-display text-5xl leading-none">142</span>
                <p className="eyebrow text-sidebar-foreground/60 mt-1.5">
                  siap jual · semua channel
                </p>
              </div>
              <div className="mb-1.5 flex gap-1.5">
                {CHANNEL_DOTS.map((c) => (
                  <span key={c} className="size-2.25 rounded-full" style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {SMALL.map(({ Icon, title, text }, i) => (
          <Reveal key={title} delayMs={(i % 2) * 80}>
            <div className="bg-card hover:border-primary/40 flex h-full flex-col rounded-2xl border p-4.5 transition-all hover:-translate-y-0.5">
              <span className="bg-primary/10 text-primary flex size-9.5 items-center justify-center rounded-lg">
                <Icon className="size-4.75" />
              </span>
              <h3 className="mt-3.5 text-[0.96rem] font-semibold tracking-tight">{title}</h3>
              <p className="text-muted-foreground mt-1.5 text-[0.82rem] leading-relaxed text-pretty">
                {text}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
