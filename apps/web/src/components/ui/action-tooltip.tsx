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
        <span className={cn('block truncate', className)}>{text}</span>
      </TooltipTrigger>
      <TooltipContent className={cn('max-w-sm break-words', contentClassName)}>
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
