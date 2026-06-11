'use client';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { STATUS_BADGE_TONES } from '@/components/status-badge';
import { cn } from '@/lib/utils';

/**
 * "Menipis" badge that explains itself on tap/click/keyboard (Popover, not a
 * hover-only tooltip). Warn tone — low stock is a nudge, not an error.
 */
export function LowStockBadge({ threshold, className }: { threshold: number; className?: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'focus-visible:ring-ring/50 inline-flex w-fit shrink-0 items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap focus-visible:ring-[3px] focus-visible:outline-none',
            STATUS_BADGE_TONES.warn,
            className,
          )}
        >
          Menipis
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-auto max-w-64 p-2.5 text-xs">
        Stok sudah di batas menipis (<span className="num">{threshold}</span>) atau kurang.
      </PopoverContent>
    </Popover>
  );
}
