import {
  MiniQueueMock,
  PackingScanMock,
  PosTotalMock,
  ProfitMock,
} from '@/components/marketing/product-mocks';
import { APP_NAME } from '@palka/config/constants';

import { Reveal } from './reveal';
import { SectionHead } from './primitives';

const DAY_STEPS = [
  {
    time: 'Pagi',
    text: 'Buka Anjungan — antrian kerja sudah dihitung, kamu tahu mulai dari mana.',
    Mock: MiniQueueMock,
  },
  {
    time: 'Siang',
    text: 'Scan resi, kamera merekam packing — satu video bukti tiap paket.',
    Mock: PackingScanMock,
  },
  {
    time: 'Sore',
    text: 'Pembeli datang ke toko? Kasir memotong stok yang sama — tak bisa oversell.',
    Mock: PosTotalMock,
  },
  {
    time: 'Malam',
    text: 'Tutup hari dengan angka jujur: omzet dan margin bersih, retur sudah dihitung.',
    Mock: ProfitMock,
  },
];

/** "Satu hari bersama Palka" — the seller's day in 4 mock-backed steps. */
export function DaySteps() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-22">
      <Reveal>
        <SectionHead
          eyebrow={`Satu hari bersama ${APP_NAME}`}
          title="Dari pagi sampai tutup toko, satu tempat kerja."
        />
      </Reveal>
      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {DAY_STEPS.map(({ time, text, Mock }, i) => (
          <Reveal key={time} delayMs={i * 90}>
            <div className="bg-card flex h-full flex-col gap-4 rounded-2xl border p-5 shadow-sm">
              <div>
                <p className="eyebrow text-primary">{time}</p>
                <p className="mt-2 text-sm leading-relaxed text-pretty">{text}</p>
              </div>
              <div className="mt-auto">
                <Mock />
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
