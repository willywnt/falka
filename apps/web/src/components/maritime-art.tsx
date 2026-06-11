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

/** Pelampung (buoy) — calm "belum ada apa-apa" empty states. */
export function BuoyArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      aria-hidden="true"
      className={cn('size-20', className)}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* mast + light */}
      <path d="M48 18v12" />
      <circle cx="48" cy="14" r="3.5" />
      {/* body */}
      <path d="M38 30h20l4 18H34l4-18Z" />
      <path d="M36 39h24" />
      {/* waterline through the base */}
      <path d="M30 56c4.5-4.8 9-4.8 13.5 0s9 4.8 13.5 0 9-4.8 13.5 0" opacity="0.9" />
      <path d="M10 56c4.5-4.8 9-4.8 13.5 0" opacity="0.9" />
      {/* riak below */}
      <path d="M18 70c4.5-4.8 9-4.8 13.5 0s9 4.8 13.5 0 9-4.8 13.5 0 9 4.8 13.5 0" />
      <path d="M30 82c4.5-4.8 9-4.8 13.5 0s9 4.8 13.5 0" />
    </svg>
  );
}

/** Camar (gull) — light, positive "semua beres / laut tenang" moments. */
export function GullArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      aria-hidden="true"
      className={cn('size-20', className)}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* two gulls */}
      <path d="M28 34c5-6 11-6 15 0 4-6 10-6 15 0" />
      <path d="M56 22c3.5-4 7.5-4 10.5 0 3-4 7-4 10.5 0" opacity="0.7" />
      {/* horizon + sun */}
      <circle cx="26" cy="48" r="6" opacity="0.7" />
      <path d="M8 62h80" opacity="0.5" strokeDasharray="2.5 5" />
      {/* riak */}
      <path d="M18 72c4.5-4.8 9-4.8 13.5 0s9 4.8 13.5 0 9-4.8 13.5 0 9 4.8 13.5 0" />
      <path d="M32 84c4.5-4.8 9-4.8 13.5 0s9 4.8 13.5 0" />
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
