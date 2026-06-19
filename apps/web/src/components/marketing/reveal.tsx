'use client';

import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { useReveal } from './use-reveal';

/** Scroll-reveal wrapper — fades/rises children in when they enter the viewport. */
export function Reveal({
  children,
  delayMs = 0,
  className,
  style,
}: {
  children: ReactNode;
  delayMs?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn('reveal', className)}
      style={{ transitionDelay: `${delayMs}ms`, ...style }}
    >
      {children}
    </div>
  );
}
