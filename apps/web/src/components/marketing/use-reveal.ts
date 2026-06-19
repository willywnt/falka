'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Adds the `is-in` class (see globals.css `.reveal`) the first time the element
 * scrolls into view. Honours `prefers-reduced-motion` via the global CSS guard.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add('is-in');
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.18 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/** Returns a ref + a boolean that flips true the first time the element is seen. */
export function useInView<T extends HTMLElement = HTMLDivElement>(threshold = 0.35) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setSeen(true);
            io.unobserve(el);
          }
        });
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen] as const;
}

/**
 * Count a number up from 0 the first time it enters the viewport. Returns a ref
 * to attach to the displaying element and the current (formatted) display value.
 */
export function useCountUp<T extends HTMLElement = HTMLParagraphElement>(
  target: number,
  { duration = 1400, decimals = 0 }: { duration?: number; decimals?: number } = {},
) {
  const ref = useRef<T>(null);
  const [val, setVal] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const run = () => {
      if (started.current) return;
      started.current = true;
      if (reduce) {
        setVal(target);
        return;
      }
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(target * eased);
        if (p < 1) requestAnimationFrame(tick);
        else setVal(target);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            run();
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);

  const display = decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString('id-ID');
  return [ref, display] as const;
}
