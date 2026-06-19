'use client';

import { NumberDelta } from '@/components/number-delta';
import { useInView } from './use-reveal';

const LEDGER = [
  { reason: 'RESTOCK', delta: 24, time: 'Sen 08.12' },
  { reason: 'SALE', delta: -2, time: 'Sen 10.40' },
  { reason: 'ORDER_RESERVE', delta: -5, time: 'Sen 13.05' },
  { reason: 'SALE', delta: -1, time: 'Sen 16.22' },
  { reason: 'RETURN', delta: 1, time: 'Sel 09.21' },
];

/** Append-only stock ledger for one SKU — rows stamp in with a running balance. */
export function LedgerTrail() {
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  let running = 164;
  return (
    <div ref={ref} className="bg-card overflow-hidden rounded-2xl border">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="num text-sm font-semibold">KAOS-HTM-M</span>
        <span className="text-muted-foreground text-xs">append-only · tak bisa diedit</span>
      </div>
      <ul className="px-4">
        {LEDGER.map((r, i) => {
          running += r.delta;
          return (
            <li
              key={i}
              className="flex items-center justify-between gap-3 py-2.5 [&:not(:first-child)]:border-t"
              style={{
                opacity: seen ? 1 : 0,
                transform: seen ? 'none' : 'translateY(8px)',
                transition: `all 0.5s ${i * 0.18}s var(--ease-tide)`,
              }}
            >
              <span className="num text-muted-foreground text-xs">{r.reason}</span>
              <span className="flex items-center gap-3.5">
                <NumberDelta value={r.delta} className="text-xs" arrow />
                <span className="num text-foreground min-w-[30px] text-right text-xs font-semibold">
                  {running}
                </span>
                <span className="num text-muted-foreground/70 text-[0.7rem]">{r.time}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
