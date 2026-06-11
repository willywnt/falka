import { cn } from '@/lib/utils';

/*
 * Capped maritime line-art set (Suar Dermaga): single-stroke, currentColor,
 * ≤96px, used ONLY at low-stakes moments — error/404 routes, empty states,
 * long-job loading. Never inside tables, badges, or forms.
 */

/**
 * Riak divider — THE one structural wave motif. Budgeted to hero/landing/auth
 * section breaks only; never inside tables, cards, or forms.
 */
export function WaveHairline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 12"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn('text-primary/30 h-3 w-full', className)}
      fill="none"
    >
      <path
        d="M0 6c25-7 50-7 75 0s50 7 75 0 50-7 75 0 50 7 75 0 50-7 75 0 50 7 75 0 50-7 75 0 50 7 75 0 50-7 75 0 50 7 75 0 50-7 75 0 50 7 75 0 50-7 75 0 50 7 75 0 50-7 75 0 50 7 75 0"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/** Mercusuar — the "suar" beacon for branded error/404 screens. */
export function LighthouseArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      aria-hidden="true"
      className={cn('size-24', className)}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* beam */}
      <path d="M40 21 16 12m40 9 24-9" strokeDasharray="2.5 5" opacity="0.55" />
      {/* lantern */}
      <rect x="42" y="16" width="12" height="10" rx="2" />
      {/* tapered tower + stripes */}
      <path d="m43.5 26-6 38h21l-6-38" />
      <path d="M41.8 38h12.4M40 50h16" />
      {/* base */}
      <path d="M31 64h34" />
      {/* riak */}
      <path d="M8 77c4-4.4 8-4.4 12 0s8 4.4 12 0 8-4.4 12 0 8 4.4 12 0 8-4.4 12 0 8 4.4 12 0" />
      <path d="M26 87c4-4.4 8-4.4 12 0s8 4.4 12 0 8-4.4 12 0" />
    </svg>
  );
}
