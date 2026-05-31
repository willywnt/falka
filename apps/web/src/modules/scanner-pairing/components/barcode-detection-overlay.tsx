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
          detected ? 'border-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.35)]' : 'border-white/50'
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
          className="absolute rounded-md bg-red-500/10"
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
