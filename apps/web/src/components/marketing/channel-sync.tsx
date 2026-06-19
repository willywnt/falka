'use client';

import { useEffect, useState } from 'react';
import { Check, RefreshCw } from 'lucide-react';

const CHANNELS = [
  { key: 'shopee', name: 'Shopee', dot: 'oklch(0.66 0.2 35)' },
  { key: 'tokopedia', name: 'Tokopedia', dot: 'oklch(0.62 0.17 150)' },
  { key: 'tiktok', name: 'TikTok Shop', dot: 'oklch(0.5 0.02 250)' },
];
const XS = [53, 160, 267];

/**
 * The live cross-channel stock-sync diagram: one StockLedger number mirrored
 * across marketplaces. A periodic "sale" flashes a channel, decrements the
 * number, and re-syncs — illustrating "satu angka stok, semua channel".
 */
export function ChannelSync() {
  const [stock, setStock] = useState(142);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let alive = true;
    const id = setInterval(() => {
      if (!alive) return;
      const ch = CHANNELS[Math.floor(Math.random() * CHANNELS.length)]!;
      const sold = 1 + Math.floor(Math.random() * 2);
      setFlash(ch.key);
      setStock((s) => {
        const next = s - sold;
        return next < 12 ? 142 : next;
      });
      setTimeout(() => {
        if (alive) setFlash(null);
      }, 1100);
    }, 3200);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="relative">
      {/* central ledger node */}
      <div className="bg-card relative z-[2] flex items-center justify-between gap-4 rounded-2xl border p-5 shadow-sm">
        <div>
          <p className="eyebrow text-primary">StockLedger · sumber kebenaran</p>
          <p className="mt-1.5 font-semibold tracking-tight">Kaos hitam · M</p>
        </div>
        <div className="text-right">
          <span
            className="num-display block text-[2.4rem] leading-none transition-colors"
            style={{ color: flash ? 'var(--signed-down)' : 'var(--foreground)' }}
          >
            {stock}
          </span>
          <p className="eyebrow text-muted-foreground mt-1">siap jual</p>
        </div>
      </div>

      {/* connectors */}
      <svg
        viewBox="0 0 320 70"
        preserveAspectRatio="none"
        className="-mt-0.5 block h-14 w-full"
        aria-hidden
      >
        {XS.map((x, i) => {
          const d = `M160 0 C 160 34, ${x} 30, ${x} 66`;
          const active = flash === CHANNELS[i]!.key;
          return (
            <g key={i}>
              <path d={d} fill="none" stroke="var(--border)" strokeWidth="2" />
              <path
                d={d}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2"
                className="transition-opacity duration-300"
                strokeOpacity={active ? 0.9 : 0.18}
              />
              <circle
                r="3"
                fill="var(--primary)"
                className="mk-flow"
                style={{ offsetPath: `path("${d}")`, animationDelay: `${i * 0.5}s` }}
              />
            </g>
          );
        })}
      </svg>

      {/* channel chips */}
      <div className="grid grid-cols-3 gap-2.5">
        {CHANNELS.map((c) => {
          const active = flash === c.key;
          return (
            <div
              key={c.key}
              className="bg-card rounded-xl border p-3 transition-all duration-300"
              style={{
                borderColor: active ? 'var(--primary)' : 'var(--border)',
                transform: active ? 'translateY(-3px)' : 'none',
                boxShadow: active
                  ? 'var(--shadow-card, 0 8px 24px -12px rgb(0 0 0 / 0.12))'
                  : 'none',
              }}
            >
              <div className="mb-2 flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: c.dot }} />
                <span className="text-muted-foreground text-xs font-semibold">{c.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="num font-bold">{stock}</span>
                <span
                  className="eyebrow inline-flex items-center gap-1"
                  style={{ color: active ? 'var(--primary)' : 'var(--signed-up)' }}
                >
                  {active ? <RefreshCw className="size-3" /> : <Check className="size-3" />}
                  {active ? 'sinkron' : 'sama'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
