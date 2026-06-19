'use client';

import { TrendingUp } from 'lucide-react';

import { NumberDelta } from '@/components/number-delta';
import { StatusBadge } from '@/components/status-badge';
import { useCountUp, useInView } from './use-reveal';

const REV = [8.2, 9.1, 8.6, 10.4, 11.8, 11.2, 13.6, 14.9, 14.1, 16.8, 18.2, 19.4];
const MAR = [22, 24, 23, 26, 27, 26, 29, 31, 30, 33, 34, 36];
const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

/** Omzet (area+line) & margin chart — draws itself on scroll-in with count-up KPIs. */
export function OmzetChart() {
  const [ref, seen] = useInView<HTMLDivElement>(0.4);
  const [revRef, revTxt] = useCountUp<HTMLParagraphElement>(19.4, { decimals: 1 });
  const [marRef, marTxt] = useCountUp<HTMLParagraphElement>(36);

  const W = 520;
  const H = 240;
  const padL = 8;
  const padT = 16;
  const iw = W - padL - 8;
  const ih = H - padT - 28;
  const maxRev = 22;
  const x = (i: number) => padL + (i / (REV.length - 1)) * iw;
  const yR = (v: number) => padT + ih - (v / maxRev) * ih;
  const yM = (v: number) => padT + ih - (v / 50) * ih;
  const linePts = REV.map((v, i) => `${x(i)},${yR(v)}`).join(' ');
  const areaPath =
    `M${x(0)},${yR(REV[0]!)} ` +
    REV.map((v, i) => `L${x(i)},${yR(v)}`).join(' ') +
    ` L${x(REV.length - 1)},${padT + ih} L${x(0)},${padT + ih} Z`;
  const marPath = 'M' + MAR.map((v, i) => `${x(i)},${yM(v)}`).join(' L');

  return (
    <div ref={ref}>
      <div className="mb-3.5 flex flex-wrap gap-7">
        <div>
          <p className="eyebrow text-muted-foreground">Omzet · Des</p>
          <p ref={revRef} className="num-display mt-0.5 text-3xl">
            Rp{revTxt} jt
          </p>
          <NumberDelta value={15.5} format={(a) => `${a}% MoM`} arrow />
        </div>
        <div>
          <p className="eyebrow text-muted-foreground">Margin bersih</p>
          <p ref={marRef} className="num-display mt-0.5 text-3xl">
            {marTxt}%
          </p>
          <NumberDelta value={2} format={(a) => `${a} poin`} arrow />
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible">
        <defs>
          <linearGradient id="omzetFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((g, i) => (
          <line
            key={i}
            x1={padL}
            x2={W - 8}
            y1={padT + ih * g}
            y2={padT + ih * g}
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray="2 5"
          />
        ))}
        <path
          d={areaPath}
          fill="url(#omzetFill)"
          style={{ opacity: seen ? 1 : 0, transition: 'opacity 1.1s 0.4s ease' }}
        />
        <polyline
          points={linePts}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 1400,
            strokeDashoffset: seen ? 0 : 1400,
            transition: 'stroke-dashoffset 1.6s var(--ease-tide)',
          }}
        />
        <path
          d={marPath}
          fill="none"
          stroke="var(--chart-2)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="1 6"
          style={{ opacity: seen ? 0.9 : 0, transition: 'opacity 1s 0.9s ease' }}
        />
        {REV.map((v, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={yR(v)}
            r="3"
            fill="var(--card)"
            stroke="var(--primary)"
            strokeWidth="2"
            style={{ opacity: seen ? 1 : 0, transition: `opacity 0.4s ${0.5 + i * 0.08}s ease` }}
          />
        ))}
        {MONTHS.map((m, i) => (
          <text
            key={i}
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            fontSize="10"
            fill="var(--muted-foreground)"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {m}
          </text>
        ))}
      </svg>

      <div className="mt-1.5 flex gap-4.5">
        <Legend label="Omzet (jt)" colorVar="--primary" />
        <Legend label="Margin %" colorVar="--chart-2" dashed />
      </div>
    </div>
  );
}

function Legend({
  label,
  colorVar,
  dashed,
}: {
  label: string;
  colorVar: string;
  dashed?: boolean;
}) {
  return (
    <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
      <span
        className="h-0 w-4"
        style={{ borderTop: `2px ${dashed ? 'dashed' : 'solid'} var(${colorVar})` }}
      />
      {label}
    </span>
  );
}

const SKUS = [
  { name: 'Kaos hitam · M', vel: 92, days: 4, qty: 60, urgent: true },
  { name: 'Hoodie navy · L', vel: 74, days: 9, qty: 40, urgent: false },
  { name: 'Topi rajut', vel: 58, days: 14, qty: 24, urgent: false },
  { name: 'Kaos putih · S', vel: 39, days: 22, qty: 0, urgent: false },
];

/** Sell-through velocity bars + smart restock suggestion. Fills on scroll-in. */
export function SellThrough() {
  const [ref, seen] = useInView<HTMLDivElement>(0.35);
  return (
    <div ref={ref} className="flex flex-col gap-3.5">
      {SKUS.map((s, i) => (
        <div key={s.name}>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-sm font-semibold">{s.name}</span>
            <span className="num text-muted-foreground text-xs">habis ±{s.days} hari</span>
          </div>
          <div className="bg-muted relative h-6.5 overflow-hidden rounded-lg">
            <div
              className="absolute inset-y-0 left-0 flex items-center justify-end pr-2"
              style={{
                width: seen ? `${s.vel}%` : 0,
                background: s.urgent
                  ? 'color-mix(in oklab, var(--signed-down) 75%, var(--card))'
                  : 'color-mix(in oklab, var(--primary) 70%, var(--card))',
                transition: `width 1.2s ${0.2 + i * 0.12}s var(--ease-tide)`,
              }}
            >
              <span
                className="num text-[0.66rem] font-semibold text-white"
                style={{ opacity: seen ? 1 : 0, transition: 'opacity 0.4s 1.2s' }}
              >
                {s.vel}%
              </span>
            </div>
          </div>
          {s.qty > 0 && (
            <div
              className="mt-1.5 flex items-center gap-1.5"
              style={{
                opacity: seen ? 1 : 0,
                transform: seen ? 'none' : 'translateX(-6px)',
                transition: `all 0.5s ${0.6 + i * 0.12}s ease`,
              }}
            >
              <TrendingUp
                className="size-3.5"
                style={{ color: s.urgent ? 'var(--signed-down)' : 'var(--primary)' }}
              />
              <span className="text-muted-foreground text-xs">
                Saran: buat PO <span className="num text-foreground font-semibold">{s.qty}</span>{' '}
                pcs
              </span>
              {s.urgent && <StatusBadge tone="urgent">Mendesak</StatusBadge>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
