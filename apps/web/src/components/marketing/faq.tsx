'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

import { BuoyArt } from '@/components/maritime-art';
import { cn } from '@/lib/utils';
import { Reveal } from './reveal';

const FAQS = [
  {
    q: 'HP biasa beneran bisa jadi pemindai?',
    a: 'Bisa. Pindai satu QR pemasangan dari layar, HP-mu langsung jadi scanner nirkabel buat kasir, terima PO, dan opname — tanpa beli alat khusus.',
  },
  {
    q: 'Marketplace apa saja yang didukung?',
    a: 'Tokopedia, TikTok Shop, Lazada, dan Shopee sinkron stok dua arah — dan kami terus menambah marketplace lain. Kaitkan listing sekali, stok update otomatis tiap ada penjualan.',
  },
  {
    q: 'Sinyal mati, kasir tetap jalan?',
    a: 'Ya. Kasir dirancang offline-first: transaksi tetap tercatat saat sinyal hilang, lalu sinkron sendiri begitu kembali online.',
  },
  {
    q: 'Gimana video packing menutup komplain?',
    a: 'Tiap paket direkam saat dipacking dan ditautkan ke nomor resi. Pembeli bilang "barang tidak sesuai"? Kirim videonya — sengketa beres dengan bukti, bukan debat.',
  },
  {
    q: 'Gimana mulai nyiapin produk pertama kali?',
    a: 'Tambahkan produk & varianmu, atur stok awal, lalu cetak label QR. Buku besar stok mulai mencatat sejak baris pertama — mulai bertahap, kategori per kategori.',
  },
  {
    q: 'Data aman dan bisa diekspor?',
    a: 'Stok pakai buku besar append-only plus jejak audit lengkap, dan semua riwayat bisa dicari serta diekspor untuk pembukuanmu.',
  },
];

/** Interactive FAQ — single-open accordion with a maritime aside. */
export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="bg-sea-glass border-y">
      <div className="mx-auto grid max-w-6xl items-start gap-12 px-6 py-24 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <div className="lg:sticky lg:top-24">
            <p className="eyebrow text-primary inline-flex items-center gap-2">
              <span className="bg-primary inline-block h-px w-4.5" />
              Sebelum berlayar
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Masih ada yang mengganjal?
            </h2>
            <p className="text-muted-foreground mt-3.5 max-w-[320px] leading-relaxed text-pretty">
              Hal-hal yang paling sering ditanya sebelum mulai. Tak ketemu jawabannya? Kabari kami,
              kami pandu.
            </p>
            <div aria-hidden className="text-primary/85 mt-7">
              <BuoyArt className="size-23" />
            </div>
          </div>
        </Reveal>

        <div className="flex flex-col gap-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={f.q} delayMs={i * 50}>
                <div
                  className={cn(
                    'bg-card overflow-hidden rounded-2xl border transition-colors',
                    isOpen ? 'border-primary/40' : 'border-border',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4.5 text-left"
                  >
                    <span className="font-semibold tracking-tight">{f.q}</span>
                    <span
                      className={cn(
                        'flex size-7.5 shrink-0 items-center justify-center rounded-lg transition-all',
                        isOpen
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-primary/10 text-primary',
                      )}
                    >
                      {isOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
                    </span>
                  </button>
                  <div
                    className="grid transition-[grid-template-rows] duration-300 ease-[var(--ease-tide)]"
                    style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                  >
                    <div className="overflow-hidden">
                      <p className="text-muted-foreground px-5 pb-5 text-[0.95rem] leading-relaxed text-pretty">
                        {f.a}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
