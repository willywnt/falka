import { cn } from '@/lib/utils';

/**
 * The Palka mark: a cargo box (your stock) resting on two riak (small-wave)
 * strokes — "muatan tertata di atas air tenang". Palka = a ship's cargo hold,
 * tying the brand to the maritime "Suar Dermaga" system and to inventory.
 * Single source for every brand surface (sidebar, navbar sheet, auth, landing,
 * share page); favicon/og assets in `app/icon.svg` + `app/*-image.tsx` mirror
 * these paths.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={cn('size-5', className)}>
      <path d="M16 3.2 23.4 7.4 16 11.6 8.6 7.4Z" fill="currentColor" fillOpacity="0.18" />
      <path
        d="M16 3.2 23.4 7.4 23.4 13 16 17.2 8.6 13 8.6 7.4Z"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinejoin="round"
      />
      <path
        d="M8.6 7.4 16 11.6 23.4 7.4M16 11.6V17.2"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M2.5 21.6c2.25-2.6 4.5-2.6 6.75 0s4.5 2.6 6.75 0 4.5-2.6 6.75 0 4.5 2.6 6.75 0"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <path
        d="M6.8 26.6c2.05-2.3 4.1-2.3 6.15 0s4.1 2.3 6.15 0 4.1-2.3 6.15 0"
        stroke="currentColor"
        strokeWidth="2.3"
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
