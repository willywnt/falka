import { Image as ImageIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Read-only square thumbnail for a user-uploaded image (e.g. a variant photo),
 * falling back to a placeholder icon when there is none. Editing the photo lives
 * on the product detail page; everywhere else just displays it.
 */
export function ImageThumb({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center overflow-hidden rounded border',
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- user-uploaded R2 image on a dynamic host
        <img src={src} alt={alt} className="size-full object-cover" />
      ) : (
        <ImageIcon className="size-4" aria-hidden />
      )}
    </span>
  );
}
