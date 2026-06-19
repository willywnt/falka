import { cn } from '@/lib/utils';

/*
 * Capped maritime line-art set (Suar Dermaga): single-stroke, currentColor,
 * ≤128px. Used at brand/landing/empty/error moments — never inside tables,
 * badges, or forms.
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

/** Pelampung (buoy) — calm "belum ada apa-apa" empty states + FAQ aside. */
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
      <path d="M48 18v12" />
      <circle cx="48" cy="14" r="3.5" />
      <path d="M38 30h20l4 18H34l4-18Z" />
      <path d="M36 39h24" />
      <path d="M30 56c4.5-4.8 9-4.8 13.5 0s9 4.8 13.5 0 9-4.8 13.5 0" opacity="0.9" />
      <path d="M10 56c4.5-4.8 9-4.8 13.5 0" opacity="0.9" />
      <path d="M18 70c4.5-4.8 9-4.8 13.5 0s9 4.8 13.5 0 9-4.8 13.5 0 9 4.8 13.5 0" />
      <path d="M30 82c4.5-4.8 9-4.8 13.5 0s9 4.8 13.5 0" />
    </svg>
  );
}

/** Camar (gull) — light, positive moments; drifts on the landing. */
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
      <path d="M28 40c6-8 13-8 18 0 5-8 12-8 18 0" />
    </svg>
  );
}

/** Mercusuar — the "suar" beacon. Pass `beam` to sweep a light cone (landing). */
export function LighthouseArt({ className, beam = false }: { className?: string; beam?: boolean }) {
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
      {beam ? (
        <g className="beam-sweep" style={{ transformOrigin: '48px 22px' }}>
          <path d="M48 22 14 8M48 22 82 8" strokeDasharray="2.5 5" opacity="0.5" />
          <path d="M48 22 18 2 78 2Z" fill="currentColor" fillOpacity="0.08" stroke="none" />
        </g>
      ) : (
        <path d="M40 21 16 12m40 9 24-9" strokeDasharray="2.5 5" opacity="0.55" />
      )}
      <rect x="42" y="16" width="12" height="10" rx="2" />
      <path d="m43.5 26-6 38h21l-6-38" />
      <path d="M41.8 38h12.4M40 50h16" />
      <path d="M31 64h34" />
      <path d="M8 77c4-4.4 8-4.4 12 0s8 4.4 12 0 8-4.4 12 0 8 4.4 12 0 8-4.4 12 0 8 4.4 12 0" />
      <path d="M26 87c4-4.4 8-4.4 12 0s8 4.4 12 0 8-4.4 12 0" />
    </svg>
  );
}

/** Sauh — anchor (Voyage "Dermaga" station). */
export function AnchorArt({ className }: { className?: string }) {
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
      <circle cx="48" cy="18" r="6" />
      <path d="M48 24v48" />
      <path d="M34 36h28" />
      <path d="M22 56c0 16 12 24 26 24s26-8 26-24" />
      <path d="m22 56-7 5 9 1M74 56l7 5-9 1" />
    </svg>
  );
}

/** Perahu — little sailboat (Voyage route marker). */
export function BoatArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      aria-hidden="true"
      className={cn('size-12', className)}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 62h52l-9 13H31z" />
      <path d="M48 20v38" />
      <path d="M50 24c16 5 16 24 2 30" />
      <path d="M44 58V30c-12 4-16 16-12 28Z" />
    </svg>
  );
}

/** Kompas — compass rose (optional accent). */
export function CompassArt({ className }: { className?: string }) {
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
      <circle cx="48" cy="48" r="30" />
      <path d="M48 24 55 48 48 72 41 48Z" />
      <path d="M24 48h6M66 48h6M48 24v6M48 66v6" />
      <circle cx="48" cy="48" r="2.4" fill="currentColor" />
    </svg>
  );
}
