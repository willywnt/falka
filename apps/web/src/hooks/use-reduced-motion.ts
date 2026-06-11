'use client';

import { useMediaQuery } from '@/hooks/use-media-query';

/**
 * prefers-reduced-motion, as state. The global CSS guard freezes CSS
 * animations; this hook covers JS-driven motion (recharts isAnimationActive,
 * countdowns, imperative effects).
 */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
