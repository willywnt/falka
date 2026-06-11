import { cn } from '@/lib/utils';

/**
 * The Falka mark: a falcon eye resting on two riak (small-wave) strokes —
 * "a sharp eye over calm water". Single source for every brand surface
 * (sidebar, navbar sheet, auth, landing, share page); favicon/og assets in
 * `app/icon.svg` + `app/*-image.tsx` mirror these paths.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={cn('size-5', className)}>
      <circle cx="16" cy="11.5" r="6.25" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="16" cy="11.5" r="2.4" fill="currentColor" />
      <path
        d="M2.5 21.5c2.25-2.6 4.5-2.6 6.75 0s4.5 2.6 6.75 0 4.5-2.6 6.75 0 4.5 2.6 6.75 0"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M6.8 26.5c2.05-2.3 4.1-2.3 6.15 0s4.1 2.3 6.15 0 4.1-2.3 6.15 0"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** The mark inside its square brand chip (teal by default; override via className). */
export function BrandBadge({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span
      className={cn(
        'bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg',
        className,
      )}
    >
      <BrandMark className={markClassName} />
    </span>
  );
}
