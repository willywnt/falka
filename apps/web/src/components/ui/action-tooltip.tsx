'use client';

import type { ReactElement } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function ActionTooltip({
  label,
  children,
  contentClassName,
}: {
  label: string;
  children: ReactElement;
  contentClassName?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className={cn('max-w-xs', contentClassName)}>{label}</TooltipContent>
    </Tooltip>
  );
}

export function EllipsisTooltip({
  text,
  className,
  contentClassName,
}: {
  text: string;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* Focusable so keyboard (and tap-to-focus on touch) can reveal the full text. */}
        <span
          tabIndex={0}
          className={cn(
            'focus-visible:ring-ring/50 block truncate rounded-sm focus-visible:ring-2 focus-visible:outline-none',
            className,
          )}
        >
          {text}
        </span>
      </TooltipTrigger>
      <TooltipContent className={cn('max-w-sm break-words', contentClassName)}>
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
