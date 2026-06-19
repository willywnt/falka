import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/** Section eyebrow + heading + optional sub. Pure presentational (server-safe). */
export function SectionHead({
  eyebrow,
  title,
  sub,
  center = false,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  sub?: ReactNode;
  center?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('max-w-2xl', center && 'mx-auto text-center', className)}>
      <p
        className={cn(
          'eyebrow text-primary inline-flex items-center gap-2',
          center && 'justify-center',
        )}
      >
        {!center && <span className="bg-primary inline-block h-px w-4.5" />}
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl lg:text-[2.3rem] lg:leading-[1.1]">
        {title}
      </h2>
      {sub ? (
        <p
          className={cn(
            'text-muted-foreground mt-3.5 text-[1.02rem] leading-relaxed text-pretty',
            center && 'mx-auto',
          )}
        >
          {sub}
        </p>
      ) : null}
    </div>
  );
}

/** Breathing teal beacon dot with an expanding pulse ring. */
export function SuarDot({ className }: { className?: string }) {
  return (
    <span className={cn('relative inline-flex size-2.5', className)}>
      <span className="bg-primary suar-pulse absolute inset-0 rounded-full" />
      <span className="bg-primary pandu-breath relative size-2.5 rounded-full" />
    </span>
  );
}

const RIAK_PATHS = [
  { o: 'opacity-[0.05]', dur: '26s', y: 60, amp: 14 },
  { o: 'opacity-[0.08]', dur: '18s', y: 78, amp: 18 },
  { o: 'opacity-[0.12]', dur: '12s', y: 98, amp: 22 },
];

function wavePath(y: number, amp: number) {
  let d = `M0 ${y}`;
  const seg = 180;
  for (let x = 0; x <= 1440; x += seg) {
    d += ` C ${x + seg * 0.25} ${y - amp}, ${x + seg * 0.75} ${y + amp}, ${x + seg} ${y}`;
  }
  return `${d} L1440 220 L0 220 Z`;
}

/**
 * Drifting parallax wave bands — the maritime "calm water". Absolutely positioned;
 * place inside a `relative overflow-hidden` parent.
 */
export function RiakWaves({
  bands = 3,
  heightClass = 'h-44',
  className,
}: {
  bands?: number;
  heightClass?: string;
  className?: string;
}) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      aria-hidden
    >
      {RIAK_PATHS.slice(0, bands).map((l, i) => (
        <svg
          key={i}
          viewBox="0 0 1440 220"
          preserveAspectRatio="none"
          className={cn('text-primary absolute bottom-0 left-0 w-[200%]', heightClass)}
          style={{ animation: `riak-drift ${l.dur} linear infinite`, willChange: 'transform' }}
        >
          <path className={l.o} fill="currentColor" d={wavePath(l.y, l.amp)} />
        </svg>
      ))}
    </div>
  );
}
