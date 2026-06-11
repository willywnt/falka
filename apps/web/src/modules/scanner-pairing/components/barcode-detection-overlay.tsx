'use client';

import type { BarcodeOverlayBounds } from '../utils/barcode-overlay-bounds';
import { getDefaultGuideBounds } from '../utils/barcode-overlay-bounds';

type BarcodeDetectionOverlayProps = {
  bounds: BarcodeOverlayBounds | null;
  detected: boolean;
};

export function BarcodeDetectionOverlay({ bounds, detected }: BarcodeDetectionOverlayProps) {
  const box = bounds ?? getDefaultGuideBounds();

  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className={`absolute rounded-md border-2 transition-colors duration-150 ${
          detected ? 'border-destructive ring-destructive/35 ring-2' : 'border-white/50'
        }`}
        style={{
          left: `${box.left}%`,
          top: `${box.top}%`,
          width: `${box.width}%`,
          height: `${box.height}%`,
        }}
      />
      {detected ? (
        <div
          className="bg-destructive/10 absolute rounded-md"
          style={{
            left: `${box.left}%`,
            top: `${box.top}%`,
            width: `${box.width}%`,
            height: `${box.height}%`,
          }}
        />
      ) : null}
    </div>
  );
}
