'use client';

import { useEffect, useRef } from 'react';

/** Damped pointer-parallax wrapper for the hero card (desktop, motion-on only). */
export function HeroFloat({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia?.('(pointer: coarse)').matches) return;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const tick = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      if (ref.current) ref.current.style.transform = `translate3d(${cx * 14}px, ${cy * 10}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('pointermove', onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);
  return (
    <div ref={ref} className="will-change-transform">
      {children}
    </div>
  );
}
