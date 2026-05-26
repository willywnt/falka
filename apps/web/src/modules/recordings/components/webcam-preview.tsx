'use client';

import { useEffect, useRef } from 'react';

export function WebcamPreview({
  stream,
  isRecording,
}: {
  stream: MediaStream | null;
  isRecording: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = stream;

    if (stream) {
      void video.play().catch(() => {
        // Autoplay may be blocked until user interaction; preview still attaches stream.
      });
    }

    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  return (
    <div className="relative overflow-hidden rounded-xl border bg-black">
      <video
        ref={videoRef}
        className="aspect-video w-full object-cover"
        muted
        playsInline
        autoPlay
      />
      {!stream ? (
        <div className="text-muted-foreground absolute inset-0 flex items-center justify-center bg-black/80 text-sm">
          Webcam preview will appear here
        </div>
      ) : null}
      {isRecording ? (
        <div className="absolute top-3 left-3 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
          REC
        </div>
      ) : null}
    </div>
  );
}
