import { cn } from '@/lib/utils';

/** Up to two initials from a name or email local-part. */
function toInitials(value: string): string {
  const base = value.includes('@') ? (value.split('@')[0] ?? value) : value;
  const parts = base
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean);
  const first = parts[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1] ?? '') : '';
  const letters = (first.charAt(0) + last.charAt(0)).trim();
  return (letters || first.slice(0, 2) || '?').toUpperCase();
}

/** Lightweight initials avatar — no image, just a tinted monogram. */
export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'bg-primary/10 text-primary inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold select-none',
        className,
      )}
    >
      {toInitials(name)}
    </span>
  );
}
