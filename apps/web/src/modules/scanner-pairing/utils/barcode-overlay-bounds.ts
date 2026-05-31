/** Bounding box as percentages of the video container (for CSS positioning). */
export type BarcodeOverlayBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type PointLike = { getX(): number; getY(): number };

const DEFAULT_GUIDE: BarcodeOverlayBounds = {
  left: 8,
  top: 38,
  width: 84,
  height: 22,
};

/**
 * Maps ZXing result points from video pixel space into overlay percentages,
 * accounting for object-cover letterboxing.
 */
export function boundsFromResultPoints(
  points: PointLike[] | undefined,
  video: HTMLVideoElement | null,
  container: HTMLElement | null,
): BarcodeOverlayBounds | null {
  if (!video || !container || !points?.length) {
    return null;
  }

  const videoW = video.videoWidth;
  const videoH = video.videoHeight;
  if (!videoW || !videoH) {
    return null;
  }

  const xs = points.map((p) => p.getX());
  const ys = points.map((p) => p.getY());
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const rect = container.getBoundingClientRect();
  const scale = Math.max(rect.width / videoW, rect.height / videoH);
  const renderedW = videoW * scale;
  const renderedH = videoH * scale;
  const offsetX = (rect.width - renderedW) / 2;
  const offsetY = (rect.height - renderedH) / 2;

  const padX = (maxX - minX) * 0.12 + 8;
  const padY = (maxY - minY) * 0.2 + 6;

  const leftPx = Math.max(0, minX * scale + offsetX - padX);
  const topPx = Math.max(0, minY * scale + offsetY - padY);
  const widthPx = Math.min(rect.width - leftPx, (maxX - minX) * scale + padX * 2);
  const heightPx = Math.min(rect.height - topPx, (maxY - minY) * scale + padY * 2);

  if (widthPx < 4 || heightPx < 4) {
    return DEFAULT_GUIDE;
  }

  return {
    left: (leftPx / rect.width) * 100,
    top: (topPx / rect.height) * 100,
    width: (widthPx / rect.width) * 100,
    height: (heightPx / rect.height) * 100,
  };
}

export function getDefaultGuideBounds(): BarcodeOverlayBounds {
  return { ...DEFAULT_GUIDE };
}
