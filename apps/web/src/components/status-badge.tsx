import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Tokenized status tones — the ONLY allowed source for status-badge colors
 * (replaces the per-module raw emerald/amber/sky/rose maps). Dark mode comes
 * free because every tone resolves through theme tokens.
 *
 * Semantics:
 * - ok      → done/positive (signed-up family — calm green)
 * - info    → in-progress/steady (status-info blue)
 * - warn    → needs attention, NOT an error (soft suar amber)
 * - urgent  → act now (solid suar fill; still not an error)
 * - danger  → failure/cancellation (destructive)
 * - neutral → inactive/idle
 */
export const STATUS_BADGE_TONES = {
  ok: 'border-status-ok/30 bg-status-ok/10 text-status-ok',
  info: 'border-status-info/30 bg-status-info/10 text-status-info',
  warn: 'border-highlight/40 bg-highlight/15 text-status-warn',
  urgent: 'border-transparent bg-highlight text-highlight-foreground',
  danger: 'border-destructive/30 bg-destructive/10 text-destructive',
  neutral: 'border-border bg-muted text-muted-foreground',
} as const;

export type StatusTone = keyof typeof STATUS_BADGE_TONES;

export function StatusBadge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: StatusTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap [&>svg]:size-3',
        STATUS_BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
