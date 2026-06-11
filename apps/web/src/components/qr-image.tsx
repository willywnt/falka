'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type QrImageProps = {
  /** The value to encode (e.g. a product barcode or SKU). */
  value: string;
  /** Rendered pixel size (square). */
  size?: number;
  className?: string;
};

/** Renders a QR code for `value` as a PNG, generated on the client on demand. */
export function QrImage({ value, size = 160, className }: QrImageProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    // Render at 2× for crisp display/print; margin 2 keeps a scannable quiet zone.
    void QRCode.toDataURL(value, { width: size * 2, margin: 2 })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) {
          setDataUrl(null);
          setFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={`QR gagal dibuat untuk ${value}`}
        className={cn(
          'border-destructive/30 text-destructive flex items-center justify-center rounded border border-dashed p-2 text-center text-xs',
          className,
        )}
        style={{ width: size, height: size }}
      >
        QR gagal dibuat
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <Skeleton
        className={cn('rounded', className)}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- dynamic QR data URL
    <img
      src={dataUrl}
      alt={`Kode QR untuk ${value}`}
      width={size}
      height={size}
      className={className}
    />
  );
}
